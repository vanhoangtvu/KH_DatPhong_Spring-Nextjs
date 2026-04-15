# 📊 PHÂN TÍCH DỰ ÁN FIIN HOME - HỆ THỐNG ĐẶT PHÒNG KHÁCH SẠN

## 📑 MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Backend - Spring Boot](#3-backend---spring-boot)
4. [Frontend - Next.js](#4-frontend---nextjs)
5. [Database Schema](#5-database-schema)
6. [Luồng Nghiệp Vụ](#6-luồng-nghiệp-vụ)
7. [Security & Authentication](#7-security--authentication)
8. [WebSocket Real-time](#8-websocket-real-time)
9. [Điểm Mạnh & Hạn Chế](#9-điểm-mạnh--hạn-chế)
10. [Khuyến Nghị Cải Tiến](#10-khuyến-nghị-cải-tiến)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Thông Tin Cơ Bản

- **Tên dự án**: Fiin Home - Hotel Booking System
- **Mô hình**: Đặt phòng khách sạn theo giờ (hourly booking)
- **Mục tiêu**: Hệ thống đặt phòng với giao diện mobile-first, quản lý nhiều chi nhánh
- **Phiên bản**: 1.0.0
- **Ngày cập nhật**: 31/03/2026

### 1.2 Tech Stack

#### Backend
```
- Java 21
- Spring Boot 3.3.3
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0+
- WebSocket
- Maven
```

#### Frontend
```
- Next.js 16.2.1 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4
- Framer Motion (animations)
- Lucide React (icons)
```

### 1.3 Cấu Hình Môi Trường

#### Backend (application.yaml)
```yaml
server:
  port: 8082
  address: 0.0.0.0

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/hotel_booking_db
    username: root
    password: 1111
  jpa:
    hibernate:
      ddl-auto: update

jwt:
  secret: rRaAQAHZ4J0PN/fa6H8gTRYqr5n/eWa9ADqh8jwzBqY=
  expiration: 28800000  # 8 hours
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Homepage    │  │ Room Detail  │  │ Admin Panel  │      │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Next.js)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Spring Security + JWT Filter                  │   │
│  │  - CORS Configuration                                 │   │
│  │  - Authentication Filter                              │   │
│  │  - Authorization Rules                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   Auth   │ │   Room   │ │ Booking  │ │HomePage  │       │
│  │Controller│ │Controller│ │Controller│ │Controller│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │  Branch  │ │   User   │ │   Role   │                    │
│  │Controller│ │Controller│ │Controller│                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ BookedRoomService│  │ HomePageConfig   │                │
│  │   - Validation   │  │     Service      │                │
│  │   - Slot Check   │  │  - Data Builder  │                │
│  │   - Discount     │  │  - Dynamic Days  │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   RoomService    │  │  BranchService   │                │
│  │   UserService    │  │   RoleService    │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER (JPA)                     │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │BookedRoomRepo    │  │HomePageConfigRepo│                │
│  │RoomRepository    │  │BranchRepository  │                │
│  │UserRepository    │  │RoleRepository    │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│                    MySQL 8.0 Database                        │
│  Tables: users, roles, rooms, booked_rooms,                 │
│          branches, home_page_config                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Cấu Trúc Thư Mục

```
TT_DA22TTD_NguyenThanhThuong_Datphong/
├── be/                                 # Backend Spring Boot
│   ├── src/main/java/.../BLITCoding/
│   │   ├── config/                     # Configuration & Initializers
│   │   │   ├── AdminAccountInitializer.java
│   │   │   ├── BranchDataInitializer.java
│   │   │   ├── HomePageDataInitializer.java
│   │   │   └── RoomDataInitializer.java
│   │   ├── controller/                 # REST Controllers
│   │   │   ├── AuthController.java
│   │   │   ├── RoomController.java
│   │   │   ├── BookedRoomController.java
│   │   │   ├── HomePageController.java
│   │   │   ├── AdminHomePageController.java
│   │   │   ├── AdminRoomController.java
│   │   │   ├── BranchController.java
│   │   │   ├── UserController.java
│   │   │   └── RoleController.java
│   │   ├── model/                      # JPA Entities
│   │   │   ├── User.java
│   │   │   ├── Role.java
│   │   │   ├── Room.java
│   │   │   ├── BookedRoom.java
│   │   │   ├── Branch.java
│   │   │   └── HomePageConfig.java
│   │   ├── repository/                 # Data Access Layer
│   │   │   ├── UserRepository.java
│   │   │   ├── RoleRepository.java
│   │   │   ├── RoomRepository.java
│   │   │   ├── BookedRoomRepository.java
│   │   │   ├── BranchRepository.java
│   │   │   └── HomePageConfigRepository.java
│   │   ├── service/                    # Business Logic
│   │   │   ├── BookedRoomService.java
│   │   │   ├── BookedRoomServiceImpl.java (278 lines)
│   │   │   ├── HomePageConfigService.java
│   │   │   ├── HomePageConfigServiceImpl.java (625 lines)
│   │   │   ├── RoomService.java
│   │   │   ├── RoomServiceImpl.java
│   │   │   ├── BranchService.java
│   │   │   ├── BranchServiceImpl.java
│   │   │   ├── UserService.java
│   │   │   ├── UserServiceImpl.java
│   │   │   ├── RoleService.java
│   │   │   └── RoleServiceImpl.java
│   │   ├── security/                   # Security & JWT
│   │   │   ├── SecurityConfig.java
│   │   │   ├── CorsConfig.java
│   │   │   ├── jwt/
│   │   │   │   ├── JwtUtils.java
│   │   │   │   ├── AuthTokenFilter.java
│   │   │   │   └── JwtAuthEntrypoint.java
│   │   │   └── user/
│   │   │       ├── HotelUserDetails.java
│   │   │       └── HotelUserDetailsService.java
│   │   ├── websocket/                  # WebSocket Real-time
│   │   │   ├── WebSocketConfig.java
│   │   │   ├── RoomStateWebSocketHandler.java
│   │   │   ├── RoomStateWebSocketService.java
│   │   │   └── RoomStateUpdateMessage.java
│   │   ├── request/                    # Request DTOs
│   │   │   ├── LoginRequest.java
│   │   │   ├── AdminRoomRequest.java
│   │   │   └── BookingSettingsRequest.java
│   │   ├── response/                   # Response DTOs
│   │   │   ├── JwtResponse.java
│   │   │   ├── RoomResponse.java
│   │   │   ├── RoomDetailResponse.java
│   │   │   ├── AdminRoomResponse.java
│   │   │   ├── BookingResponse.java
│   │   │   ├── HomePageResponse.java
│   │   │   └── BookingSettingsResponse.java
│   │   ├── exception/                  # Custom Exceptions
│   │   │   ├── ResourceNotFoundException.java
│   │   │   ├── InvalidBookingException.java
│   │   │   ├── UserAlreadyExistsException.java
│   │   │   ├── RoleAlreadyExistException.java
│   │   │   ├── PhotoRetrievalException.java
│   │   │   └── InternalServerException.java
│   │   └── BlitCodingApplication.java  # Main Application
│   ├── src/main/resources/
│   │   └── application.yaml            # Application Config
│   ├── scripts/                        # SQL Scripts
│   │   ├── setup_database.sql
│   │   ├── create_branch_table.sql
│   │   ├── reset_for_testing.sql
│   │   └── init_sample_data.sql
│   └── pom.xml                         # Maven Dependencies
│
├── fe/                                 # Frontend Next.js
│   ├── src/
│   │   ├── app/                        # App Router Pages
│   │   │   ├── page.tsx                # Homepage (1218 lines)
│   │   │   ├── layout.tsx              # Root Layout
│   │   │   ├── admin/
│   │   │   │   └── page.tsx            # Admin Panel (2181 lines)
│   │   │   ├── room/[roomId]/
│   │   │   │   ├── page.tsx            # Room Detail Page
│   │   │   │   └── RoomDetailClient.tsx (870 lines)
│   │   │   ├── tra-cuu-booking/
│   │   │   │   ├── page.tsx
│   │   │   │   └── BookingLookupClient.tsx
│   │   │   └── dieu-khoan-dich-vu/
│   │   │       ├── page.tsx
│   │   │       └── DieuKhoanDichVuClient.tsx
│   │   ├── components/                 # Reusable Components
│   │   │   ├── RoomSwipeArea.tsx
│   │   │   ├── RoomSwipeShell.tsx
│   │   │   └── RoomDetailBookingPanel.tsx (450 lines)
│   │   └── lib/                        # Utilities
│   │       ├── useRoomStateSocket.ts   # WebSocket Hook
│   │       └── imageCompression.ts     # Image Utils
│   ├── public/                         # Static Assets
│   │   ├── logohome.jpg
│   │   └── LOGO FIIN.png
│   ├── next.config.ts                  # Next.js Config
│   ├── tailwind.config.ts              # Tailwind Config
│   ├── tsconfig.json                   # TypeScript Config
│   └── package.json                    # Dependencies
│
├── docs/                               # Documentation
│   ├── guides/
│   │   ├── HUONG_DAN_KHAC_PHUC_TRANG_CHU_TRONG.md
│   │   └── HUONG_DAN_TEST_DATA_INITIALIZERS.md
│   └── tests/
│       ├── BOOKING_LOGIC_IMPLEMENTATION.md
│       ├── TEST_BOOKING_LOGIC.md
│       └── TEST_RESULTS.md
│
├── start.sh                            # Start Script
├── stop.sh                             # Stop Script
├── README.md                           # Project README
├── DU_AN_CHI_TIET.md                  # Detailed Documentation
└── CHANGELOG.md                        # Change Log
```

### 2.3 Thống Kê Code

```
Tổng số files: 342
Lines of Code: ~10,000 LOC

Backend (Java):
- Controllers: 8 files
- Services: 12 files (903 LOC trong 2 service chính)
- Models: 6 entities
- Repositories: 6 interfaces
- Security: 5 files
- WebSocket: 4 files

Frontend (TypeScript/React):
- Pages: 5 main pages (4,462 LOC)
- Components: 3 major components (714 LOC)
- Utilities: 2 files (123 LOC)
```

---

## 3. BACKEND - SPRING BOOT

### 3.1 Dependencies (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Database -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Utilities -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.15.2</version>
    </dependency>
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
        <version>3.12.0</version>
    </dependency>
</dependencies>
```

### 3.2 Application Entry Point

```java
@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
public class BlitCodingApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlitCodingApplication.class, args);
    }
}
```

**Lưu ý**: Security được exclude ở annotation nhưng vẫn được cấu hình thủ công trong `SecurityConfig.java`.

---

*Tiếp tục ở phần 2...*
