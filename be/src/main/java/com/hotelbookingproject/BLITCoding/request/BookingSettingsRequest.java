package com.hotelbookingproject.BLITCoding.request;

public record BookingSettingsRequest(
        boolean acceptingBookings,
        String bookingNotice
) {
}
