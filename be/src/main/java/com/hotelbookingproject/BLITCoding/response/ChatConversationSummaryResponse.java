package com.hotelbookingproject.BLITCoding.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatConversationSummaryResponse {
    private String conversationId;
    private String customerName;
    private String customerPhone;
    private String lastMessage;
    private String lastMessageAt;
    private int messageCount;
}