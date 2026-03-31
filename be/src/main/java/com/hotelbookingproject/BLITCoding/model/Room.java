package com.hotelbookingproject.BLITCoding.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.commons.lang3.RandomStringUtils;

import java.math.BigDecimal;
import java.sql.Blob;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomType;

    private BigDecimal roomPrice;

    private String areaName;

    private String displayName;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String galleryCsv;

    @Column(columnDefinition = "LONGTEXT")
    private String videoUrl;

    private boolean showOnHome = false;

    private Integer homeOrder;

    @Column(columnDefinition = "LONGTEXT")
    private String featuresCsv;

    @Column(columnDefinition = "LONGTEXT")
    private String slotTimesCsv;

    @Column(columnDefinition = "LONGTEXT")
    private String slotPricesCsv;

    @Column(columnDefinition = "LONGTEXT")
    private String slotStatusesCsv;


    private boolean isBooked = false;

    @Lob
    private Blob photo;

    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<BookedRoom> bookings ;

    public Room() {
        this.bookings = new ArrayList<>();
    }


    public void addBooking(BookedRoom booking){
        if(bookings == null){
            bookings = new ArrayList<>();
        }
        this.bookings.add(booking);
        booking.setRoom(this);
        isBooked = true;
        String bookingCode= RandomStringUtils.randomAlphanumeric(10);
        booking.setBookingConfirmationCode(bookingCode);
    }



}
