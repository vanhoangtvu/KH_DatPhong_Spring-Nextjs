package com.hotelbookingproject.BLITCoding.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelbookingproject.BLITCoding.exception.InvalidBookingException;
import com.hotelbookingproject.BLITCoding.response.ChatConversationDetailResponse;
import com.hotelbookingproject.BLITCoding.response.ChatConversationMessageResponse;
import com.hotelbookingproject.BLITCoding.response.ChatConversationSummaryResponse;
import com.hotelbookingproject.BLITCoding.response.ChatSocketEventResponse;
import com.hotelbookingproject.BLITCoding.security.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class ChatWebSocketService {

    private final ObjectMapper objectMapper;
    private final JwtUtils jwtUtils;
    private final Map<String, ChatConversationState> conversations = new ConcurrentHashMap<>();
    private final Map<String, ChatSessionContext> sessions = new ConcurrentHashMap<>();
    private final Map<String, Set<WebSocketSession>> conversationSessions = new ConcurrentHashMap<>();

    public ChatSocketEventResponse connectCustomer(WebSocketSession session, String conversationId, String customerName, String customerPhone) {
        String normalizedName = normalizeText(customerName, "Khách hàng");
        String normalizedPhone = normalizeText(customerPhone, "");
        if (normalizedPhone.isBlank()) {
            throw new InvalidBookingException("Vui lòng nhập số điện thoại để bắt đầu chat.");
        }

        ChatConversationState conversation = resolveConversation(conversationId, normalizedName, normalizedPhone);
        registerSession(session, conversation.conversationId, ChatRole.CUSTOMER, normalizedName, normalizedPhone);
        return buildConnectedEvent(conversation.conversationId);
    }

    public ChatSocketEventResponse connectAdmin(WebSocketSession session, String conversationId, String token) {
        if (!jwtUtils.validateToken(token) || !jwtUtils.hasRole(token, "ADMIN")) {
            throw new InvalidBookingException("Token admin không hợp lệ.");
        }

        ChatConversationState conversation = findConversation(conversationId);
        if (conversation == null) {
            throw new InvalidBookingException("Không tìm thấy cuộc trò chuyện.");
        }

        registerSession(session, conversation.conversationId, ChatRole.ADMIN, "Admin", "");
        return buildConnectedEvent(conversation.conversationId);
    }

    public void handleIncomingMessage(WebSocketSession session, String rawMessage) {
        ChatSessionContext context = sessions.get(session.getId());
        if (context == null || context.conversationId == null || rawMessage == null || rawMessage.isBlank()) {
            return;
        }

        String content = extractContent(rawMessage);
        if (content.isBlank()) {
            return;
        }

        ChatConversationState conversation = findConversation(context.conversationId);
        if (conversation == null) {
            return;
        }

        ChatConversationMessageResponse message = new ChatConversationMessageResponse(
                UUID.randomUUID().toString(),
                conversation.conversationId,
                context.role.name(),
                context.senderName,
                content,
                Instant.now().toString()
        );
        conversation.messages.add(message);
        conversation.lastMessageAt = message.getTimestamp();
        conversation.lastMessage = content;
        broadcastToConversation(conversation.conversationId, new ChatSocketEventResponse(
                "message",
                conversation.conversationId,
                null,
                null,
                message,
                null,
                message.getTimestamp()
        ));
    }

    public void disconnect(WebSocketSession session) {
        ChatSessionContext context = sessions.remove(session.getId());
        if (context == null || context.conversationId == null) {
            return;
        }

        Set<WebSocketSession> activeSessions = conversationSessions.get(context.conversationId);
        if (activeSessions != null) {
            activeSessions.removeIf(activeSession -> activeSession == null || activeSession.getId().equals(session.getId()));
            if (activeSessions.isEmpty()) {
                conversationSessions.remove(context.conversationId);
            }
        }
    }

    public List<ChatConversationSummaryResponse> getConversationSummaries() {
        return conversations.values().stream()
                .sorted((left, right) -> {
                    int byLastMessage = compareNullableStrings(right.lastMessageAt, left.lastMessageAt);
                    if (byLastMessage != 0) {
                        return byLastMessage;
                    }
                    return compareNullableStrings(right.createdAt, left.createdAt);
                })
                .map(ChatConversationState::toSummary)
                .toList();
    }

    public ChatConversationDetailResponse getConversationDetail(String conversationId) {
        ChatConversationState conversation = findConversation(conversationId);
        return conversation == null ? null : conversation.toDetail();
    }

    private ChatConversationState resolveConversation(String conversationId, String customerName, String customerPhone) {
        if (conversationId != null && !conversationId.isBlank()) {
            ChatConversationState existingConversation = conversations.get(conversationId);
            if (existingConversation != null) {
                return existingConversation;
            }
        }

        String newConversationId = "chat-" + UUID.randomUUID().toString().replace("-", "");
        ChatConversationState conversation = new ChatConversationState(newConversationId, customerName, customerPhone);
        conversations.put(newConversationId, conversation);
        return conversation;
    }

    private ChatConversationState findConversation(String conversationId) {
        if (conversationId == null || conversationId.isBlank()) {
            return null;
        }
        return conversations.get(conversationId);
    }

    private void registerSession(WebSocketSession session, String conversationId, ChatRole role, String senderName, String customerPhone) {
        sessions.put(session.getId(), new ChatSessionContext(conversationId, role, senderName, customerPhone));
        conversationSessions.computeIfAbsent(conversationId, key -> ConcurrentHashMap.newKeySet()).add(session);
        sendToSession(session, new ChatSocketEventResponse(
                "connected",
                conversationId,
                getConversationDetail(conversationId),
                null,
                null,
                null,
                Instant.now().toString()
        ));
    }

    private ChatSocketEventResponse buildConnectedEvent(String conversationId) {
        return new ChatSocketEventResponse(
                "connected",
                conversationId,
                getConversationDetail(conversationId),
                null,
                null,
                null,
                Instant.now().toString()
        );
    }

    private void broadcastToConversation(String conversationId, ChatSocketEventResponse event) {
        Set<WebSocketSession> activeSessions = conversationSessions.getOrDefault(conversationId, Collections.emptySet());
        for (WebSocketSession activeSession : new ArrayList<>(activeSessions)) {
            if (activeSession == null || !activeSession.isOpen()) {
                activeSessions.remove(activeSession);
                continue;
            }

            sendToSession(activeSession, event);
        }
    }

    public void broadcastToSession(WebSocketSession session, ChatSocketEventResponse event) {
        sendToSession(session, event);
    }

    private void sendToSession(WebSocketSession session, ChatSocketEventResponse event) {
        if (session == null || event == null) {
            return;
        }

        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(event)));
        } catch (IOException ignored) {
        }
    }

    private String extractContent(String rawMessage) {
        String trimmed = rawMessage.trim();
        if (!trimmed.startsWith("{")) {
            return trimmed;
        }

        try {
            JsonNode jsonNode = objectMapper.readTree(trimmed);
            JsonNode contentNode = jsonNode.get("content");
            return contentNode == null ? "" : contentNode.asText("").trim();
        } catch (Exception e) {
            return trimmed;
        }
    }

    private String normalizeText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? fallback : normalized;
    }

    private int compareNullableStrings(String left, String right) {
        if (left == null && right == null) {
            return 0;
        }
        if (left == null) {
            return -1;
        }
        if (right == null) {
            return 1;
        }
        return left.compareToIgnoreCase(right);
    }

    private enum ChatRole {
        CUSTOMER,
        ADMIN
    }

    private static final class ChatSessionContext {
        private final String conversationId;
        private final ChatRole role;
        private final String senderName;
        private final String customerPhone;

        private ChatSessionContext(String conversationId, ChatRole role, String senderName, String customerPhone) {
            this.conversationId = conversationId;
            this.role = role;
            this.senderName = senderName;
            this.customerPhone = customerPhone;
        }
    }

    private static final class ChatConversationState {
        private final String conversationId;
        private final String customerName;
        private final String customerPhone;
        private final String createdAt;
        private volatile String lastMessageAt;
        private volatile String lastMessage;
        private final List<ChatConversationMessageResponse> messages = new CopyOnWriteArrayList<>();

        private ChatConversationState(String conversationId, String customerName, String customerPhone) {
            this.conversationId = conversationId;
            this.customerName = customerName;
            this.customerPhone = customerPhone;
            this.createdAt = Instant.now().toString();
        }

        private ChatConversationSummaryResponse toSummary() {
            return new ChatConversationSummaryResponse(
                    conversationId,
                    customerName,
                    customerPhone,
                    lastMessage,
                    lastMessageAt,
                    messages.size()
            );
        }

        private ChatConversationDetailResponse toDetail() {
            return new ChatConversationDetailResponse(
                    conversationId,
                    customerName,
                    customerPhone,
                    createdAt,
                    lastMessageAt,
                    List.copyOf(messages)
            );
        }
    }
}