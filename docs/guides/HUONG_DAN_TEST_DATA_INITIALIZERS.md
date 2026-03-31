# Hướng Dẫn Test Data Initializers

## Tổng Quan

Đã tạo `BranchDataInitializer` để tự động khởi tạo dữ liệu khi backend khởi động:
- **3 chi nhánh**: Căn PG2-11, Hẻm Duy Khổng, Quận 7
- **7 phòng**: 6 phòng hiển thị ở trang chủ, 1 phòng không hiển thị
- **Brand name**: "Fiin Home"

## Thứ Tự Chạy Initializers

1. **@Order(1)** - `BranchDataInitializer`: Tạo 3 chi nhánh và 7 phòng
2. **@Order(2)** - `HomePageDataInitializer`: Tạo config trang chủ với "Fiin Home"
3. **@Order(3)** - `RoomDataInitializer`: Bị disable (không làm gì)

## Chi Tiết Dữ Liệu Được Tạo

### 3 Chi Nhánh

1. **Căn PG2-11**
   - Địa chỉ: Căn PG2-11, khu Vincom
   - Phone: 1900 2026
   - Mô tả: Chi nhánh tại khu vực Vincom - Chill, riêng tư, dễ chọn

2. **Hẻm Duy Khổng**
   - Địa chỉ: Hẻm Duy Khổng
   - Phone: 1900 2027
   - Mô tả: Chi nhánh tại Hẻm Duy Khổng - Yên tĩnh, tiện nghi

3. **Quận 7**
   - Địa chỉ: Phú Mỹ Hưng, Quận 7
   - Phone: 1900 2028
   - Mô tả: Chi nhánh tại Quận 7 - Hiện đại, gần trung tâm

### 7 Phòng

#### Chi nhánh Căn PG2-11 (3 phòng)

1. **Phòng Deluxe PG2-11** ✅ Hiển thị trang chủ
   - Loại: Deluxe
   - Giá: 300,000đ
   - Tiện nghi: WiFi, TV, Điều hòa, Tủ lạnh, Máy nước nóng
   - Khung giờ: 8h-12h (200k), 13h-17h (250k), 18h-22h (300k)

2. **Phòng Superior PG2-11** ✅ Hiển thị trang chủ
   - Loại: Superior
   - Giá: 250,000đ
   - Tiện nghi: WiFi, TV, Điều hòa, Tủ lạnh
   - Khung giờ: 8h-12h (180k), 13h-17h (220k), 18h-22h (250k)

3. **Studio PG2-11** ❌ Không hiển thị trang chủ
   - Loại: Studio
   - Giá: 280,000đ
   - Tiện nghi: WiFi, TV, Điều hòa, Tủ lạnh, Bếp nhỏ
   - Khung giờ: 8h-12h (190k), 13h-17h (230k), 18h-22h (280k)

#### Chi nhánh Hẻm Duy Khổng (2 phòng)

4. **Phòng Standard Duy Khổng** ✅ Hiển thị trang chủ
   - Loại: Standard
   - Giá: 200,000đ
   - Tiện nghi: WiFi, TV, Điều hòa
   - Khung giờ: 8h-12h (150k), 13h-17h (180k), 18h-22h (200k)

5. **Phòng Premium Duy Khổng** ✅ Hiển thị trang chủ
   - Loại: Premium
   - Giá: 350,000đ
   - Tiện nghi: WiFi, TV, Điều hòa, Tủ lạnh, Máy nước nóng, Bồn tắm
   - Khung giờ: 8h-12h (220k), 13h-17h (280k), 18h-22h (350k)

#### Chi nhánh Quận 7 (2 phòng)

6. **Phòng Family Quận 7** ✅ Hiển thị trang chủ
   - Loại: Family
   - Giá: 400,000đ
   - Tiện nghi: WiFi, TV, Điều hòa, Tủ lạnh, Máy nước nóng, Bếp nhỏ
   - Khung giờ: 8h-12h (250k), 13h-17h (320k), 18h-22h (400k)

7. **Suite Quận 7** ✅ Hiển thị trang chủ
   - Loại: Suite
   - Giá: 500,000đ
   - Tiện nghi: WiFi, TV, Điều hòa, Tủ lạnh, Máy nước nóng, Bồn tắm, Phòng khách
   - Khung giờ: 8h-12h (300k), 13h-17h (400k), 18h-22h (500k)

