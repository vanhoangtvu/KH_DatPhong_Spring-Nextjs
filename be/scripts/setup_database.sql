-- Complete Database Setup Script for Fiin Home Hotel Booking System
-- Run this script to initialize your database with sample data

-- ============================================
-- 1. Create Branch table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS branch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    address VARCHAR(500),
    phone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Insert Sample Branches
-- ============================================
INSERT INTO branch (name, description, address, phone, active) VALUES
('Căn PG2-11', 'Chi nhánh tại khu vực Vincom - Chill, riêng tư, dễ chọn', 'Căn PG2-11, khu Vincom', '1900 2026', TRUE),
('Hẻm Duy Khổng', 'Chi nhánh tại Hẻm Duy Khổng - Yên tĩnh, tiện nghi', 'Hẻm Duy Khổng', '1900 2027', TRUE)
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    address = VALUES(address),
    phone = VALUES(phone);

-- ============================================
-- 3. Update HomePage Config to Fiin Home
-- ============================================
UPDATE home_page_config 
SET 
    brand_name = 'Fiin Home',
    brand_subtitle = 'Đặt phòng khách sạn hiện đại',
    hero_title = 'Chọn phòng chill, đặt nhanh trên điện thoại.',
    hero_subtitle = 'Bố cục gọn, rõ, có thể vuốt qua để xem khu vực, phòng nổi bật và khung giờ.',
    intro_section_title = 'Trang giới thiệu',
    intro_section_description = 'Vuốt qua để xem các điểm nổi bật và cảm hứng lưu trú.'
WHERE config_key = 'landing-home-page';

-- If no config exists, insert default
INSERT INTO home_page_config (
    config_key, brand_name, brand_subtitle, hotline, hero_badge, hero_title, hero_subtitle,
    intro_section_title, intro_section_description, booking_section_title, booking_section_subtitle,
    footer_description, footer_tags_csv, footer_links_csv, footer_link_urls_csv, days_csv,
    accepting_bookings, booking_notice
) 
SELECT 
    'landing-home-page', 'Fiin Home', 'Đặt phòng khách sạn hiện đại', '1900 2026', 
    'Mọi lúc, mọi nơi', 'Chọn phòng chill, đặt nhanh trên điện thoại.',
    'Bố cục gọn, rõ, có thể vuốt qua để xem khu vực, phòng nổi bật và khung giờ.',
    'Trang giới thiệu', 'Vuốt qua để xem các điểm nổi bật và cảm hứng lưu trú.',
    'Chủ động thời gian', 'mọi lúc, mọi nơi',
    'Dịch vụ lưu trú hiện đại, thân thiện mobile, bố cục rõ ràng và dễ đặt phòng.',
    'Căn PG2-11 · khu Vincom|Hẻm Duy Khổng',
    'Facebook|TikTok|Bảng giá|Nội quy',
    'https://facebook.com|https://tiktok.com|/bang-gia|/noi-quy',
    'Hôm nay|Thứ 3|Thứ 4|Thứ 5',
    TRUE, 'Hiện tại hệ thống đang nhận đặt phòng bình thường.'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM home_page_config WHERE config_key = 'landing-home-page');

-- ============================================
-- 4. Sample Room Data (Optional - uncomment to add)
-- ============================================
-- Note: You should add rooms through the Admin Panel for better control
-- But here are some sample INSERT statements if you want to add them directly:

/*
INSERT INTO room (
    room_type, room_price, area_name, display_name, description,
    image_url, gallery_csv, video_url, show_on_home, home_order,
    features_csv, slot_times_csv, slot_prices_csv, slot_statuses_csv
) VALUES
(
    'Deluxe', 300000, 'Căn PG2-11', 'Phòng Deluxe PG2-11',
    'Phòng rộng rãi, đầy đủ tiện nghi, view đẹp',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800|https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    'https://www.youtube.com/watch?v=sample',
    TRUE, 1,
    'WiFi|TV|Điều hòa|Tủ lạnh|Máy nước nóng',
    '8h-12h|13h-17h|18h-22h',
    '200k|250k|300k',
    'Còn Trống|Còn Trống|Còn Trống'
),
(
    'Standard', 200000, 'Hẻm Duy Khổng', 'Phòng Standard Duy Khổng',
    'Phòng tiêu chuẩn, sạch sẽ, tiện nghi cơ bản',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    '',
    TRUE, 2,
    'WiFi|TV|Điều hòa',
    '8h-12h|13h-17h|18h-22h',
    '150k|180k|200k',
    'Còn Trống|Còn Trống|Còn Trống'
);
*/

-- ============================================
-- 5. Verify Setup
-- ============================================
SELECT 'Branches:' as Info, COUNT(*) as Count FROM branch;
SELECT 'Rooms:' as Info, COUNT(*) as Count FROM room;
SELECT 'Config:' as Info, brand_name FROM home_page_config WHERE config_key = 'landing-home-page';

-- ============================================
-- DONE! Next Steps:
-- ============================================
-- 1. Restart your Spring Boot backend
-- 2. Login to Admin Panel (http://localhost:3000/admin)
-- 3. Go to "Chi nhánh" tab to verify branches
-- 4. Go to "Quản lý phòng" tab to add rooms
-- 5. Mark some rooms as "Hiển thị ở Trang giới thiệu"
-- 6. Refresh homepage to see your data!
