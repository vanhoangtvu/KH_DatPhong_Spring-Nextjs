package com.hotelbookingproject.BLITCoding.controller;

import com.hotelbookingproject.BLITCoding.exception.ResourceNotFoundException;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.RoomRepository;
import com.hotelbookingproject.BLITCoding.request.AdminRoomRequest;
import com.hotelbookingproject.BLITCoding.response.AdminRoomResponse;
import com.hotelbookingproject.BLITCoding.service.BookedRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/rooms")
public class AdminRoomController {

    private final RoomRepository roomRepository;
    private final BookedRoomService bookedRoomService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminRoomResponse>> getAllRooms() {
        List<AdminRoomResponse> responses = roomRepository.findAll().stream()
                .sorted(Comparator.comparing(Room::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminRoomResponse> createRoom(@RequestBody AdminRoomRequest request) {
        Room room = new Room();
        applyRequest(room, request);
        Room saved = roomRepository.save(room);
        return new ResponseEntity<>(toResponse(saved), HttpStatus.CREATED);
    }

    @PutMapping("/{roomId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminRoomResponse> updateRoom(@PathVariable Long roomId,
                                                        @RequestBody AdminRoomRequest request) {
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResourceNotFoundException("Room not found with id " + roomId));
        applyRequest(room, request);
        Room updated = roomRepository.save(room);
        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{roomId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            return ResponseEntity.notFound().build();
        }
        roomRepository.deleteById(roomId);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(Room room, AdminRoomRequest request) {
        room.setRoomType(request.roomType());
        room.setRoomPrice(request.roomPrice());
        room.setAreaName(request.areaName());
        room.setDisplayName(request.displayName());
        room.setDescription(request.description());
        room.setImageUrl(request.imageUrl());
        room.setGalleryCsv(request.galleryCsv());
        room.setVideoUrl(request.videoUrl());
        room.setShowOnHome(request.showOnHome());
        room.setHomeOrder(request.homeOrder());
        room.setFeaturesCsv(request.featuresCsv());
        room.setSlotTimesCsv(request.slotTimesCsv());
        room.setSlotPricesCsv(request.slotPricesCsv());
        room.setSlotStatusesCsv(request.slotStatusesCsv());
    }

    private AdminRoomResponse toResponse(Room room) {
        return new AdminRoomResponse(
                room.getId(),
                room.getRoomType(),
                room.getRoomPrice(),
                room.getAreaName(),
                room.getDisplayName(),
                room.getDescription(),
                room.getImageUrl(),
                room.getGalleryCsv(),
                room.getVideoUrl(),
                room.isShowOnHome(),
                room.getHomeOrder(),
                room.getFeaturesCsv(),
                room.getSlotTimesCsv(),
                room.getSlotPricesCsv(),
                room.getSlotStatusesCsv(),
                !bookedRoomService.getActiveBookingsByRoomId(room.getId()).isEmpty()
        );
    }
}
