-- Script to reset database for testing
-- This will delete all data and let the Java initializers recreate it

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all data
TRUNCATE TABLE booked_room;
TRUNCATE TABLE room;
TRUNCATE TABLE branch;
TRUNCATE TABLE home_page_config;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables are empty
SELECT 'Branches:' as Info, COUNT(*) as Count FROM branch;
SELECT 'Rooms:' as Info, COUNT(*) as Count FROM room;
SELECT 'Bookings:' as Info, COUNT(*) as Count FROM booked_room;
SELECT 'Config:' as Info, COUNT(*) as Count FROM home_page_config;

-- Now restart your Spring Boot backend to trigger the initializers
-- The initializers will create:
-- - 3 branches (Căn PG2-11, Hẻm Duy Khổng, Quận 7)
-- - 7 rooms (6 with show_on_home=true, 1 with show_on_home=false)
-- - 1 home page config with brand name "Fiin Home"
