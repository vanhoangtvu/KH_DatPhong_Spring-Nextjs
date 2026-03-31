-- Script to create Branch table
-- Run this SQL script in your MySQL database

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

-- Optional: Insert some sample branches
-- Uncomment the lines below if you want to add sample data

-- INSERT INTO branch (name, description, address, phone, active) VALUES
-- ('Chi nhánh Vincom', 'Chi nhánh tại khu vực Vincom', 'Căn PG2-11, khu Vincom', '1900 2026', TRUE),
-- ('Chi nhánh Hẻm Duy Khổng', 'Chi nhánh tại Hẻm Duy Khổng', 'Hẻm Duy Khổng', '1900 2027', TRUE);
