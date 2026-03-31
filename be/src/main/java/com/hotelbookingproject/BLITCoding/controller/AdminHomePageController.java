package com.hotelbookingproject.BLITCoding.controller;

import com.hotelbookingproject.BLITCoding.request.BookingSettingsRequest;
import com.hotelbookingproject.BLITCoding.response.BookingSettingsResponse;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse;
import com.hotelbookingproject.BLITCoding.service.HomePageConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/home-page")
public class AdminHomePageController {

    private final HomePageConfigService homePageConfigService;

    @PostMapping("/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HomePageResponse> resetHomePageData() {
        return ResponseEntity.ok(homePageConfigService.resetHomePageData());
    }

    @PutMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HomePageResponse> updateHomePageData(@org.springframework.web.bind.annotation.RequestBody HomePageResponse homePageResponse) {
        return ResponseEntity.ok(homePageConfigService.updateHomePageData(homePageResponse));
    }

    @GetMapping("/booking-settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingSettingsResponse> getBookingSettings() {
        return ResponseEntity.ok(homePageConfigService.getBookingSettings());
    }

    @PutMapping("/booking-settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingSettingsResponse> updateBookingSettings(@org.springframework.web.bind.annotation.RequestBody BookingSettingsRequest request) {
        return ResponseEntity.ok(homePageConfigService.updateBookingSettings(request.acceptingBookings(), request.bookingNotice()));
    }
}
