package com.hotelbookingproject.BLITCoding.controller;

import com.hotelbookingproject.BLITCoding.exception.ResourceNotFoundException;
import com.hotelbookingproject.BLITCoding.response.ChatConversationDetailResponse;
import com.hotelbookingproject.BLITCoding.response.ChatConversationSummaryResponse;
import com.hotelbookingproject.BLITCoding.websocket.ChatWebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/chat")
@RequiredArgsConstructor
public class AdminChatController {

    private final ChatWebSocketService chatWebSocketService;

    @GetMapping("/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatConversationSummaryResponse>> getConversations() {
        return ResponseEntity.ok(chatWebSocketService.getConversationSummaries());
    }

    @GetMapping("/conversations/{conversationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChatConversationDetailResponse> getConversationDetail(@PathVariable String conversationId) {
        ChatConversationDetailResponse conversation = chatWebSocketService.getConversationDetail(conversationId);
        if (conversation == null) {
            throw new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện.");
        }

        return ResponseEntity.ok(conversation);
    }
}