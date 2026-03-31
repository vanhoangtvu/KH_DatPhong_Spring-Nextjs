# BOOKING LOGIC IMPLEMENTATION - HOURLY ROOM BOOKING

## Tổng quan

Hệ thống đặt phòng theo giờ (Hourly Room Booking) cho phép khách hàng đặt phòng khách sạn theo từng khung giờ cụ thể trong ngày, thay vì đặt cả ngày.

## Logic nghiệp vụ chuẩn (theo nghiên cứu)

### 1. Inventory Management
- **Đơn vị inventory**: 1 phòng + 1 ngày + 1 time slot = 1 đơn vị có thể đặt
- **Ví dụ**: Phòng 101, ngày 01/04/2026, slot 14h-16h

### 2. Availability Rules
- ✅ Cùng phòng, cùng ngày, KHÁC time slot → Cho phép đặt
- ✅ Cùng phòng, KHÁC ngày, cùng time slot → Cho phép đặt
- ❌ Cùng phòng, cùng ngày, CÙNG time slot → Từ chối (đã đặt)

### 3. Concurrency Control
- Sử dụng database constraints để tránh double-booking
- Kiểm tra availability ngay trước khi save booking
- Transaction isolation để đảm bảo consistency

## Implementation

### Backend Changes

#### 1. BookedRoomServiceImpl.java

**Method mới: `isTimeSlotAvailable()`**
```java
private boolean isTimeSlotAvailable(Long roomId, LocalDate date, String timeSlot) {
    // Lấy tất cả bookings của phòng
    List<BookedRoom> existingBookings = bookedRoomRepository.findByRoomId(roomId);
    
    // Kiểm tra xem có booking nào trùng CÙNG NGÀY VÀ CÙNG GIỜ không
    return existingBookings.stream()
        .noneMatch(booking -> 
            booking.getCheckInDate().equals(date) &&
            booking.getSelectedSlotTime().equalsIgnoreCase(timeSlot)
        );
}
```

**Method cập nhật: `saveBooking()`**
- Xóa logic cũ `roomIsAvailable()` (chỉ check date overlap)
- Xóa logic `updateBookedSlotStatus()` (không cần update Room entity)
- Thêm check `isTimeSlotAvailable()` trước khi save
- Throw exception rõ ràng nếu slot đã đặt

#### 2. HomePageConfigServiceImpl.java

**Method mới: `calculateDateFromDayLabel()`**
```java
private LocalDate calculateDateFromDayLabel(String dayLabel) {
    // "Hôm nay" → today
    // "Thứ 3", "Thứ 4"... → tìm ngày tiếp theo trong 7 ngày
    // Trả về LocalDate chính xác
}
```

**Method cập nhật: `buildBookedSlotTimesByRoom()`**
- Tính ngày thực tế từ dayLabel
- Lọc bookings theo `checkInDate` (ngày thực tế) thay vì `selectedDayLabel` (string)
- Chỉ hiển thị "Đã Đặt" cho đúng ngày và đúng giờ

### Frontend (Không thay đổi)

Frontend đã hoạt động đúng:
- Gửi `checkInDate` (LocalDate) và `selectedSlotTime` (String) trong booking request
- Hiển thị slots dựa trên response từ backend
- Chuyển ngày → backend tự động tính toán và trả về slots đúng

## Test Plan

### Automated Test Script
```bash
bash test-booking.sh
```

Script sẽ test 4 scenarios:
1. TC1: Đặt phòng thành công - slot còn trống
2. TC2: Đặt phòng thất bại - slot đã đặt
3. TC3: Đặt phòng thành công - cùng ngày khác giờ
4. TC4: Đặt phòng thành công - khác ngày cùng giờ

### Manual Test

Xem chi tiết trong `TEST_BOOKING_LOGIC.md`

## Database Schema

### BookedRoom Table
```sql
CREATE TABLE booked_room (
    booking_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ckeck_In DATE NOT NULL,              -- Ngày check-in (LocalDate)
    ckeck_out DATE NOT NULL,             -- Ngày check-out (LocalDate)
    selected_day_label VARCHAR(50),      -- "Hôm nay", "Thứ 3"... (display only)
    selected_slot_time VARCHAR(50),      -- "14h-16h", "16h-18h"... (CRITICAL)
    selected_slot_price VARCHAR(20),     -- "150k", "200k"...
    guest_FullName VARCHAR(255),
    guest_Email VARCHAR(255),
    guest_phone VARCHAR(20),
    room_id BIGINT,
    -- ... other fields
    FOREIGN KEY (room_id) REFERENCES room(id)
);
```

**Key Fields:**
- `ckeck_In` (checkInDate): Ngày thực tế để lọc bookings
- `selected_slot_time`: Time slot để check availability
- `selected_day_label`: Chỉ để hiển thị, không dùng cho logic

### Unique Constraint (Recommended)
```sql
ALTER TABLE booked_room 
ADD CONSTRAINT unique_room_date_slot 
UNIQUE (room_id, ckeck_In, selected_slot_time);
```

