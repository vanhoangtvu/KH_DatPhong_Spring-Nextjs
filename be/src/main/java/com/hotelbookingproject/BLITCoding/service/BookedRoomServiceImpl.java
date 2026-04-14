package com.hotelbookingproject.BLITCoding.service;

import com.hotelbookingproject.BLITCoding.exception.InvalidBookingException;
import com.hotelbookingproject.BLITCoding.model.BookedRoom;
import com.hotelbookingproject.BLITCoding.model.HomePageConfig;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.BookedRoomRepository;
import com.hotelbookingproject.BLITCoding.repository.HomePageConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BookedRoomServiceImpl implements BookedRoomService {

    private static final String CONFIG_KEY = "landing-home-page";

    private final BookedRoomRepository bookedRoomRepository;
    private final HomePageConfigRepository homePageConfigRepository;
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
        // Check if system is accepting bookings
        HomePageConfig config = homePageConfigRepository.findByConfigKey(CONFIG_KEY).orElse(null);
        if (config != null && !config.isAcceptingBookings()) {
            String message = config.getBookingNotice();
            throw new InvalidBookingException(
                    message == null || message.isBlank()
                            ? "Hệ thống đang tạm ngừng nhận đặt phòng."
                            : message
            );
        }
        
        // Validate terms acceptance
        if (!bookingRequest.isAcceptedTerms()) {
            throw new InvalidBookingException("Vui lòng xác nhận điều khoản và điều kiện trước khi đặt phòng.");
        }
        
        // Validate dates
        if(bookingRequest.getCheckOutDate().isBefore(bookingRequest.getCheckInDate())){
            throw new InvalidBookingException("Ngày check-out phải sau ngày check-in");
        }
        
        // Get room
        Room room = roomService.getRoomById(roomId)
                .orElseThrow(() -> new InvalidBookingException("Phòng không tồn tại"));
        
        // CRITICAL: Check if the specific time slot is available for the specific date
        boolean isAvailable = isTimeSlotAvailable(
                room.getId(),
                bookingRequest.getCheckInDate(),
                bookingRequest.getSelectedSlotTime()
        );
        
        if (!isAvailable) {
            throw new InvalidBookingException(
                    "Xin lỗi, khung giờ " + bookingRequest.getSelectedSlotTime() + 
                    " ngày " + bookingRequest.getCheckInDate() + " đã được đặt. Vui lòng chọn khung giờ khác."
            );
        }
        
        // Save booking
        room.addBooking(bookingRequest);
        bookedRoomRepository.save(bookingRequest);
        
        return bookingRequest.getBookingConfirmationCode();
    }
    
    /**
     * Check if a specific time slot is available for a specific date and room.
     * This is the core logic to prevent double-booking.
     * 
     * @param roomId The room ID
     * @param date The booking date
     * @param timeSlot The time slot (e.g., "14h-16h")
     * @return true if available, false if already booked
     */
    private boolean isTimeSlotAvailable(Long roomId, java.time.LocalDate date, String timeSlot) {
        if (timeSlot == null || timeSlot.isBlank()) {
            return true; // No specific time slot, allow booking
        }
        
        // Get all bookings for this room
        List<BookedRoom> existingBookings = bookedRoomRepository.findByRoomId(roomId);
        
        // Check if any existing booking has the same date AND same time slot
        return existingBookings.stream()
                .noneMatch(booking -> 
                    booking.getCheckInDate() != null &&
                    booking.getCheckInDate().equals(date) &&
                    booking.getSelectedSlotTime() != null &&
                    booking.getSelectedSlotTime().trim().equalsIgnoreCase(timeSlot.trim())
                );
    }

    @Override
    public String updateBooking(BookedRoom booking) {
        if (booking == null || booking.getBookingId() == null) {
            throw new InvalidBookingException("Invalid booking data");
        }
        bookedRoomRepository.save(booking);
        return booking.getBookingConfirmationCode();
    }




    @Override
    public BookedRoom findByBookingConfirmationCode(String confirmationCode) {
        return bookedRoomRepository.findByBookingConfirmationCode(confirmationCode);
    }

    @Override
    public List<BookedRoom> findBookingsByGuestNameAndPhone(String guestName, String guestPhone) {
        String normalizedName = normalizeText(guestName);
        String normalizedPhone = normalizePhone(guestPhone);

        return bookedRoomRepository.findAll().stream()
                .filter(booking -> normalizePhone(booking.getGuestPhone()).equals(normalizedPhone))
                .filter(booking -> normalizeText(booking.getGuestName()).contains(normalizedName))
                .toList();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }
}
