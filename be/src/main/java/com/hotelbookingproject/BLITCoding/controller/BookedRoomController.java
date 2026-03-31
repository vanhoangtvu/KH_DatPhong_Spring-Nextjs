package com.hotelbookingproject.BLITCoding.controller;

import com.hotelbookingproject.BLITCoding.exception.InvalidBookingException;
import com.hotelbookingproject.BLITCoding.exception.ResourceNotFoundException;
import com.hotelbookingproject.BLITCoding.model.BookedRoom;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.response.BookingResponse;
import com.hotelbookingproject.BLITCoding.response.RoomResponse;
import com.hotelbookingproject.BLITCoding.service.BookedRoomService;
import com.hotelbookingproject.BLITCoding.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

//@CrossOrigin("*")
@RequiredArgsConstructor
@RestController
@RequestMapping("/bookings")
public class BookedRoomController {


    private final BookedRoomService bookedRoomService;
    private final RoomService roomService;

    @GetMapping("/all-bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings(){
        List<BookedRoom> bookings= bookedRoomService.getAllBookings();
        List<BookingResponse> bookingResponses = new ArrayList<>();
        for (BookedRoom bookedRoom : bookings) {
            BookingResponse bookingResponse = getBookingResponse(bookedRoom);
            bookingResponses.add(bookingResponse);

        }
        return ResponseEntity.ok(bookingResponses);
    }


    @GetMapping("/confirmation/{confirmationCode}")
    public ResponseEntity<?> getBookingByConfirmationCode(
            @PathVariable String confirmationCode
            ) {
        try {
            BookedRoom booking =
                    bookedRoomService.findByBookingConfirmationCode(confirmationCode);
            BookingResponse bookingResponse = getBookingResponse(booking);
            return ResponseEntity.ok(bookingResponse);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());

        }
    }

    @GetMapping("/user/{email}/bookings")
    public ResponseEntity<List<BookingResponse>> getBookingsByUserEmail(@PathVariable String email) {
        List<BookedRoom> bookings = bookedRoomService.getBookingsByUserEmail(email);
        List<BookingResponse> bookingResponses = new ArrayList<>();
        for (BookedRoom booking : bookings) {
            BookingResponse bookingResponse = getBookingResponse(booking);
            bookingResponses.add(bookingResponse);
        }
        return ResponseEntity.ok(bookingResponses);
    }



    @PostMapping("/room/{roomId}/booking")
    public ResponseEntity<?> saveBooking(@PathVariable Long roomId,
                                         @RequestBody BookedRoom bookingRequest){
        try{
            String confirmationCode = bookedRoomService.saveBooking(roomId, bookingRequest);
            return ResponseEntity.ok("Room Booked Successfully!" +
                    " Your confirmation code" + confirmationCode);

        }catch (InvalidBookingException e){
            return ResponseEntity.badRequest().body(e.getMessage());

    }

    }


    @DeleteMapping("/booking/{bookingId}/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public void cancelBooking(@PathVariable Long bookingId){
        bookedRoomService.cancelBooking(bookingId);
    }

    @PutMapping("/booking/{bookingId}/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBooking(@PathVariable Long bookingId,
                                          @RequestBody BookedRoom bookingRequest){
        try{
            BookedRoom existingBooking = bookedRoomService.getAllBookings().stream()
                    .filter(b -> b.getBookingId().equals(bookingId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));
            
            // Update editable fields
            existingBooking.setGuestName(bookingRequest.getGuestName());
            existingBooking.setGuestEmail(bookingRequest.getGuestEmail());
            existingBooking.setGuestPhone(bookingRequest.getGuestPhone());
            existingBooking.setNumOfAdults(bookingRequest.getNumOfAdults());
            existingBooking.setNumOfChildren(bookingRequest.getNumOfChildren());
            existingBooking.setTotalNumOfGuests(bookingRequest.getNumOfAdults() + bookingRequest.getNumOfChildren());
            existingBooking.setSelectedDayLabel(bookingRequest.getSelectedDayLabel());
            existingBooking.setSelectedSlotTime(bookingRequest.getSelectedSlotTime());
            existingBooking.setNote(bookingRequest.getNote());
            existingBooking.setTransportType(bookingRequest.getTransportType());
            
            // Use the update method from service
            String confirmationCode = bookedRoomService.updateBooking(existingBooking);
            return ResponseEntity.ok("Booking updated successfully! Code: " + confirmationCode);
        }catch (ResourceNotFoundException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private BookingResponse getBookingResponse(BookedRoom booking) {
        Room room = roomService.getRoomById(booking.getRoom().getId()).get();
        RoomResponse bookingResponse = new RoomResponse(
                room.getId(), room.getRoomType(),room.getRoomPrice());
        BookingResponse response = new BookingResponse();
        response.setBookingId(booking.getBookingId());
        response.setCheckInDate(booking.getCheckInDate());
        response.setCheckOutDate(booking.getCheckOutDate());
        response.setGuestName(booking.getGuestName());
        response.setGuestEmail(booking.getGuestEmail());
        response.setNumOfAdults(booking.getNumOfAdults());
        response.setNumOfChildren(booking.getNumOfChildren());
        response.setTotalNumOfGuests(booking.getTotalNumOfGuests());
        response.setBookingConfirmationCode(booking.getBookingConfirmationCode());
        response.setRoom(bookingResponse);
        response.setGuestPhone(booking.getGuestPhone());
        response.setReceiveBookingEmail(booking.isReceiveBookingEmail());
        response.setTransportType(booking.getTransportType());
        response.setIdCardFrontImage(booking.getIdCardFrontImage());
        response.setIdCardBackImage(booking.getIdCardBackImage());
        response.setDiscountCode(booking.getDiscountCode());
        response.setNote(booking.getNote());
        response.setAcceptedTerms(booking.isAcceptedTerms());
        response.setBranchName(booking.getBranchName());
        response.setSelectedRoomName(booking.getSelectedRoomName());
        response.setSelectedDayLabel(booking.getSelectedDayLabel());
        response.setSelectedSlotTime(booking.getSelectedSlotTime());
        response.setSelectedSlotPrice(booking.getSelectedSlotPrice());
        return response;
    }


}
