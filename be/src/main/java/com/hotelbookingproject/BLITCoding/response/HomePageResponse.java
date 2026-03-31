package com.hotelbookingproject.BLITCoding.response;

import java.util.List;
import java.util.Map;

public record HomePageResponse(
        String brandName,
        String brandSubtitle,
        String hotline,
        String heroBadge,
        String heroTitle,
        String heroSubtitle,
        String introSectionTitle,
        String introSectionDescription,
        List<AreaItem> areas,
        List<IntroCard> introCards,
        List<ShowcaseRoom> showcaseRooms,
        List<String> days,
        String bookingSectionTitle,
        String bookingSectionSubtitle,
        Map<String, List<RoomItem>> roomLists,
        List<LegendItem> legend,
        boolean acceptingBookings,
        String bookingNotice,
        String footerDescription,
        List<String> footerTags,
        List<String> footerLinks,
        List<String> footerLinkUrls
) {
    public record AreaItem(String name, String subtitle) {}

    public record IntroCard(String title, String subtitle, String image) {}

    public record ShowcaseRoom(String title, String cover, List<String> grid, List<String> times) {}

    public record RoomItem(Long roomId, String name, String image, List<String> gallery, String videoUrl, List<String> features, List<TimeSlot> slots) {}

    public record TimeSlot(String time, String price, String status) {}

    public record LegendItem(String label, String color) {}
}
