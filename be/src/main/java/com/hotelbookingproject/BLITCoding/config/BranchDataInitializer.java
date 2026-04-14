package com.hotelbookingproject.BLITCoding.config;

import com.hotelbookingproject.BLITCoding.model.Branch;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.BranchRepository;
import com.hotelbookingproject.BLITCoding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@Order(1)
@RequiredArgsConstructor
public class BranchDataInitializer implements CommandLineRunner {

    private final BranchRepository branchRepository;
    private final RoomRepository roomRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (branchRepository.count() > 0) {
            System.out.println("Branches already exist. Skipping branch initialization.");
            return;
        }

        System.out.println("Initializing branches and sample rooms...");

        // Create 3 branches
        Branch branch1 = createBranch(
            "Căn PG2-11",
            "Chi nhánh khu Vincom, không gian riêng tư, dễ lựa chọn",
            "Căn PG2-11, khu Vincom",
            "1900 2026"
        );

        Branch branch2 = createBranch(
            "Hẻm Duy Khổng",
            "Chi nhánh Hẻm Duy Khổng, yên tĩnh và tiện nghi",
            "Hẻm Duy Khổng",
            "1900 2027"
        );

        Branch branch3 = createBranch(
            "Quận 7",
            "Chi nhánh Quận 7, hiện đại và thuận tiện",
            "Phú Mỹ Hưng, Quận 7",
            "1900 2028"
        );

        branchRepository.saveAll(List.of(branch1, branch2, branch3));
        System.out.println("Created 3 branches successfully.");

        // Create 7 sample rooms
        if (roomRepository.count() == 0) {
            Room room1 = createRoom(
                "Deluxe", new BigDecimal("300000"), branch1.getName(),
                "Phòng Deluxe PG2-11", "Phòng rộng rãi, đầy đủ tiện nghi, view đẹp",
                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800|https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                "", true, 1,
                "WiFi|TV|Điều hòa|Tủ lạnh|Máy nước nóng",
                "8h-12h|13h-17h|18h-22h",
                "200k|250k|300k",
                "Còn Trống|Còn Trống|Còn Trống"
            );

            Room room2 = createRoom(
                "Superior", new BigDecimal("250000"), branch1.getName(),
                "Phòng Superior PG2-11", "Phòng tiêu chuẩn cao cấp, thoải mái",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
                "", true, 2,
                "WiFi|TV|Điều hòa|Tủ lạnh",
                "8h-12h|13h-17h|18h-22h",
                "180k|220k|250k",
                "Còn Trống|Còn Trống|Còn Trống"
            );

            Room room3 = createRoom(
                "Standard", new BigDecimal("200000"), branch2.getName(),
                "Phòng Standard Duy Khổng", "Phòng tiêu chuẩn, sạch sẽ, tiện nghi cơ bản",
                "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
                "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
                "", true, 3,
                "WiFi|TV|Điều hòa",
                "8h-12h|13h-17h|18h-22h",
                "150k|180k|200k",
                "Còn Trống|Còn Trống|Còn Trống"
            );

            Room room4 = createRoom(
                "Premium", new BigDecimal("350000"), branch2.getName(),
                "Phòng Premium Duy Khổng", "Phòng cao cấp, sang trọng, đầy đủ tiện nghi",
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800|https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
                "", true, 4,
                "WiFi|TV|Điều hòa|Tủ lạnh|Máy nước nóng|Bồn tắm",
                "8h-12h|13h-17h|18h-22h",
                "220k|280k|350k",
                "Còn Trống|Còn Trống|Còn Trống"
            );

            Room room5 = createRoom(
                "Family", new BigDecimal("400000"), branch3.getName(),
                "Phòng Family Quận 7", "Phòng gia đình rộng rãi, phù hợp cho 4-6 người",
                "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
                "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800",
                "", true, 5,
                "WiFi|TV|Điều hòa|Tủ lạnh|Máy nước nóng|Bếp nhỏ",
                "8h-12h|13h-17h|18h-22h",
                "250k|320k|400k",
                "Còn Trống|Còn Trống|Còn Trống"
            );

            Room room6 = createRoom(
                "Suite", new BigDecimal("500000"), branch3.getName(),
                "Suite Quận 7", "Phòng suite sang trọng, view đẹp, đầy đủ tiện nghi cao cấp",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800|https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800",
                "", true, 6,
                "WiFi|TV|Điều hòa|Tủ lạnh|Máy nước nóng|Bồn tắm|Phòng khách",
                "8h-12h|13h-17h|18h-22h",
                "300k|400k|500k",
                "Còn Trống|Còn Trống|Còn Trống"
            );

            Room room7 = createRoom(
                "Studio", new BigDecimal("280000"), branch1.getName(),
                "Studio PG2-11", "Phòng studio hiện đại, phù hợp cho người độc thân",
                "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
                "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
                "", false, 7,
                "WiFi|TV|Điều hòa|Tủ lạnh|Bếp nhỏ",
                "8h-12h|13h-17h|18h-22h",
                "190k|230k|280k",
                "Còn Trống|Còn Trống|Còn Trống"
            );

            roomRepository.saveAll(List.of(room1, room2, room3, room4, room5, room6, room7));
            System.out.println("Created 7 sample rooms successfully.");
        }

        System.out.println("Branch and room initialization completed!");
    }

    private Branch createBranch(String name, String description, String address, String phone) {
        Branch branch = new Branch();
        branch.setName(name);
        branch.setDescription(description);
        branch.setAddress(address);
        branch.setPhone(phone);
        branch.setActive(true);
        return branch;
    }

    private Room createRoom(String roomType, BigDecimal roomPrice, String areaName,
                           String displayName, String description, String imageUrl,
                           String galleryCsv, String videoUrl, boolean showOnHome,
                           int homeOrder, String featuresCsv, String slotTimesCsv,
                           String slotPricesCsv, String slotStatusesCsv) {
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
