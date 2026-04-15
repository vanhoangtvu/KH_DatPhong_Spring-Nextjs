package com.hotelbookingproject.BLITCoding.websocket;

import com.hotelbookingproject.BLITCoding.exception.InvalidBookingException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatWebSocketService chatWebSocketService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        var queryParams = UriComponentsBuilder.fromUri(session.getUri()).build().getQueryParams();
        String role = firstValue(queryParams.get("role"));
        String conversationId = firstValue(queryParams.get("conversationId"));
        String token = firstValue(queryParams.get("token"));

        try {
            if ("admin".equalsIgnoreCase(role)) {
                chatWebSocketService.connectAdmin(session, conversationId, token);
            } else {
                String customerName = firstValue(queryParams.get("name"));
                String customerPhone = firstValue(queryParams.get("phone"));
                chatWebSocketService.connectCustomer(session, conversationId, customerName, customerPhone);
            }
        } catch (InvalidBookingException ex) {
            safeClose(session, CloseStatus.NOT_ACCEPTABLE.withReason(ex.getMessage()));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        chatWebSocketService.handleIncomingMessage(session, message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        chatWebSocketService.disconnect(session);
    }

    private String firstValue(List<String> values) {
        return values == null || values.isEmpty() ? null : values.get(0);
    }

    private void safeClose(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ignored) {
        }
    }
}