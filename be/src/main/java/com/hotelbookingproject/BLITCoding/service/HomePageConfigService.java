package com.hotelbookingproject.BLITCoding.service;

import com.hotelbookingproject.BLITCoding.response.HomePageResponse;
import com.hotelbookingproject.BLITCoding.response.BookingSettingsResponse;

public interface HomePageConfigService {
    HomePageResponse getHomePageData();
    HomePageResponse getHomePageData(String dayLabel);
    HomePageResponse resetHomePageData();
    HomePageResponse updateHomePageData(HomePageResponse homePageResponse);
    BookingSettingsResponse getBookingSettings();
    BookingSettingsResponse updateBookingSettings(boolean acceptingBookings, String bookingNotice);
}
