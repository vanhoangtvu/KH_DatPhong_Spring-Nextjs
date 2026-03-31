package com.hotelbookingproject.BLITCoding.service;


import com.hotelbookingproject.BLITCoding.exception.InvalidBookingException;
import com.hotelbookingproject.BLITCoding.model.BookedRoom;
import com.hotelbookingproject.BLITCoding.model.HomePageConfig;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.BookedRoomRepository;
import com.hotelbookingproject.BLITCoding.repository.HomePageConfigRepository;
import com.hotelbookingproject.BLITCoding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookedRoomServiceImpl implements BookedRoomService {

    private static final String CONFIG_KEY = "landing-home-page";

    private final BookedRoomRepository bookedRoomRepository;
    private final HomePageConfigRepository homePageConfigRepository;
    private final RoomRepository roomRepository;
    @Autowired
    private final RoomService roomService;
    @Override
    public List<BookedRoom> getAllBookingsByRoomId(Long roomId) {
        return bookedRoomRepository.findByRoomId(roomId);
    }

    @Override
    public void cancelBooking(Long bookingId) {
        bookedRoomRepository.deleteById(bookingId);
    }

    @Override
    public List<BookedRoom> getAllBookings() {
        return bookedRoomRepository.findAll();
    }

    @Override
    public List<BookedRoom> getBookingsByUserEmail(String email) {
        return bookedRoomRepository.findByGuestEmail(email);
    }

    @Override
    public String saveBooking(Long roomId, BookedRoom bookingRequest) {
        HomePageConfig config = homePageConfigRepository.findByConfigKey(CONFIG_KEY).orElse(null);
        if (config != null && !config.isAcceptingBookings()) {
            String message = config.getBookingNotice();
            throw new InvalidBookingException(
                    message == null || message.isBlank()
                            ? "Hệ thống đang tạm ngừng nhận đặt phòng."
                            : message
            );
        }
        if (!bookingRequest.isAcceptedTerms()) {
            throw new InvalidBookingException("Vui lòng xác nhận điều khoản và điều kiện trước khi đặt phòng.");
        }
        if(bookingRequest.getCheckOutDate()
                .isBefore(bookingRequest.getCheckInDate())){
            throw new InvalidBookingException("Check in date must come" +
                    "before check out date");
        }
        Room room = roomService.getRoomById(roomId).get();
        List<BookedRoom> existingBookings = room.getBookings();
        boolean roomIsAvailable = roomIsAvailable(bookingRequest, existingBookings);
        if(roomIsAvailable){
            room.addBooking(bookingRequest);
            room.setSlotStatusesCsv(updateBookedSlotStatus(room, bookingRequest.getSelectedSlotTime()));
            roomRepository.save(room);
            bookedRoomRepository.save(bookingRequest);

        }else {
            throw new InvalidBookingException("Sorry, This room has been booked for the " +
                    "selected date");
        }
        return bookingRequest.getBookingConfirmationCode();
    }



    @Override
    public BookedRoom findByBookingConfirmationCode(String confirmationCode) {
        return bookedRoomRepository.findByBookingConfirmationCode(confirmationCode);
    }


    private boolean roomIsAvailable(BookedRoom bookingRequest,
                                    List<BookedRoom> existingBookings) {
        return existingBookings.stream()
                .noneMatch(existingBooking ->
                        bookingRequest.getCheckInDate().equals(existingBooking.getCheckInDate())
                        || bookingRequest.getCheckOutDate().isBefore(existingBooking.getCheckOutDate())
                        || (bookingRequest.getCheckInDate().isAfter(existingBooking.getCheckInDate())
                        && bookingRequest.getCheckInDate().isBefore(existingBooking.getCheckOutDate()))
                        || (bookingRequest.getCheckInDate().isBefore(existingBooking.getCheckInDate())

                        && bookingRequest.getCheckOutDate().equals(existingBooking.getCheckOutDate()))
                        || (bookingRequest.getCheckInDate().isBefore(existingBooking.getCheckInDate())

                        && bookingRequest.getCheckOutDate().isAfter(existingBooking.getCheckOutDate()))

                        || (bookingRequest.getCheckInDate().equals(existingBooking.getCheckOutDate())
                        && bookingRequest.getCheckOutDate().equals(existingBooking.getCheckInDate()))

                        || (bookingRequest.getCheckInDate().equals(existingBooking.getCheckOutDate())
                        && bookingRequest.getCheckOutDate().equals(bookingRequest.getCheckInDate()))



                        );



    }

    private String updateBookedSlotStatus(Room room, String bookedTime) {
        if (bookedTime == null || bookedTime.isBlank()) {
            return room.getSlotStatusesCsv();
        }
        List<String> statuses = Arrays.stream((room.getSlotStatusesCsv() == null ? "" : room.getSlotStatusesCsv()).split("\\|", -1))
                .map(String::trim)
                .collect(Collectors.toList());
        List<String> times = Arrays.stream((room.getSlotTimesCsv() == null ? "" : room.getSlotTimesCsv()).split("\\|", -1))
                .map(String::trim)
                .collect(Collectors.toList());
        if (times.isEmpty() || statuses.isEmpty()) {
            return room.getSlotStatusesCsv();
        }
        int size = Math.min(times.size(), statuses.size());
        for (int i = 0; i < size; i++) {
            if (bookedTime.trim().equals(times.get(i))) {
                statuses.set(i, "Đã Đặt");
                break;
            }
        }
        return String.join("|", statuses);
    }


}
