#!/bin/bash

# Script test logic đặt phòng theo giờ
# Chạy: bash test-booking.sh

API_BASE="http://localhost:8080"
ROOM_ID=1

echo "========================================="
echo "TEST BOOKING LOGIC - HOURLY ROOM BOOKING"
echo "========================================="
echo ""

# TC1: Đặt phòng thành công - Time slot còn trống
echo "TC1: Đặt phòng thành công - Thứ 4, 14h-16h"
echo "-----------------------------------------"
RESPONSE1=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
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
  }')
echo "Response: $RESPONSE1"
if [[ $RESPONSE1 == *"Successfully"* ]] || [[ $RESPONSE1 == *"confirmation"* ]]; then
  echo "✅ TC1 PASSED"
else
  echo "❌ TC1 FAILED"
fi
echo ""
sleep 1

# TC2: Đặt phòng thất bại - Time slot đã được đặt
echo "TC2: Đặt phòng thất bại - Cùng Thứ 4, 14h-16h (đã đặt)"
echo "--------------------------------------------------------"
RESPONSE2=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
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
  }')
echo "Response: $RESPONSE2"
if [[ $RESPONSE2 == *"đã được đặt"* ]] || [[ $RESPONSE2 == *"already booked"* ]]; then
  echo "✅ TC2 PASSED - Correctly rejected duplicate booking"
else
  echo "❌ TC2 FAILED - Should reject duplicate booking"
fi
echo ""
sleep 1

# TC3: Đặt phòng thành công - Cùng ngày nhưng khác time slot
echo "TC3: Đặt phòng thành công - Cùng Thứ 4, nhưng 16h-18h"
echo "------------------------------------------------------"
RESPONSE3=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
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
  }')
echo "Response: $RESPONSE3"
if [[ $RESPONSE3 == *"Successfully"* ]] || [[ $RESPONSE3 == *"confirmation"* ]]; then
  echo "✅ TC3 PASSED - Same day, different time slot allowed"
else
  echo "❌ TC3 FAILED"
fi
echo ""
sleep 1

# TC4: Đặt phòng thành công - Cùng time slot nhưng khác ngày
echo "TC4: Đặt phòng thành công - Thứ 5, 14h-16h (khác ngày)"
echo "--------------------------------------------------------"
RESPONSE4=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
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
  }')
echo "Response: $RESPONSE4"
if [[ $RESPONSE4 == *"Successfully"* ]] || [[ $RESPONSE4 == *"confirmation"* ]]; then
  echo "✅ TC4 PASSED - Different day, same time slot allowed"
else
  echo "❌ TC4 FAILED"
fi
echo ""

echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo "Kiểm tra kết quả trên:"
echo "1. Backend logs"
echo "2. Database: SELECT * FROM booked_room WHERE room_id = ${ROOM_ID};"
echo "3. Frontend: http://localhost:3000"
echo "   - Chọn 'Thứ 4': Slot 14h-16h và 16h-18h phải hiển thị 'Đã Đặt'"
echo "   - Chọn 'Thứ 5': Chỉ slot 14h-16h hiển thị 'Đã Đặt'"
echo ""
echo "Để xóa test data:"
echo "DELETE FROM booked_room WHERE guest_email IN ('a@test.com', 'b@test.com', 'c@test.com', 'd@test.com');"
