package com.hotelbookingproject.BLITCoding.service;

import com.hotelbookingproject.BLITCoding.exception.InvalidBookingException;
import com.hotelbookingproject.BLITCoding.model.BookedRoom;
import com.hotelbookingproject.BLITCoding.model.HomePageConfig;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.BookedRoomRepository;
import com.hotelbookingproject.BLITCoding.repository.HomePageConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookedRoomServiceImpl implements BookedRoomService {

    private static final String CONFIG_KEY = "landing-home-page";
    private static final String DEFAULT_BOOKING_STATUS = BookedRoom.DEFAULT_BOOKING_STATUS;
    private static final Set<String> INACTIVE_BOOKING_STATUS_KEYS = Set.of(
            "hoàn thành",
            "đã hoàn thành",
            "đã hủy",
            "hủy",
            "completed",
            "cancelled",
            "canceled"
    );

    private final BookedRoomRepository bookedRoomRepository;
    private final HomePageConfigRepository homePageConfigRepository;
    private final RoomService roomService;
    @Override
    public List<BookedRoom> getAllBookingsByRoomId(Long roomId) {
        return bookedRoomRepository.findByRoomId(roomId);
    }

    @Override
    public List<BookedRoom> getActiveBookingsByRoomId(Long roomId) {
        return bookedRoomRepository.findByRoomId(roomId).stream()
                .filter(this::isActiveBooking)
                .toList();
    }

    @Override
    public void cancelBooking(Long bookingId) {
        bookedRoomRepository.deleteById(bookingId);
    }

    @Override
    public BookedRoom findBookingById(Long bookingId) {
        return bookedRoomRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new InvalidBookingException("Booking not found with ID: " + bookingId));
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

        bookingRequest.setBookingStatus(normalizeBookingStatus(bookingRequest.getBookingStatus()));
        bookingRequest.setDiscountCode(normalizePromoCode(bookingRequest.getDiscountCode()));

        List<String> requestedSlotTimes = parseSelectedSlotTimes(bookingRequest.getSelectedSlotTime());
        if (requestedSlotTimes.isEmpty()) {
            throw new InvalidBookingException("Vui lòng chọn ít nhất một khung giờ.");
        }
        bookingRequest.setSelectedSlotTime(String.join(", ", requestedSlotTimes));

        HomePageConfig promoConfig = homePageConfigRepository.findByConfigKey(CONFIG_KEY).orElse(null);
        bookingRequest.setSelectedSlotPrice(applyDiscountIfEligible(
                bookingRequest.getSelectedSlotPrice(),
                bookingRequest.getDiscountCode(),
                promoConfig
        ));
        
        // Validate dates
        if (bookingRequest.getCheckInDate() == null || bookingRequest.getCheckOutDate() == null) {
            throw new InvalidBookingException("Vui lòng chọn đầy đủ ngày nhận và trả phòng");
        }
        if(bookingRequest.getCheckOutDate().isBefore(bookingRequest.getCheckInDate())){
            throw new InvalidBookingException("Ngày check-out phải sau ngày check-in");
        }
        
        // Get room
        Room room = roomService.getRoomById(roomId)
                .orElseThrow(() -> new InvalidBookingException("Phòng không tồn tại"));
        
        for (LocalDate date = bookingRequest.getCheckInDate(); !date.isAfter(bookingRequest.getCheckOutDate()); date = date.plusDays(1)) {
            for (String slotTime : requestedSlotTimes) {
                boolean isAvailable = isTimeSlotAvailable(room.getId(), date, slotTime, null);
                if (!isAvailable) {
                    throw new InvalidBookingException(
                            "Xin lỗi, khung giờ " + slotTime +
                                    " ngày " + date + " đã được đặt. Vui lòng chọn khung giờ khác."
                    );
                }
            }
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
        return isTimeSlotAvailable(roomId, date, timeSlot, null);
    }

    private boolean isTimeSlotAvailable(Long roomId, java.time.LocalDate date, String timeSlot, Long excludedBookingId) {
        if (timeSlot == null || timeSlot.isBlank()) {
            return true; // No specific time slot, allow booking
        }
        
        // Get all bookings for this room
        List<BookedRoom> existingBookings = bookedRoomRepository.findByRoomId(roomId);
        
        // Check if any existing booking has the same date AND same time slot
        return existingBookings.stream()
                .filter(this::isActiveBooking)
                .filter(booking -> excludedBookingId == null || !excludedBookingId.equals(booking.getBookingId()))
                .noneMatch(booking -> isBookingActiveOnDate(booking, date)
                        && parseSelectedSlotTimes(booking.getSelectedSlotTime()).stream()
                        .anyMatch(slot -> slot.equalsIgnoreCase(timeSlot.trim())));
    }

    @Override
    public String updateBooking(BookedRoom booking) {
        if (booking == null || booking.getBookingId() == null) {
            throw new InvalidBookingException("Invalid booking data");
        }

        booking.setBookingStatus(normalizeBookingStatus(booking.getBookingStatus()));

        List<String> requestedSlotTimes = parseSelectedSlotTimes(booking.getSelectedSlotTime());
        if (requestedSlotTimes.isEmpty()) {
            throw new InvalidBookingException("Vui lòng chọn ít nhất một khung giờ.");
        }
        booking.setSelectedSlotTime(String.join(", ", requestedSlotTimes));

        if (booking.getCheckInDate() == null || booking.getCheckOutDate() == null) {
            throw new InvalidBookingException("Vui lòng chọn đầy đủ ngày nhận và trả phòng");
        }

        if (booking.getRoom() != null && booking.getRoom().getId() != null && isActiveBooking(booking)) {
            for (LocalDate date = booking.getCheckInDate(); !date.isAfter(booking.getCheckOutDate()); date = date.plusDays(1)) {
                for (String slotTime : requestedSlotTimes) {
                    boolean isAvailable = isTimeSlotAvailable(
                            booking.getRoom().getId(),
                            date,
                            slotTime,
                            booking.getBookingId()
                    );
                    if (!isAvailable) {
                        throw new InvalidBookingException(
                                "Xin lỗi, khung giờ " + slotTime +
                                        " ngày " + date + " đã được đặt. Vui lòng chọn khung giờ khác."
                        );
                    }
                }
            }
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

    private boolean isActiveBooking(BookedRoom booking) {
        if (booking == null) {
            return false;
        }
        String normalizedStatus = normalizeBookingStatus(booking.getBookingStatus()).toLowerCase(Locale.ROOT);
        return !INACTIVE_BOOKING_STATUS_KEYS.contains(normalizedStatus);
    }

    private boolean isBookingActiveOnDate(BookedRoom booking, LocalDate date) {
        if (booking == null || date == null || booking.getCheckInDate() == null) {
            return false;
        }

        LocalDate checkOutDate = booking.getCheckOutDate() == null ? booking.getCheckInDate() : booking.getCheckOutDate();
        return !date.isBefore(booking.getCheckInDate()) && !date.isAfter(checkOutDate);
    }

    private List<String> parseSelectedSlotTimes(String selectedSlotTime) {
        if (selectedSlotTime == null || selectedSlotTime.isBlank()) {
            return List.of();
        }

        return Arrays.stream(selectedSlotTime.split("[\\,\\|\\n;]"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private String normalizeBookingStatus(String bookingStatus) {
        return bookingStatus == null || bookingStatus.isBlank()
                ? DEFAULT_BOOKING_STATUS
                : bookingStatus.trim();
    }

    private String normalizePromoCode(String promoCode) {
        return promoCode == null ? "" : promoCode.trim().toUpperCase(Locale.ROOT);
    }

    private String applyDiscountIfEligible(String originalPriceText, String promoCode, HomePageConfig promoConfig) {
        if (promoCode == null || promoCode.isBlank()) {
            return originalPriceText;
        }

        String configuredCode = promoConfig == null ? "" : normalizePromoCode(promoConfig.getDiscountCode());
        Integer configuredPercent = promoConfig == null ? null : promoConfig.getDiscountPercent();
        if (configuredCode.isBlank() || configuredPercent == null || configuredPercent <= 0 || !configuredCode.equals(promoCode)) {
            throw new InvalidBookingException("Mã giảm giá không hợp lệ.");
        }

        long originalAmount = parsePriceToVnd(originalPriceText);
        if (originalAmount <= 0) {
            throw new InvalidBookingException("Không thể áp dụng mã giảm giá cho khung giờ này.");
        }

        long discountAmount = Math.round(originalAmount * (configuredPercent / 100.0));
        long finalAmount = Math.max(0, originalAmount - discountAmount);
        return formatPriceLikeOriginal(originalPriceText, finalAmount);
    }

    private long parsePriceToVnd(String priceText) {
        if (priceText == null || priceText.isBlank()) {
            return 0L;
        }

        String normalized = priceText.trim().toLowerCase(Locale.ROOT).replace("đ", "").replace(" ", "");
        boolean isKUnit = normalized.endsWith("k");
        normalized = normalized.replaceAll("[^0-9]", "");
        if (normalized.isBlank()) {
            return 0L;
        }

        long amount = Long.parseLong(normalized);
        return isKUnit ? amount * 1000L : amount;
    }

    private String formatPriceLikeOriginal(String originalPriceText, long amount) {
        if (originalPriceText != null && originalPriceText.toLowerCase(Locale.ROOT).contains("k")) {
            return (amount / 1000L) + "k";
        }
        return String.format(java.util.Locale.GERMAN, "% ,dđ", amount).replace(" ", "");
    }
}
