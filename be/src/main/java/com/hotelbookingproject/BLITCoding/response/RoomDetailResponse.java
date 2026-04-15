package com.hotelbookingproject.BLITCoding.response;

import java.math.BigDecimal;
import java.util.List;

public record RoomDetailResponse(
        Long roomId,
        String roomType,
        BigDecimal roomPrice,
        String areaName,
        String displayName,
        String description,
        String imageUrl,
        List<String> gallery,
        String videoUrl,
        List<String> features,
        List<RoomDetailTimeSlot> slots,
        List<String> bookedSlotTimes,
        boolean booked
) {
    public record RoomDetailTimeSlot(String time, String price, String status) {}
}
