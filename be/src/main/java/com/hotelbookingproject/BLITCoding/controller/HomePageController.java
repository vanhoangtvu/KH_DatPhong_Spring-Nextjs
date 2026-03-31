package com.hotelbookingproject.BLITCoding.controller;

import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.RoomRepository;
import com.hotelbookingproject.BLITCoding.response.HomePageResponse;
import com.hotelbookingproject.BLITCoding.response.RoomDetailResponse;
import com.hotelbookingproject.BLITCoding.service.HomePageConfigService;
import com.hotelbookingproject.BLITCoding.service.BookedRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public")
public class HomePageController {

    private final HomePageConfigService homePageConfigService;
    private final RoomRepository roomRepository;
    private final BookedRoomService bookedRoomService;

    @GetMapping("/home-page")
    public ResponseEntity<HomePageResponse> getHomePageData(@RequestParam(required = false) String dayLabel) {
        return ResponseEntity.ok(dayLabel == null || dayLabel.isBlank()
                ? homePageConfigService.getHomePageData()
                : homePageConfigService.getHomePageData(dayLabel));
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<RoomDetailResponse> getRoomDetail(@PathVariable Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new com.hotelbookingproject.BLITCoding.exception.ResourceNotFoundException("Room not found with id " + roomId));
        Set<String> bookedTimes = bookedRoomService.getAllBookingsByRoomId(roomId).stream()
            .map(booking -> booking.getSelectedSlotTime() == null ? "" : booking.getSelectedSlotTime().trim())
            .filter(value -> !value.isBlank())
            .collect(Collectors.toSet());

        return ResponseEntity.ok(new RoomDetailResponse(
                room.getId(),
                room.getRoomType(),
                room.getRoomPrice(),
                room.getAreaName(),
                room.getDisplayName(),
                room.getDescription(),
                room.getImageUrl(),
                splitCsv(room.getGalleryCsv()),
                room.getVideoUrl(),
                splitCsv(room.getFeaturesCsv()),
                buildSlots(room, bookedTimes),
                room.isBooked()
        ));
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

    private List<RoomDetailResponse.RoomDetailTimeSlot> buildSlots(Room room, Set<String> bookedTimes) {
        List<String> times = splitCsv(room.getSlotTimesCsv());
        List<String> prices = splitCsv(room.getSlotPricesCsv());
        List<String> statuses = splitCsv(room.getSlotStatusesCsv());
        int size = Math.min(times.size(), Math.min(prices.size(), statuses.size()));
        return java.util.stream.IntStream.range(0, size)
                .mapToObj(i -> {
                    String time = times.get(i);
                    String status = bookedTimes.contains(time) ? "Đã Đặt" : statuses.get(i);
                    return new RoomDetailResponse.RoomDetailTimeSlot(time, prices.get(i), status);
                })
                .toList();
    }
}
