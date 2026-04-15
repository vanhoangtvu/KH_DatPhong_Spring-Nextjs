    111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111`# Changelog

## [1.0.0] - 2026-03-31

### ✨ Features Added

#### Hourly Room Booking System
- Implemented proper booking logic: 1 room + 1 date + 1 time slot = 1 inventory unit
- Added `isTimeSlotAvailable()` method to check availability by date AND time slot
- Prevent double-booking for same room + date + time slot combination
- Allow multiple bookings for same room on same day with different time slots
- Allow multiple bookings for same room with same time slot on different dates

#### Dynamic Day Selector
- Added `calculateDateFromDayLabel()` to convert day labels to actual dates
- Generate dynamic day labels based on current date ("Hôm nay", "Thứ 2", "Thứ 3"...)
- Filter bookings by actual `checkInDate` instead of string `selectedDayLabel`
- Real-time availability display updates when changing days

#### Mobile Optimization
- Fixed day selector scroll behavior on mobile
- Added proper spacing for arrow buttons
- Implemented gradient backgrounds for fixed arrows
- Responsive design with separate layouts for mobile and desktop

### 🐛 Bug Fixes

#### Backend
- Fixed booking availability check to use both date and time slot
- Fixed day label to date conversion logic
- Removed incorrect `roomIsAvailable()` method that only checked date overlap
- Removed `updateBookedSlotStatus()` that incorrectly updated Room entity
- Cleaned up unused imports (Arrays, Collectors, RoomRepository, @Autowired)

#### Frontend
- Fixed day selector showing duplicate day labels
- Fixed scroll container not reaching arrow buttons on mobile
- Fixed slots showing "Đã Đặt" for all days when only one day was booked
- Fixed loading screen appearing every time day changes

### 📁 Project Organization

#### New Structure
```
.
├── docs/
│   ├── guides/              # User guides
│   │   ├── HUONG_DAN_KHAC_PHUC_TRANG_CHU_TRONG.md
│   │   └── HUONG_DAN_TEST_DATA_INITIALIZERS.md
│   └── tests/               # Test documentation
│       ├── BOOKING_LOGIC_IMPLEMENTATION.md
│       ├── TEST_BOOKING_LOGIC.md
│       └── TEST_RESULTS.md
├── README.md                # Comprehensive project documentation
└── .gitignore              # Git ignore rules
```

#### Removed Files
- ❌ Empty markdown files (HUONG_DAN_IMPORT.md, KET_QUA_SETUP.md, SETUP_GUIDE.md)
- ❌ Temporary test scripts (test-booking.sh, test-booking-correct.sh, clean-and-test.sh)
- ❌ Temporary fix files (day-selector-fix.txt, day-selector-fix-v2.txt)

### 📝 Documentation

#### Added
- Comprehensive README.md with quick start guide
- Booking logic implementation documentation
- Test plan with 6 detailed test cases
- Troubleshooting guides
- Project structure overview

#### Updated
- Organized all documentation into docs/ folder
- Added clear navigation between documents
- Added code examples and API documentation

### 🧪 Testing

#### Test Coverage
- ✅ TC1: Book available time slot (should succeed)
- ✅ TC2: Book already booked slot (should fail)
- ✅ TC3: Book same day, different time slot (should succeed)
- ✅ TC4: Book different day, same time slot (should succeed)
- ✅ TC5: UI displays correct booked slots for selected day
- ✅ TC6: UI updates correctly when changing days

### 🔧 Technical Improvements

#### Backend
- Better separation of concerns (booking logic vs display logic)
- More accurate error messages in Vietnamese
- Cleaner code with removed unused methods
- Proper date handling with LocalDate

#### Frontend
- Better responsive design with mobile-first approach
- Smoother user experience with optimized loading states
- Cleaner component structure

### 📊 Code Statistics

- Files changed: 16
- Insertions: 233
- Deletions: 535
- Net reduction: 302 lines (cleaner codebase!)

### 🚀 Deployment

- Successfully pushed to GitHub: `main` branch
- Commit hash: `0e525e1`
- All changes tested and verified

---

## Future Improvements

### Planned Features
- [ ] Add soft hold mechanism (Redis cache with TTL)
- [ ] Implement optimistic locking with @Version
- [ ] Add database unique constraint for (room_id, check_in_date, slot_time)
- [ ] Implement transaction isolation level (SERIALIZABLE)
- [ ] Add booking confirmation emails
- [ ] Add payment integration

### Known Limitations
- No soft hold during checkout process
- No optimistic locking (race condition possible)
- Default transaction isolation level (READ_COMMITTED)

---

**Version:** 1.0.0  
**Release Date:** March 31, 2026  
**Contributors:** Development Team
