package com.hotelbookingproject.BLITCoding.response;

import java.math.BigDecimal;

public record AdminRoomResponse(
        Long id,
        String roomType,
        BigDecimal roomPrice,
        String areaName,
        String displayName,
        String description,
        String imageUrl,
        String galleryCsv,
        String videoUrl,
        boolean showOnHome,
        Integer homeOrder,
        String featuresCsv,
        String slotTimesCsv,
        String slotPricesCsv,
        String slotStatusesCsv,
        boolean booked
) {
}