## Cách Test

### Bước 1: Reset Database (Đã chạy)

```bash
mysql -h 127.0.0.1 -u root -p1111 hotel_booking_db < be/scripts/reset_for_testing.sql
```

### Bước 2: Restart Backend

```bash
cd be
./mvnw spring-boot:run
```

Khi backend khởi động, bạn sẽ thấy log:
```
Initializing branches and sample rooms...
Created 3 branches successfully.
Created 7 sample rooms successfully.
Branch and room initialization completed!
```

### Bước 3: Kiểm Tra API

```bash
# Kiểm tra branches
curl http://localhost:8080/api/public/branches

# Kiểm tra home page
curl http://localhost:8080/api/public/home-page | grep brandName

# Kiểm tra số lượng
curl -s http://localhost:8080/api/public/home-page | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Brand: {data[\"brandName\"]}'); print(f'Areas: {len(data[\"areas\"])}'); print(f'IntroCards: {len(data[\"introCards\"])}'); print(f'RoomLists: {sum(len(v) for v in data[\"roomLists\"].values())}')"
```

Kết quả mong đợi:
```
Brand: Fiin Home
Areas: 3
IntroCards: 6
RoomLists: 7
```

### Bước 4: Kiểm Tra Frontend

1. Mở http://localhost:3000
2. Xác nhận:
   - ✅ Logo và tên "Fiin Home"
   - ✅ Phần "Trang giới thiệu" có 6 phòng
   - ✅ Có 3 chi nhánh để chọn
   - ✅ Mỗi chi nhánh có phòng tương ứng
   - ✅ Có thể chọn khung giờ và đặt phòng

### Bước 5: Test Đặt Phòng

1. Chọn chi nhánh "Căn PG2-11"
2. Chọn ngày "Hôm nay"
3. Chọn phòng "Phòng Deluxe PG2-11"
4. Chọn khung giờ "8h-12h"
5. Click "Đặt phòng ngay"
6. Điền thông tin và submit
7. Xác nhận booking thành công

### Bước 6: Kiểm Tra Admin Panel

1. Đăng nhập: http://localhost:3000/admin
2. Tab "Chi nhánh": Xác nhận có 3 chi nhánh
3. Tab "Quản lý phòng": Xác nhận có 7 phòng
4. Tab "Đặt phòng": Xác nhận có booking vừa tạo

## Lưu Ý

### Khi Nào Initializers Chạy?

- Chỉ chạy khi database TRỐNG (count = 0)
- Nếu đã có dữ liệu, initializers sẽ skip

### Làm Sao Để Chạy Lại?

1. Chạy script reset: `mysql ... < be/scripts/reset_for_testing.sql`
2. Restart backend

### Thêm/Sửa Dữ Liệu Mẫu

Chỉnh sửa file: `be/src/main/java/com/hotelbookingproject/BLITCoding/config/BranchDataInitializer.java`

### Disable Initializers

Thêm annotation `@Profile("!production")` để chỉ chạy ở môi trường dev:

```java
@Component
@Order(1)
@Profile("!production")
@RequiredArgsConstructor
public class BranchDataInitializer implements CommandLineRunner {
    // ...
}
```

## Troubleshooting

### Initializers không chạy?

Kiểm tra log backend khi khởi động. Nếu không thấy log "Initializing branches...", có thể:
- Database đã có dữ liệu (chạy reset script)
- Component không được scan (kiểm tra package)

### Phòng không hiển thị ở trang chủ?

Kiểm tra:
- `show_on_home = true` (6/7 phòng)
- Chi nhánh đang `active = true`
- `area_name` khớp với tên chi nhánh

### Brand name vẫn là "LuxeStay"?

- Xóa record trong `home_page_config` table
- Restart backend để tạo lại config mới

## Kết Quả Mong Đợi

Sau khi restart backend:
- ✅ 3 chi nhánh hoạt động
- ✅ 7 phòng (6 hiển thị trang chủ)
- ✅ Brand name "Fiin Home"
- ✅ Trang chủ hiển thị đầy đủ thông tin
- ✅ Có thể đặt phòng thành công
