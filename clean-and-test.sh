#!/bin/bash

echo "Cleaning old test bookings from previous tests..."
echo "Note: This requires direct database access"
echo ""

API_BASE="http://localhost:8080"
ROOM_ID=1

echo "========================================="
echo "FRESH TEST - BOOKING LOGIC"
echo "========================================="
echo "Today: $(date +"%Y-%m-%d %A")"
echo "Testing with tomorrow (Thứ 4 = Wednesday)"
echo ""

# Calculate tomorrow's date
TOMORROW=$(date -d "+1 day" +"%Y-%m-%d")
DAY_AFTER=$(date -d "+2 days" +"%Y-%m-%d")

echo "Tomorrow: $TOMORROW (Thứ 4)"
echo "Day after: $DAY_AFTER (Thứ 5)"
echo ""

# TC1: Book slot 13h-17h for tomorrow
echo "TC1: Booking 13h-17h for $TOMORROW (Thứ 4)"
echo "-------------------------------------------"
RESPONSE1=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkInDate\": \"$TOMORROW\",
    \"checkOutDate\": \"$TOMORROW\",
    \"guestName\": \"Fresh Test 1\",
    \"guestEmail\": \"fresh1@test.com\",
    \"guestPhone\": \"0123000001\",
    \"receiveBookingEmail\": true,
    \"numOfAdults\": 2,
    \"numOfChildren\": 0,
    \"transportType\": \"Xe may\",
    \"acceptedTerms\": true,
    \"branchName\": \"Căn PG2-11\",
    \"selectedRoomName\": \"Phòng Deluxe PG2-11\",
    \"selectedDayLabel\": \"Thứ 4\",
    \"selectedSlotTime\": \"13h-17h\",
    \"selectedSlotPrice\": \"200k\"
  }")
echo "$RESPONSE1"
[[ $RESPONSE1 == *"Successfully"* ]] && echo "✅ PASSED" || echo "❌ FAILED"
echo ""
sleep 1

# TC2: Try to book same slot (should fail)
echo "TC2: Booking same slot 13h-17h for $TOMORROW (should FAIL)"
echo "------------------------------------------------------------"
RESPONSE2=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkInDate\": \"$TOMORROW\",
    \"checkOutDate\": \"$TOMORROW\",
    \"guestName\": \"Fresh Test 2\",
    \"guestEmail\": \"fresh2@test.com\",
    \"guestPhone\": \"0123000002\",
    \"receiveBookingEmail\": true,
    \"numOfAdults\": 1,
    \"numOfChildren\": 0,
    \"transportType\": \"Xe o to\",
    \"acceptedTerms\": true,
    \"branchName\": \"Căn PG2-11\",
    \"selectedRoomName\": \"Phòng Deluxe PG2-11\",
    \"selectedDayLabel\": \"Thứ 4\",
    \"selectedSlotTime\": \"13h-17h\",
    \"selectedSlotPrice\": \"200k\"
  }")
echo "$RESPONSE2"
[[ $RESPONSE2 == *"Xin"* ]] && echo "✅ PASSED (correctly rejected)" || echo "❌ FAILED (should reject)"
echo ""
sleep 1

# TC3: Book different slot same day
echo "TC3: Booking 18h-22h for $TOMORROW (different slot, should PASS)"
echo "------------------------------------------------------------------"
RESPONSE3=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkInDate\": \"$TOMORROW\",
    \"checkOutDate\": \"$TOMORROW\",
    \"guestName\": \"Fresh Test 3\",
    \"guestEmail\": \"fresh3@test.com\",
    \"guestPhone\": \"0123000003\",
    \"receiveBookingEmail\": true,
    \"numOfAdults\": 2,
    \"numOfChildren\": 1,
    \"transportType\": \"Xe may\",
    \"acceptedTerms\": true,
    \"branchName\": \"Căn PG2-11\",
    \"selectedRoomName\": \"Phòng Deluxe PG2-11\",
    \"selectedDayLabel\": \"Thứ 4\",
    \"selectedSlotTime\": \"18h-22h\",
    \"selectedSlotPrice\": \"250k\"
  }")
echo "$RESPONSE3"
[[ $RESPONSE3 == *"Successfully"* ]] && echo "✅ PASSED" || echo "❌ FAILED"
echo ""
sleep 1

# TC4: Book same slot different day
echo "TC4: Booking 13h-17h for $DAY_AFTER (different day, should PASS)"
echo "------------------------------------------------------------------"
RESPONSE4=$(curl -s -X POST "${API_BASE}/bookings/room/${ROOM_ID}/booking" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkInDate\": \"$DAY_AFTER\",
    \"checkOutDate\": \"$DAY_AFTER\",
    \"guestName\": \"Fresh Test 4\",
    \"guestEmail\": \"fresh4@test.com\",
    \"guestPhone\": \"0123000004\",
    \"receiveBookingEmail\": true,
    \"numOfAdults\": 3,
    \"numOfChildren\": 0,
    \"transportType\": \"Xe o to\",
    \"acceptedTerms\": true,
    \"branchName\": \"Căn PG2-11\",
    \"selectedRoomName\": \"Phòng Deluxe PG2-11\",
    \"selectedDayLabel\": \"Thứ 5\",
    \"selectedSlotTime\": \"13h-17h\",
    \"selectedSlotPrice\": \"200k\"
  }")
echo "$RESPONSE4"
[[ $RESPONSE4 == *"Successfully"* ]] && echo "✅ PASSED" || echo "❌ FAILED"
echo ""

echo "========================================="
echo "VERIFICATION - Check UI Display"
echo "========================================="
echo ""
echo "Thứ 4 ($TOMORROW) should show:"
echo "  - 13h-17h: Đã Đặt ✓"
echo "  - 18h-22h: Đã Đặt ✓"
echo "  - 8h-12h: Còn Trống"
echo ""
echo "Thứ 5 ($DAY_AFTER) should show:"
echo "  - 13h-17h: Đã Đặt ✓"
echo "  - 8h-12h: Còn Trống"
echo "  - 18h-22h: Còn Trống"
echo ""
echo "Clean up: DELETE FROM booked_room WHERE guest_email LIKE 'fresh%@test.com';"
