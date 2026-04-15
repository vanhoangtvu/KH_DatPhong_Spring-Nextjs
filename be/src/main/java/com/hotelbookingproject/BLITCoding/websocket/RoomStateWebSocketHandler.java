package com.hotelbookingproject.BLITCoding.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@RequiredArgsConstructor
public class RoomStateWebSocketHandler extends TextWebSocketHandler {

    private final RoomStateWebSocketService roomStateWebSocketService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        roomStateWebSocketService.register(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        roomStateWebSocketService.unregister(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Client messages are not required for the current use case.
    }
}