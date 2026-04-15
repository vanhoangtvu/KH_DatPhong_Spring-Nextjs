package com.hotelbookingproject.BLITCoding.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatConversationDetailResponse {
    private String conversationId;
    private String customerName;
    private String customerPhone;
    private String createdAt;
    private String lastMessageAt;
    private List<ChatConversationMessageResponse> messages;
}