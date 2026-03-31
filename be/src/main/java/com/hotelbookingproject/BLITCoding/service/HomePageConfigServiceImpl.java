package com.hotelbookingproject.BLITCoding.service;

import com.hotelbookingproject.BLITCoding.model.HomePageConfig;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.HomePageConfigRepository;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse.AreaItem;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse.IntroCard;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse.LegendItem;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse.RoomItem;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse.ShowcaseRoom;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse.TimeSlot;
import com.hotelbookingproject.BLITCoding.response.BookingSettingsResponse;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.codec.binary.Base64;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomePageConfigServiceImpl implements HomePageConfigService {

    private static final String CONFIG_KEY = "landing-home-page";

    private final HomePageConfigRepository homePageConfigRepository;
    private final RoomService roomService;
    private final BookedRoomService bookedRoomService;

    @Override
    @Transactional
    public HomePageResponse getHomePageData() {
        HomePageConfig config = homePageConfigRepository.findByConfigKey(CONFIG_KEY)
                .orElseGet(() -> homePageConfigRepository.save(defaultConfig()));
        return buildResponse(config, null);
    }

    @Override
    @Transactional
    public HomePageResponse getHomePageData(String dayLabel) {
        HomePageConfig config = homePageConfigRepository.findByConfigKey(CONFIG_KEY)
                .orElseGet(() -> homePageConfigRepository.save(defaultConfig()));
        return buildResponse(config, dayLabel);
    }

    @Override
    @Transactional
    public HomePageResponse resetHomePageData() {
        homePageConfigRepository.findByConfigKey(CONFIG_KEY).ifPresent(homePageConfigRepository::delete);
        HomePageConfig defaultConfig = defaultConfig();
        homePageConfigRepository.save(defaultConfig);
        return buildResponse(defaultConfig, null);
    }

    @Override
    @Transactional
    public HomePageResponse updateHomePageData(HomePageResponse homePageResponse) {
        HomePageConfig config = homePageConfigRepository.findByConfigKey(CONFIG_KEY)
                .orElseGet(() -> new HomePageConfig());
        config.setConfigKey(CONFIG_KEY);
        config.setBrandName(homePageResponse.brandName());
        config.setBrandSubtitle(homePageResponse.brandSubtitle());
        config.setHotline(homePageResponse.hotline());
        config.setHeroBadge(homePageResponse.heroBadge());
        config.setHeroTitle(homePageResponse.heroTitle());
        config.setHeroSubtitle(homePageResponse.heroSubtitle());
        config.setIntroSectionTitle(homePageResponse.introSectionTitle());
        config.setIntroSectionDescription(homePageResponse.introSectionDescription());
        config.setBookingSectionTitle(homePageResponse.bookingSectionTitle());
        config.setBookingSectionSubtitle(homePageResponse.bookingSectionSubtitle());
        config.setFooterDescription(homePageResponse.footerDescription());
        config.setFooterTagsCsv(joinList(homePageResponse.footerTags()));
        config.setFooterLinksCsv(joinList(homePageResponse.footerLinks()));
        config.setFooterLinkUrlsCsv(joinList(homePageResponse.footerLinkUrls()));
        config.setDaysCsv(joinList(homePageResponse.days()));
        config.setAcceptingBookings(homePageResponse.acceptingBookings());
        config.setBookingNotice(homePageResponse.bookingNotice());
        homePageConfigRepository.save(config);
        return buildResponse(config, null);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingSettingsResponse getBookingSettings() {
        HomePageConfig config = homePageConfigRepository.findByConfigKey(CONFIG_KEY)
                .orElseGet(() -> homePageConfigRepository.save(defaultConfig()));
        return new BookingSettingsResponse(config.isAcceptingBookings(), config.getBookingNotice());
    }

    @Override
    @Transactional
    public BookingSettingsResponse updateBookingSettings(boolean acceptingBookings, String bookingNotice) {
        HomePageConfig config = homePageConfigRepository.findByConfigKey(CONFIG_KEY)
                .orElseGet(() -> new HomePageConfig());
        config.setConfigKey(CONFIG_KEY);
        fillMissingDefaults(config);
        config.setAcceptingBookings(acceptingBookings);
        config.setBookingNotice(bookingNotice);
        HomePageConfig updated = homePageConfigRepository.save(config);
        return new BookingSettingsResponse(updated.isAcceptingBookings(), updated.getBookingNotice());
    }

    private HomePageResponse buildResponse(HomePageConfig config, String dayLabel) {
        List<Room> rooms = orderedRooms(roomService.getAllRooms());
        Map<Long, Set<String>> bookedSlotTimesByRoom = buildBookedSlotTimesByRoom(rooms, dayLabel);

        List<String> days = splitCsv(config.getDaysCsv());
        List<AreaItem> areas = buildAreas(rooms);
        Map<String, List<RoomItem>> roomLists = buildRoomLists(rooms, bookedSlotTimesByRoom);
        List<IntroCard> introCards = buildIntroCards(rooms);
        List<ShowcaseRoom> showcaseRooms = buildShowcaseRooms(rooms, roomLists);

        return new HomePageResponse(
                config.getBrandName(),
                config.getBrandSubtitle(),
                config.getHotline(),
                config.getHeroBadge(),
                config.getHeroTitle(),
                config.getHeroSubtitle(),
                config.getIntroSectionTitle(),
                config.getIntroSectionDescription(),
                areas,
                introCards,
                showcaseRooms,
                days,
                config.getBookingSectionTitle(),
                config.getBookingSectionSubtitle(),
                roomLists,
                List.of(
                        new LegendItem("Đã Đặt", "bg-slate-300"),
                        new LegendItem("Còn Trống", "bg-sky-100"),
                        new LegendItem("Đang chọn", "bg-sky-500")
                ),
                config.isAcceptingBookings(),
                config.getBookingNotice(),
                config.getFooterDescription(),
                splitCsv(config.getFooterTagsCsv()),
                splitCsv(config.getFooterLinksCsv()),
                splitCsvKeepEmpty(config.getFooterLinkUrlsCsv())
        );
    }

    private Map<Long, Set<String>> buildBookedSlotTimesByRoom(List<Room> rooms, String dayLabel) {
        Map<Long, Set<String>> result = new HashMap<>();
        for (Room room : rooms) {
            Set<String> bookedTimes = bookedRoomService.getAllBookingsByRoomId(room.getId()).stream()
                    .filter(booking -> matchesDayLabel(dayLabel, booking.getSelectedDayLabel()))
                    .map(booking -> Optional.ofNullable(booking.getSelectedSlotTime()).orElse("").trim())
                    .filter(value -> !value.isBlank())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            result.put(room.getId(), bookedTimes);
        }
        return result;
    }

    private boolean matchesDayLabel(String requestedDayLabel, String bookingDayLabel) {
        if (requestedDayLabel == null || requestedDayLabel.isBlank()) {
            return true;
        }
        return bookingDayLabel != null && !bookingDayLabel.isBlank()
                && bookingDayLabel.trim().equalsIgnoreCase(requestedDayLabel.trim());
    }

    private List<AreaItem> buildAreas(List<Room> rooms) {
        return rooms.stream()
                .map(Room::getAreaName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .map(area -> new AreaItem(area, firstRoomByArea(rooms, area)
                        .map(room -> Optional.ofNullable(room.getDescription()).orElse(""))
                        .orElse("Chill, riêng tư, dễ chọn")))
                .toList();
    }

    private Map<String, List<RoomItem>> buildRoomLists(List<Room> rooms, Map<Long, Set<String>> bookedSlotTimesByRoom) {
        Map<String, List<RoomItem>> grouped = new LinkedHashMap<>();
        for (Room room : rooms) {
            String area = safeArea(room);
            grouped.computeIfAbsent(area, key -> new ArrayList<>()).add(toRoomItem(room, bookedSlotTimesByRoom.get(room.getId())));
        }
        return grouped;
    }

    private List<IntroCard> buildIntroCards(List<Room> rooms) {
        return rooms.stream()
                .limit(3)
                .map(room -> new IntroCard(
                        safeDisplayName(room),
                        Optional.ofNullable(room.getDescription()).orElse(safeDisplayName(room)),
                        resolveImage(room)
                ))
                .toList();
    }

    private List<ShowcaseRoom> buildShowcaseRooms(List<Room> rooms, Map<String, List<RoomItem>> roomLists) {
        return roomLists.entrySet().stream()
                .map(entry -> {
                    String area = entry.getKey();
                    List<RoomItem> items = entry.getValue();
                    Room firstRoom = firstRoomByArea(rooms, area).orElse(null);
                    String cover = firstRoom != null ? resolveImage(firstRoom) : resolveImage(rooms.isEmpty() ? null : rooms.get(0));
                    List<String> subImages = collectShowcaseSubImages(firstRoom, items, cover);
                    if (subImages.isEmpty()) {
                        subImages = List.of(cover);
                    }
                    while (subImages.size() < 3) {
                        List<String> padded = new ArrayList<>(subImages);
                        padded.add(subImages.get(padded.size() - 1));
                        subImages = padded;
                    }
                    String title = firstRoom != null ? safeDisplayName(firstRoom) : area;
                    return new ShowcaseRoom(
                            title,
                            cover,
                            subImages.stream().limit(3).toList(),
                            firstRoom != null ? buildSlotTimes(firstRoom) : List.of()
                    );
                })
                .toList();
    }

    private RoomItem toRoomItem(Room room, Set<String> bookedSlotTimes) {
        return new RoomItem(
            room.getId(),
                safeDisplayName(room),
                resolveImage(room),
                splitCsv(room.getGalleryCsv()),
                room.getVideoUrl(),
                splitCsv(room.getFeaturesCsv()),
                buildSlots(room, bookedSlotTimes)
        );
    }

    private List<TimeSlot> buildSlots(Room room, Set<String> bookedSlotTimes) {
        List<String> times = splitCsv(room.getSlotTimesCsv());
        List<String> prices = splitCsv(room.getSlotPricesCsv());
        List<String> statuses = splitCsv(room.getSlotStatusesCsv());
        int size = Math.min(times.size(), Math.min(prices.size(), statuses.size()));
        List<TimeSlot> slots = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            String time = times.get(i);
            String status = bookedSlotTimes != null && bookedSlotTimes.contains(time)
                    ? "Đã Đặt"
                    : statuses.get(i);
            slots.add(new TimeSlot(time, prices.get(i), status));
        }
        return slots;
    }

    private List<String> buildSlotTimes(Room room) {
        return splitCsv(room.getSlotTimesCsv());
    }

    private List<String> collectShowcaseSubImages(Room room, List<RoomItem> items, String cover) {
        LinkedHashSet<String> images = new LinkedHashSet<>();
        if (room != null) {
            for (String image : splitCsv(room.getGalleryCsv())) {
                if (image != null && !image.isBlank() && !image.equals(cover)) {
                    images.add(image);
                }
            }
        }
        for (RoomItem item : items) {
            if (item.image() != null && !item.image().isBlank() && !item.image().equals(cover)) {
                images.add(item.image());
            }
            if (images.size() >= 3) {
                break;
            }
        }
        return new ArrayList<>(images);
    }

    private String safeArea(Room room) {
        return Optional.ofNullable(room.getAreaName())
                .filter(value -> !value.isBlank())
                .orElse("Khu vực khác");
    }

    private String safeDisplayName(Room room) {
        return Optional.ofNullable(room.getDisplayName())
                .filter(value -> !value.isBlank())
                .orElse(Optional.ofNullable(room.getRoomType()).orElse("Phòng"));
    }

    private Optional<Room> firstRoomByArea(List<Room> rooms, String area) {
        return rooms.stream()
                .filter(room -> area.equals(safeArea(room)))
                .findFirst();
    }

    private List<Room> orderedRooms(List<Room> rooms) {
        return rooms.stream()
                .sorted(Comparator.comparing(Room::isShowOnHome).reversed()
                        .thenComparing(room -> Optional.ofNullable(room.getHomeOrder()).orElse(Integer.MAX_VALUE))
                        .thenComparing(Room::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private String resolveImage(Room room) {
        if (room == null) {
            return "";
        }
        if (room.getImageUrl() != null && !room.getImageUrl().isBlank()) {
            return room.getImageUrl();
        }
        List<String> gallery = splitCsv(room.getGalleryCsv());
        if (!gallery.isEmpty()) {
            return gallery.get(0);
        }
        try {
            byte[] photoBytes = roomService.getRoomPhotoByRoomId(room.getId());
            return photoBytes != null && photoBytes.length > 0
                    ? "data:image/jpeg;base64," + Base64.encodeBase64String(photoBytes)
                    : "";
        } catch (Exception ex) {
            return "";
        }
    }

    private List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split("\\|"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private List<String> splitCsvKeepEmpty(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split("\\|", -1))
                .map(String::trim)
                .toList();
    }

    private String joinList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }
        return String.join("|", values);
    }

    private HomePageConfig defaultConfig() {
        HomePageConfig config = new HomePageConfig();
        config.setConfigKey(CONFIG_KEY);
        config.setBrandName("LuxeStay");
        config.setBrandSubtitle("Đặt phòng mobile hiện đại");
        config.setHotline("1900 2026");
        config.setHeroBadge("Mọi lúc, mọi nơi");
        config.setHeroTitle("Chọn phòng chill, đặt nhanh trên điện thoại.");
        config.setHeroSubtitle("Bố cục gọn, rõ, có thể vuốt qua để xem khu vực, phòng nổi bật và khung giờ.");
        config.setIntroSectionTitle("Trang giới thiệu");
        config.setIntroSectionDescription("Vuốt qua để xem các điểm nổi bật và cảm hứng lưu trú.");
        config.setBookingSectionTitle("Chủ động thời gian");
        config.setBookingSectionSubtitle("mọi lúc, mọi nơi");
        config.setFooterDescription("Dịch vụ lưu trú hiện đại, thân thiện mobile, bố cục rõ ràng và dễ đặt phòng.");
        config.setFooterTagsCsv("Căn PG2-11 · khu Vincom|Hẻm Duy Khổng");
        config.setFooterLinksCsv("Facebook|TikTok|Bảng giá|Nội quy");
        config.setFooterLinkUrlsCsv("https://facebook.com|https://tiktok.com|/bang-gia|/noi-quy");
        config.setDaysCsv("Hôm nay|Thứ 3|Thứ 4|Thứ 5");
        config.setAcceptingBookings(true);
        config.setBookingNotice("Hiện tại hệ thống đang nhận đặt phòng bình thường.");
        return config;
    }

    private void fillMissingDefaults(HomePageConfig config) {
        HomePageConfig defaults = defaultConfig();
        if (isBlank(config.getBrandName())) config.setBrandName(defaults.getBrandName());
        if (isBlank(config.getBrandSubtitle())) config.setBrandSubtitle(defaults.getBrandSubtitle());
        if (isBlank(config.getHotline())) config.setHotline(defaults.getHotline());
        if (isBlank(config.getHeroBadge())) config.setHeroBadge(defaults.getHeroBadge());
        if (isBlank(config.getHeroTitle())) config.setHeroTitle(defaults.getHeroTitle());
        if (isBlank(config.getHeroSubtitle())) config.setHeroSubtitle(defaults.getHeroSubtitle());
        if (isBlank(config.getIntroSectionTitle())) config.setIntroSectionTitle(defaults.getIntroSectionTitle());
        if (isBlank(config.getIntroSectionDescription())) config.setIntroSectionDescription(defaults.getIntroSectionDescription());
        if (isBlank(config.getBookingSectionTitle())) config.setBookingSectionTitle(defaults.getBookingSectionTitle());
        if (isBlank(config.getBookingSectionSubtitle())) config.setBookingSectionSubtitle(defaults.getBookingSectionSubtitle());
        if (isBlank(config.getFooterDescription())) config.setFooterDescription(defaults.getFooterDescription());
        if (isBlank(config.getFooterTagsCsv())) config.setFooterTagsCsv(defaults.getFooterTagsCsv());
        if (isBlank(config.getFooterLinksCsv())) config.setFooterLinksCsv(defaults.getFooterLinksCsv());
        if (isBlank(config.getFooterLinkUrlsCsv())) config.setFooterLinkUrlsCsv(defaults.getFooterLinkUrlsCsv());
        if (isBlank(config.getDaysCsv())) config.setDaysCsv(defaults.getDaysCsv());
        if (isBlank(config.getBookingNotice())) config.setBookingNotice(defaults.getBookingNotice());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
