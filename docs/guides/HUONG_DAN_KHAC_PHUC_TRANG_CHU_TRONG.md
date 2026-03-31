# Hướng Dẫn Khắc Phục Trang Chủ Không Hiển Thị Dữ Liệu

## Vấn Đề
Trang chủ không load được hình ảnh và thông tin vì:
- Database chưa có chi nhánh (Branch)
- Database chưa có phòng (Room)
- HomePage Config vẫn dùng tên "LuxeStay" thay vì "Fiin Home"

## Giải Pháp

### Bước 1: Chạy SQL Script Setup Database

```bash
# Đăng nhập MySQL
mysql -u root -p

# Chọn database (thay hotel_booking_db bằng tên database của bạn)
USE hotel_booking_db;

# Chạy script setup
SOURCE be/scripts/setup_database.sql;

# Hoặc chạy trực tiếp từ command line:
mysql -u root -p hotel_booking_db < be/scripts/setup_database.sql
```

### Bước 2: Restart Backend

```bash
cd be
./mvnw spring-boot:run
```

### Bước 3: Kiểm Tra API

```bash
# Kiểm tra branches
curl http://localhost:8080/api/public/branches

# Kiểm tra home page
curl http://localhost:8080/api/public/home-page
```

Bạn sẽ thấy:
- `brandName: "Fiin Home"` ✅
- `areas: [...]` có dữ liệu ✅
- Nhưng `introCards: []` và `roomLists: {}` vẫn trống vì chưa có phòng

### Bước 4: Thêm Phòng Qua Admin Panel

1. **Đăng nhập Admin**: http://localhost:3000/admin
   - Email: admin@example.com (hoặc email admin của bạn)
   - Password: (mật khẩu admin)

2. **Vào tab "Chi nhánh"**:
   - Xác nhận có 2 chi nhánh: "Căn PG2-11" và "Hẻm Duy Khổng"
   - Cả 2 đều ở trạng thái "Hoạt động"

3. **Vào tab "Quản lý phòng"**:
   - Click "+ Thêm phòng"
   - Điền thông tin:
     - **Loại phòng**: Deluxe
     - **Giá phòng**: 300000
     - **Chi nhánh**: Chọn "Căn PG2-11"
     - **Tên hiển thị**: Phòng Deluxe PG2-11
     - **Mô tả**: Phòng rộng rãi, đầy đủ tiện nghi
     - **URL ảnh chính**: https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800
     - **Tiện nghi (CSV)**: WiFi|TV|Điều hòa|Tủ lạnh|Máy nước nóng
     - **Khung giờ (CSV)**: 8h-12h|13h-17h|18h-22h
     - **Giá khung giờ (CSV)**: 200k|250k|300k
     - **Trạng thái slot (CSV)**: Còn Trống|Còn Trống|Còn Trống
     - ✅ **Tick "Hiển thị ở Trang giới thiệu"**
     - **Thứ tự ưu tiên**: 1
   - Click "Lưu phòng"

4. **Thêm phòng thứ 2**:
   - Làm tương tự với chi nhánh "Hẻm Duy Khổng"
   - Nhớ tick "Hiển thị ở Trang giới thiệu"
   - Thứ tự ưu tiên: 2

### Bước 5: Kiểm Tra Trang Chủ

1. Mở http://localhost:3000
2. Bạn sẽ thấy:
   - ✅ Logo "Fiin Home"
   - ✅ Phần "Trang giới thiệu" có các phòng đã tick
   - ✅ Có thể chọn chi nhánh
   - ✅ Hiển thị phòng và khung giờ
   - ✅ Có thể đặt phòng

## Lưu Ý Quan Trọng

### 1. Về Chi Nhánh (Branch)
- Chi nhánh phải ở trạng thái "Hoạt động" thì phòng mới hiển thị ở trang chủ
- Nếu "Tạm dừng" chi nhánh → tất cả phòng thuộc chi nhánh đó sẽ ẩn

### 2. Về Phòng (Room)
- Phòng phải thuộc một chi nhánh đang hoạt động
- Tick "Hiển thị ở Trang giới thiệu" để phòng xuất hiện trong phần IntroCards
- Thứ tự ưu tiên (homeOrder) quyết định thứ tự hiển thị (số nhỏ hơn → hiển thị trước)

### 3. Về Hình Ảnh
- Dùng URL hình ảnh từ internet (Unsplash, Imgur, etc.)
- Hoặc upload file ảnh trực tiếp trong form (sẽ convert sang base64)
- Gallery CSV: nhiều URL cách nhau bằng dấu `|`

### 4. Về Khung Giờ
- Slot Times, Prices, Statuses phải có cùng số lượng phần tử
- Cách nhau bằng dấu `|`
- Ví dụ:
  - Times: `8h-12h|13h-17h|18h-22h`
  - Prices: `200k|250k|300k`
  - Statuses: `Còn Trống|Còn Trống|Đã Đặt`

## Troubleshooting

### Vẫn không thấy dữ liệu?

1. **Kiểm tra backend logs**:
```bash
# Xem log backend
tail -f be/logs/spring.log
```

2. **Kiểm tra database**:
```sql
-- Kiểm tra branches
SELECT * FROM branch;

-- Kiểm tra rooms
SELECT id, display_name, area_name, show_on_home FROM room;

-- Kiểm tra config
SELECT brand_name FROM home_page_config WHERE config_key = 'landing-home-page';
```

3. **Kiểm tra frontend console**:
- Mở DevTools (F12)
- Xem tab Console có lỗi gì không
- Xem tab Network → API call `/api/public/home-page` trả về gì

### Lỗi "Cannot find table branch"?

Chạy lại script tạo bảng:
```bash
mysql -u root -p hotel_booking_db < be/scripts/create_branch_table.sql
```

### Phòng không hiển thị ở trang chủ?

Kiểm tra:
- ✅ Chi nhánh đang "Hoạt động"
- ✅ Phòng đã tick "Hiển thị ở Trang giới thiệu"
- ✅ Phòng có `areaName` khớp với tên chi nhánh

## Kết Quả Mong Đợi

Sau khi hoàn thành các bước trên, trang chủ sẽ:
- Hiển thị logo và tên "Fiin Home"
- Có phần "Trang giới thiệu" với các phòng nổi bật
- Có thể chọn chi nhánh và xem phòng
- Có thể chọn ngày và khung giờ
- Có thể đặt phòng thành công

## Liên Hệ Hỗ Trợ

Nếu vẫn gặp vấn đề, hãy cung cấp:
1. Screenshot lỗi trên frontend
2. Backend logs
3. Kết quả query database
4. Response từ API `/api/public/home-page`
