package com.hotelbookingproject.BLITCoding.service;


import com.hotelbookingproject.BLITCoding.model.BookedRoom;

import java.util.List;

public interface BookedRoomService {


    List<BookedRoom> getAllBookingsByRoomId(Long roomId);

    void cancelBooking(Long bookingId);

    String saveBooking(Long roomId, BookedRoom bookingRequest);

    String updateBooking(BookedRoom booking);

    BookedRoom findByBookingConfirmationCode(String confirmationCode);

    List<BookedRoom> getAllBookings();

    List<BookedRoom> getBookingsByUserEmail(String email);

    List<BookedRoom> findBookingsByGuestNameAndPhone(String guestName, String guestPhone);
}
