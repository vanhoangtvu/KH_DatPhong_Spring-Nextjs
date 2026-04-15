package com.hotelbookingproject.BLITCoding.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatSocketEventResponse {
    private String type;
    private String conversationId;
    private ChatConversationDetailResponse conversation;
    private List<ChatConversationSummaryResponse> conversations;
    private ChatConversationMessageResponse message;
    private String error;
    private String timestamp;
}