package com.hotelbookingproject.BLITCoding.websocket;

public record RoomStateUpdateMessage(
        String type,
        String timestamp
) {
}