package com.hotelbookingproject.BLITCoding.response;

public record BookingSettingsResponse(
        boolean acceptingBookings,
        String bookingNotice
) {
}
