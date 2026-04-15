package com.hotelbookingproject.BLITCoding.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatConversationMessageResponse {
    private String id;
    private String conversationId;
    private String senderType;
    private String senderName;
    private String content;
    private String timestamp;
}