Constraint này đảm bảo database level không cho phép duplicate booking.

## API Endpoints

### POST /bookings/room/{roomId}/booking

**Request Body:**
```json
{
  "checkInDate": "2026-04-01",           // CRITICAL: Ngày thực tế
  "checkOutDate": "2026-04-01",
  "guestName": "Nguyen Van A",
  "guestEmail": "a@test.com",
  "guestPhone": "0123456789",
  "receiveBookingEmail": true,
  "numOfAdults": 2,
  "numOfChildren": 0,
  "transportType": "Xe may",
  "acceptedTerms": true,
  "branchName": "Căn PG2-11",
  "selectedRoomName": "Phòng 1",
  "selectedDayLabel": "Thứ 4",          // Display only
  "selectedSlotTime": "14h-16h",        // CRITICAL: Time slot
  "selectedSlotPrice": "150k"
}
```

**Success Response:**
```
Room Booked Successfully! Your confirmation code ABC123
```

**Error Response:**
```
Xin lỗi, khung giờ 14h-16h ngày 2026-04-01 đã được đặt. Vui lòng chọn khung giờ khác.
```

### GET /api/public/home-page?dayLabel=Thứ%204

**Response:**
```json
{
  "days": ["Hôm nay", "Thứ 3", "Thứ 4", ...],
  "roomLists": {
    "Căn PG2-11": [
      {
        "roomId": 1,
        "name": "Phòng 1",
        "slots": [
          {
            "time": "14h-16h",
            "price": "150k",
            "status": "Đã Đặt"      // Nếu đã có booking cho ngày này
          },
          {
            "time": "16h-18h",
            "price": "150k",
            "status": "Còn Trống"
          }
        ]
      }
    ]
  }
}
```

## Best Practices Applied

### 1. Single Source of Truth
- Bookings table là nguồn dữ liệu chính xác duy nhất
- Không lưu status trong Room entity (tránh inconsistency)

### 2. Real-time Availability Check
- Kiểm tra availability ngay trước khi save
- Dựa trên database queries, không cache

### 3. Clear Error Messages
- Thông báo lỗi rõ ràng: ngày nào, giờ nào đã đặt
- Gợi ý user chọn slot khác

### 4. Date-based Filtering
- Lọc theo `checkInDate` (LocalDate) thay vì `selectedDayLabel` (String)
- Tránh bug: "Thứ 3 tuần này" vs "Thứ 3 tuần sau"

## Known Limitations

### 1. No Soft Hold
- Chưa implement "giữ phòng tạm thời" khi user đang thanh toán
- Risk: User A đang thanh toán, User B có thể đặt cùng slot

**Solution (Future):**
- Thêm Redis cache với TTL 5 phút
- Lock slot khi user vào checkout
- Release lock nếu timeout hoặc payment failed

### 2. No Optimistic Locking
- Chưa có version field trong BookedRoom entity
- Risk: Race condition khi 2 requests đồng thời

**Solution (Future):**
- Thêm `@Version` field trong BookedRoom
- JPA tự động handle optimistic locking

### 3. No Transaction Isolation
- Chưa set explicit isolation level
- Default: READ_COMMITTED (có thể có phantom reads)

**Solution (Future):**
```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public String saveBooking(Long roomId, BookedRoom bookingRequest) {
    // ...
}
```

## Deployment Checklist

- [ ] Backend code đã update (BookedRoomServiceImpl, HomePageConfigServiceImpl)
- [ ] Database có dữ liệu test (rooms, time slots)
- [ ] Backend đang chạy: http://localhost:8080
- [ ] Frontend đang chạy: http://localhost:3000
- [ ] Run test script: `bash test-booking.sh`
- [ ] Manual test trên UI
- [ ] Check database: `SELECT * FROM booked_room;`
- [ ] (Optional) Add unique constraint: `ALTER TABLE booked_room ADD CONSTRAINT...`

## Troubleshooting

### Issue: Slot vẫn hiển thị "Đã Đặt" khi chuyển sang ngày khác

**Cause:** Backend lọc theo `selectedDayLabel` thay vì `checkInDate`

**Fix:** Đã sửa trong `buildBookedSlotTimesByRoom()` - lọc theo `checkInDate`

### Issue: 2 người có thể đặt cùng slot cùng ngày

**Cause:** Logic `isTimeSlotAvailable()` không chính xác

**Fix:** Đã sửa - check cả `checkInDate` VÀ `selectedSlotTime`

### Issue: Database constraint violation

**Cause:** Đã có unique constraint `(room_id, ckeck_In, selected_slot_time)`

**Fix:** Đây là behavior mong muốn! Application đã handle và throw exception rõ ràng.

## References

- [System Design: Hotel Booking System](https://www.systemdesignhandbook.com/guides/design-hotel-booking-system/)
- [Hourly Hotel Booking Trends](https://www.hospitalitynet.org/news/4125253/)
- Best practices: Optimistic locking, Saga pattern, Inventory management

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-31  
**Author:** Kiro AI Assistant
