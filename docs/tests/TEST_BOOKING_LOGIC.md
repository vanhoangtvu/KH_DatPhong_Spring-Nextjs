# TEST PLAN - BOOKING LOGIC

## Mục tiêu
Kiểm tra logic đặt phòng theo giờ hoạt động chính xác:
- Mỗi phòng có thể được đặt nhiều lần trong cùng 1 ngày nhưng khác time slot
- Mỗi time slot chỉ được đặt 1 lần cho 1 ngày cụ thể
- Người khác có thể đặt cùng phòng nhưng khác ngày hoặc khác giờ

## Test Cases

### TC1: Đặt phòng thành công - Time slot còn trống
**Điều kiện:**
- Phòng: Room 1
- Ngày: 2026-04-01 (Thứ 4)
- Time slot: 14h-16h
- Chưa có booking nào

**Kết quả mong đợi:**
- ✅ Đặt phòng thành công
- Confirmation code được tạo
- Database lưu booking với checkInDate=2026-04-01, selectedSlotTime="14h-16h"

**Cách test:**
```bash
curl -X POST http://localhost:8080/bookings/room/1/booking \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-01",
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
    "selectedDayLabel": "Thứ 4",
    "selectedSlotTime": "14h-16h",
    "selectedSlotPrice": "150k"
  }'
```

---

### TC2: Đặt phòng thất bại - Time slot đã được đặt
**Điều kiện:**
- Phòng: Room 1
- Ngày: 2026-04-01 (Thứ 4)
- Time slot: 14h-16h
- ĐÃ CÓ booking từ TC1

**Kết quả mong đợi:**
- ❌ Đặt phòng thất bại
- Error message: "Xin lỗi, khung giờ 14h-16h ngày 2026-04-01 đã được đặt..."

**Cách test:**
```bash
# Chạy lại request giống TC1 với user khác
curl -X POST http://localhost:8080/bookings/room/1/booking \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-01",
    "checkOutDate": "2026-04-01",
    "guestName": "Tran Thi B",
    "guestEmail": "b@test.com",
    "guestPhone": "0987654321",
    "receiveBookingEmail": true,
    "numOfAdults": 1,
    "numOfChildren": 0,
    "transportType": "Xe o to",
    "acceptedTerms": true,
    "branchName": "Căn PG2-11",
    "selectedRoomName": "Phòng 1",
    "selectedDayLabel": "Thứ 4",
    "selectedSlotTime": "14h-16h",
    "selectedSlotPrice": "150k"
  }'
```

---

### TC3: Đặt phòng thành công - Cùng ngày nhưng khác time slot
**Điều kiện:**
- Phòng: Room 1
- Ngày: 2026-04-01 (Thứ 4) - CÙNG NGÀY với TC1
- Time slot: 16h-18h - KHÁC GIỜ với TC1
- Đã có booking 14h-16h từ TC1

**Kết quả mong đợi:**
- ✅ Đặt phòng thành công
- Cùng phòng, cùng ngày nhưng khác giờ → OK

**Cách test:**
```bash
curl -X POST http://localhost:8080/bookings/room/1/booking \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-01",
    "checkOutDate": "2026-04-01",
    "guestName": "Le Van C",
    "guestEmail": "c@test.com",
    "guestPhone": "0111222333",
    "receiveBookingEmail": true,
    "numOfAdults": 2,
    "numOfChildren": 1,
    "transportType": "Xe may",
    "acceptedTerms": true,
    "branchName": "Căn PG2-11",
    "selectedRoomName": "Phòng 1",
    "selectedDayLabel": "Thứ 4",
    "selectedSlotTime": "16h-18h",
    "selectedSlotPrice": "150k"
  }'
```

---

### TC4: Đặt phòng thành công - Cùng time slot nhưng khác ngày
**Điều kiện:**
- Phòng: Room 1
- Ngày: 2026-04-02 (Thứ 5) - KHÁC NGÀY với TC1
- Time slot: 14h-16h - CÙNG GIỜ với TC1
- Đã có booking 2026-04-01 14h-16h từ TC1

**Kết quả mong đợi:**
- ✅ Đặt phòng thành công
- Cùng phòng, cùng giờ nhưng khác ngày → OK

**Cách test:**
```bash
curl -X POST http://localhost:8080/bookings/room/1/booking \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-02",
    "checkOutDate": "2026-04-02",
    "guestName": "Pham Thi D",
    "guestEmail": "d@test.com",
    "guestPhone": "0444555666",
    "receiveBookingEmail": true,
    "numOfAdults": 3,
    "numOfChildren": 0,
    "transportType": "Xe o to",
    "acceptedTerms": true,
    "branchName": "Căn PG2-11",
    "selectedRoomName": "Phòng 1",
    "selectedDayLabel": "Thứ 5",
    "selectedSlotTime": "14h-16h",
    "selectedSlotPrice": "150k"
  }'
```

---

### TC5: Kiểm tra hiển thị trên UI - Slot đã đặt
**Điều kiện:**
- Đã có bookings từ TC1, TC3, TC4
- User mở trang chủ, chọn ngày Thứ 4 (2026-04-01)

**Kết quả mong đợi:**
- Slot 14h-16h: Hiển thị "Đã Đặt" (màu xám, disabled)
- Slot 16h-18h: Hiển thị "Đã Đặt" (màu xám, disabled)
- Các slot khác: Hiển thị "Còn Trống" (màu xanh, clickable)

**Cách test:**
1. Mở http://localhost:3000
2. Chọn chi nhánh "Căn PG2-11"
3. Chọn ngày "Thứ 4"
4. Kiểm tra Room 1:
   - ✅ 14h-16h = Đã Đặt
   - ✅ 16h-18h = Đã Đặt
   - ✅ 18h-20h = Còn Trống
   - ✅ 20h-22h = Còn Trống

---

### TC6: Kiểm tra hiển thị trên UI - Chuyển sang ngày khác
**Điều kiện:**
- Đã có bookings từ TC1, TC3, TC4
- User chuyển sang ngày Thứ 5 (2026-04-02)

**Kết quả mong đợi:**
- Slot 14h-16h: Hiển thị "Đã Đặt" (từ TC4)
- Slot 16h-18h: Hiển thị "Còn Trống" (chưa ai đặt)
- Các slot khác: Hiển thị "Còn Trống"

**Cách test:**
1. Mở http://localhost:3000
2. Chọn chi nhánh "Căn PG2-11"
3. Chọn ngày "Thứ 5"
4. Kiểm tra Room 1:
   - ✅ 14h-16h = Đã Đặt (từ TC4)
   - ✅ 16h-18h = Còn Trống
   - ✅ 18h-20h = Còn Trống
   - ✅ 20h-22h = Còn Trống

---

## Kết quả Test

### Backend Logic
- [ ] TC1: Đặt phòng thành công - Time slot còn trống
- [ ] TC2: Đặt phòng thất bại - Time slot đã được đặt
- [ ] TC3: Đặt phòng thành công - Cùng ngày khác giờ
- [ ] TC4: Đặt phòng thành công - Khác ngày cùng giờ

### Frontend Display
- [ ] TC5: Hiển thị đúng slots đã đặt cho ngày được chọn
- [ ] TC6: Hiển thị đúng khi chuyển sang ngày khác

---

## Ghi chú
- Sau mỗi test case, có thể xóa bookings để test lại: `DELETE FROM booked_room WHERE booking_id = ?`
- Hoặc dùng API: `DELETE http://localhost:8080/bookings/booking/{bookingId}/delete` (cần ADMIN role)
