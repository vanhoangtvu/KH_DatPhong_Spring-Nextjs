package com.hotelbookingproject.BLITCoding.service;

import com.hotelbookingproject.BLITCoding.response.HomePageResponse;
import com.hotelbookingproject.BLITCoding.response.BookingSettingsResponse;

import java.time.LocalDate;

public interface HomePageConfigService {
    HomePageResponse getHomePageData();
    HomePageResponse getHomePageData(String dayLabel);
    HomePageResponse getHomePageData(LocalDate date);
    HomePageResponse resetHomePageData();
    HomePageResponse updateHomePageData(HomePageResponse homePageResponse);
    BookingSettingsResponse getBookingSettings();
    BookingSettingsResponse updateBookingSettings(boolean acceptingBookings, String bookingNotice);
}
