package com.hotelbookingproject.BLITCoding.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;


@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookedRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;

    @Column(name = "ckeck_In")
    private LocalDate checkInDate;

    @Column(name = "ckeck_out")
    private LocalDate checkOutDate;

    @Column(name = "guest_FullName")
    private String guestName;

    @Column(name = "guest_Email")
    private String guestEmail;

    @Column(name = "guest_phone")
    private String guestPhone;

    @Column(name = "receive_booking_email")
    private boolean receiveBookingEmail;

    @Column(name = "adults")
    private int numOfAdults;


    @Column(name = "children")
    private int numOfChildren;

    @Column(name = "total_guest")
    private int totalNumOfGuests;

    @Column(name = "confirmation_code")
    private String bookingConfirmationCode;

    @Column(name = "transport_type")
    private String transportType;

    @Column(name = "id_card_front", columnDefinition = "LONGTEXT")
    private String idCardFrontImage;

    @Column(name = "id_card_back", columnDefinition = "LONGTEXT")
    private String idCardBackImage;

    @Column(name = "discount_code")
    private String discountCode;

    @Column(name = "note_text", columnDefinition = "LONGTEXT")
    private String note;

    @Column(name = "accepted_terms")
    private boolean acceptedTerms;

    @Column(name = "branch_name")
    private String branchName;

    @Column(name = "selected_room_name")
    private String selectedRoomName;

    @Column(name = "selected_day_label")
    private String selectedDayLabel;

    @Column(name = "selected_slot_time")
    private String selectedSlotTime;

    @Column(name = "selected_slot_price")
    private String selectedSlotPrice;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;


    public void calculateTotalNumberOfGuests(){
        this.totalNumOfGuests = this.numOfAdults + this.numOfChildren;

    }

    public void setNumOfChildren(int numOfChildren) {
        this.numOfChildren = numOfChildren;
        calculateTotalNumberOfGuests();
    }

    public void setNumOfAdults(int numOfAdults) {
        this.numOfAdults = numOfAdults;
        calculateTotalNumberOfGuests();
    }

    public void setBookingConfirmationCode(String bookingConfirmationCode) {
        this.bookingConfirmationCode = bookingConfirmationCode;
    }


    
}
