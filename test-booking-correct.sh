#!/bin/bash

API_BASE="http://localhost:8080"
ROOM_ID=1

echo "========================================="
echo "TEST BOOKING LOGIC - CORRECT TIME SLOTS"
echo "========================================="
echo ""
echo "Room has slots: 8h-12h, 13h-17h, 18h-22h"
echo ""

# TC1: Đặt phòng thành công - Thứ 4, 13h-17h
echo "TC1: Đặt phòng thành công - Thứ 4, 13h-17h"
echo "-----------------------------------------"
RESPONSE1=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-01",
    "checkOutDate": "2026-04-01",
    "guestName": "Test User 1",
    "guestEmail": "test1@example.com",
    "guestPhone": "0123456789",
    "receiveBookingEmail": true,
    "numOfAdults": 2,
    "numOfChildren": 0,
    "transportType": "Xe may",
    "acceptedTerms": true,
    "branchName": "Căn PG2-11",
    "selectedRoomName": "Phòng Deluxe PG2-11",
    "selectedDayLabel": "Thứ 4",
    "selectedSlotTime": "13h-17h",
    "selectedSlotPrice": "200k"
  }')
echo "Response: $RESPONSE1"
if [[ $RESPONSE1 == *"Successfully"* ]] || [[ $RESPONSE1 == *"confirmation"* ]]; then
  echo "✅ TC1 PASSED"
else
  echo "❌ TC1 FAILED"
fi
echo ""
sleep 1

# TC2: Đặt phòng thất bại - Cùng slot đã đặt
echo "TC2: Đặt phòng thất bại - Cùng Thứ 4, 13h-17h (đã đặt)"
echo "--------------------------------------------------------"
RESPONSE2=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-01",
    "checkOutDate": "2026-04-01",
    "guestName": "Test User 2",
    "guestEmail": "test2@example.com",
    "guestPhone": "0987654321",
    "receiveBookingEmail": true,
    "numOfAdults": 1,
    "numOfChildren": 0,
    "transportType": "Xe o to",
    "acceptedTerms": true,
    "branchName": "Căn PG2-11",
    "selectedRoomName": "Phòng Deluxe PG2-11",
    "selectedDayLabel": "Thứ 4",
    "selectedSlotTime": "13h-17h",
    "selectedSlotPrice": "200k"
  }')
echo "Response: $RESPONSE2"
if [[ $RESPONSE2 == *"đã được đặt"* ]] || [[ $RESPONSE2 == *"Xin"* ]]; then
  echo "✅ TC2 PASSED - Correctly rejected duplicate booking"
else
  echo "❌ TC2 FAILED - Should reject duplicate booking"
fi
echo ""
sleep 1

# TC3: Đặt phòng thành công - Cùng ngày khác slot
echo "TC3: Đặt phòng thành công - Cùng Thứ 4, nhưng 18h-22h"
echo "------------------------------------------------------"
RESPONSE3=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-01",
    "checkOutDate": "2026-04-01",
    "guestName": "Test User 3",
    "guestEmail": "test3@example.com",
    "guestPhone": "0111222333",
    "receiveBookingEmail": true,
    "numOfAdults": 2,
    "numOfChildren": 1,
    "transportType": "Xe may",
    "acceptedTerms": true,
    "branchName": "Căn PG2-11",
    "selectedRoomName": "Phòng Deluxe PG2-11",
    "selectedDayLabel": "Thứ 4",
    "selectedSlotTime": "18h-22h",
    "selectedSlotPrice": "250k"
  }')
echo "Response: $RESPONSE3"
if [[ $RESPONSE3 == *"Successfully"* ]] || [[ $RESPONSE3 == *"confirmation"* ]]; then
  echo "✅ TC3 PASSED - Same day, different time slot allowed"
else
  echo "❌ TC3 FAILED"
fi
echo ""
sleep 1

# TC4: Đặt phòng thành công - Khác ngày cùng slot
echo "TC4: Đặt phòng thành công - Thứ 5, 13h-17h (khác ngày)"
echo "--------------------------------------------------------"
RESPONSE4=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2026-04-02",
    "checkOutDate": "2026-04-02",
    "guestName": "Test User 4",
    "guestEmail": "test4@example.com",
    "guestPhone": "0444555666",
    "receiveBookingEmail": true,
    "numOfAdults": 3,
    "numOfChildren": 0,
    "transportType": "Xe o to",
    "acceptedTerms": true,
    "branchName": "Căn PG2-11",
    "selectedRoomName": "Phòng Deluxe PG2-11",
    "selectedDayLabel": "Thứ 5",
    "selectedSlotTime": "13h-17h",
    "selectedSlotPrice": "200k"
  }')
echo "Response: $RESPONSE4"
if [[ $RESPONSE4 == *"Successfully"* ]] || [[ $RESPONSE4 == *"confirmation"* ]]; then
  echo "✅ TC4 PASSED - Different day, same time slot allowed"
else
  echo "❌ TC4 FAILED"
fi
echo ""

echo "========================================="
echo "VERIFICATION"
echo "========================================="
echo ""
echo "Checking Thứ 4 (2026-04-01) slots:"
curl -s "http://localhost:8080/api/public/home-page?dayLabel=Th%E1%BB%A9%204" | python3 -c "import sys, json; data=json.load(sys.stdin); room=data['roomLists']['Căn PG2-11'][0]; [print(f\"  {s['time']}: {s['status']}\") for s in room['slots']]"
echo ""
echo "Checking Thứ 5 (2026-04-02) slots:"
curl -s "http://localhost:8080/api/public/home-page?dayLabel=Th%E1%BB%A9%205" | python3 -c "import sys, json; data=json.load(sys.stdin); room=data['roomLists']['Căn PG2-11'][0]; [print(f\"  {s['time']}: {s['status']}\") for s in room['slots']]"
echo ""
echo "To clean up test data:"
echo "DELETE FROM booked_room WHERE guest_email LIKE 'test%@example.com';"
