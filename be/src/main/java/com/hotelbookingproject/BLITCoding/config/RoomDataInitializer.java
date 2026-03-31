package com.hotelbookingproject.BLITCoding.config;

import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RoomDataInitializer implements CommandLineRunner {

    private final RoomRepository roomRepository;

    @Override
    public void run(String... args) {
        if (roomRepository.count() > 0) {
            return;
        }

        roomRepository.saveAll(List.of(
                createRoom(
                        "Studio",
                        new BigDecimal("420000"),
                        "Chi nhánh Vincom",
                        "Studio Deluxe",
                        "Không gian ấm cúng, phù hợp nghỉ ngắn và làm việc riêng tư.",
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1560067174-8943bd5bcf26?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        true,
                        1,
                        "Điều hòa|Wi-Fi|Smart TV|Nước uống",
                        "08:00|12:00|16:00|20:00",
                        "420k|520k|520k|620k",
                        "Còn trống|Còn trống|Đang chọn|Hết chỗ"
                ),
                createRoom(
                        "Superior",
                        new BigDecimal("520000"),
                        "Chi nhánh Vincom",
                        "Superior City View",
                        "Phòng sáng, có view thành phố, thích hợp cho cặp đôi.",
                        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=jNQXAC9IVRw",
                        true,
                        2,
                        "Điều hòa|Wi-Fi|Bàn làm việc|View đẹp",
                        "09:00|13:00|17:00|21:00",
                        "520k|620k|620k|720k",
                        "Còn trống|Còn trống|Hết chỗ|Hết chỗ"
                ),
                createRoom(
                        "Deluxe",
                        new BigDecimal("650000"),
                        "Chi nhánh Hồ Con Rùa",
                        "Deluxe Balcony",
                        "Ban công riêng, tone màu hiện đại, không gian thư giãn.",
                        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=ysz5S6PUM-U",
                        true,
                        3,
                        "Ban công|Wi-Fi|TV|Nước uống",
                        "08:30|12:30|16:30|20:30",
                        "650k|750k|750k|850k",
                        "Còn trống|Đang chọn|Còn trống|Hết chỗ"
                ),
                createRoom(
                        "Premium",
                        new BigDecimal("780000"),
                        "Chi nhánh Hồ Con Rùa",
                        "Premium Suite",
                        "Sang trọng hơn, phù hợp khách cần trải nghiệm thoải mái.",
                        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=oHg5SJYRHA0",
                        false,
                        4,
                        "Giường lớn|Wi-Fi|Mini bar|Điều hòa",
                        "10:00|14:00|18:00|22:00",
                        "780k|880k|880k|980k",
                        "Còn trống|Còn trống|Đang chọn|Hết chỗ"
                ),
                createRoom(
                        "Family",
                        new BigDecimal("900000"),
                        "Chi nhánh Phú Nhuận",
                        "Family Connect",
                        "Hai giường rộng, phù hợp nhóm nhỏ hoặc gia đình.",
                        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=DLzxrzFCyOs",
                        false,
                        5,
                        "2 giường|Wi-Fi|Bàn ăn|Tủ lạnh",
                        "08:00|11:00|15:00|19:00",
                        "900k|1.0tr|1.0tr|1.1tr",
                        "Còn trống|Còn trống|Còn trống|Hết chỗ"
                ),
                createRoom(
                        "Penthouse",
                        new BigDecimal("1250000"),
                        "Chi nhánh Phú Nhuận",
                        "Penthouse Skyline",
                        "Không gian cao cấp nhất, view đẹp, nhiều tiện nghi.",
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=J---aiyznGQ",
                        false,
                        6,
                        "View skyline|Bồn tắm|Wi-Fi|Phòng khách riêng",
                        "09:30|13:30|17:30|21:30",
                        "1.25tr|1.35tr|1.35tr|1.45tr",
                        "Còn trống|Đang chọn|Hết chỗ|Hết chỗ"
                ),
                createRoom(
                        "Business",
                        new BigDecimal("560000"),
                        "Chi nhánh Bến Thành",
                        "Business Center",
                        "Phù hợp khách công tác, gần trung tâm và tiện di chuyển.",
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=1La4QzGeaaQ",
                        false,
                        7,
                        "Wi-Fi|Bàn làm việc|Điều hòa|Nước uống",
                        "07:00|11:00|15:00|19:00",
                        "560k|660k|660k|760k",
                        "Còn trống|Còn trống|Đang chọn|Hết chỗ"
                ),
                createRoom(
                        "Couple",
                        new BigDecimal("480000"),
                        "Chi nhánh Quận 7",
                        "Couple Garden",
                        "Không gian nhẹ nhàng, hợp cho nghỉ ngắn và hẹn hò.",
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=2Vv-BfVoq4g",
                        false,
                        8,
                        "Giường đôi|Wi-Fi|Đèn ngủ|Bồn tắm",
                        "09:00|12:00|16:00|21:00",
                        "480k|580k|580k|680k",
                        "Còn trống|Đang chọn|Còn trống|Hết chỗ"
                ),
                createRoom(
                        "Luxury",
                        new BigDecimal("980000"),
                        "Chi nhánh Gò Vấp",
                        "Luxury Signature",
                        "Phòng sang trọng, rộng rãi, phù hợp khách cần trải nghiệm cao cấp.",
                        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
                        "https://www.youtube.com/watch?v=tAGnKpE4NCI",
                        false,
                        9,
                        "View đẹp|Wi-Fi|Mini bar|Phòng tắm riêng",
                        "10:00|14:00|18:00|22:00",
                        "980k|1.08tr|1.08tr|1.18tr",
                        "Còn trống|Còn trống|Đang chọn|Hết chỗ"
                )
        ));
    }

    private Room createRoom(String roomType,
                            BigDecimal roomPrice,
                            String areaName,
                            String displayName,
                            String description,
                            String imageUrl,
                            String galleryCsv,
                            String videoUrl,
                            boolean showOnHome,
                            Integer homeOrder,
                            String featuresCsv,
                            String slotTimesCsv,
                            String slotPricesCsv,
                            String slotStatusesCsv) {
        Room room = new Room();
        room.setRoomType(roomType);
        room.setRoomPrice(roomPrice);
        room.setAreaName(areaName);
        room.setDisplayName(displayName);
        room.setDescription(description);
        room.setImageUrl(imageUrl);
        room.setGalleryCsv(galleryCsv);
        room.setVideoUrl(videoUrl);
        room.setShowOnHome(showOnHome);
        room.setHomeOrder(homeOrder);
        room.setFeaturesCsv(featuresCsv);
        room.setSlotTimesCsv(slotTimesCsv);
        room.setSlotPricesCsv(slotPricesCsv);
        room.setSlotStatusesCsv(slotStatusesCsv);
        return room;
    }
}
