# 🏨 Fiin Home - Hotel Booking System

Hệ thống đặt phòng khách sạn theo giờ với giao diện hiện đại, tối ưu cho mobile.

## 📋 Tính năng

- ✅ Đặt phòng theo khung giờ (hourly booking)
- ✅ Quản lý nhiều chi nhánh
- ✅ Giao diện responsive, tối ưu mobile
- ✅ Hiển thị real-time availability
- ✅ Hệ thống xác thực và phân quyền
- ✅ Admin dashboard

## 🛠️ Tech Stack

### Backend
- Java 21
- Spring Boot 3.x
- Spring Security + JWT
- MySQL Database
- Maven

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

### Backend Setup

```bash
cd be

# Configure database in application.yaml
# Update: spring.datasource.url, username, password

# Run backend
./mvnw spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

### Frontend Setup

```bash
cd fe

# Install dependencies
npm install

# Configure API URL in .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080" > .env.local

# Run frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📁 Project Structure

```
.
├── be/                          # Backend (Spring Boot)
│   ├── src/main/java/
│   │   └── com/hotelbookingproject/BLITCoding/
│   │       ├── config/          # Configuration & Initializers
│   │       ├── controller/      # REST Controllers
│   │       ├── model/           # JPA Entities
│   │       ├── repository/      # Data Access Layer
│   │       ├── service/         # Business Logic
│   │       ├── security/        # Security & JWT
│   │       ├── request/         # Request DTOs
│   │       ├── response/        # Response DTOs
│   │       └── exception/       # Custom Exceptions
│   ├── src/main/resources/
│   │   └── application.yaml     # Application Config
│   └── scripts/                 # SQL Scripts
│
├── fe/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                 # App Router Pages
│   │   │   ├── page.tsx         # Homepage
│   │   │   ├── admin/           # Admin Pages
│   │   │   └── room/[roomId]/   # Room Detail
│   │   └── components/          # Reusable Components
│   └── public/                  # Static Assets
│
└── docs/                        # Documentation
    ├── guides/                  # User Guides
    └── tests/                   # Test Documentation
```

## 🔑 Default Credentials

### Admin Account
- Email: `admin@fiinhome.com`
- Password: `admin123`

## 📖 Documentation

- [Hướng dẫn khắc phục trang chủ trống](docs/guides/HUONG_DAN_KHAC_PHUC_TRANG_CHU_TRONG.md)
- [Hướng dẫn test Data Initializers](docs/guides/HUONG_DAN_TEST_DATA_INITIALIZERS.md)
- [Booking Logic Implementation](docs/tests/BOOKING_LOGIC_IMPLEMENTATION.md)
- [Test Plan](docs/tests/TEST_BOOKING_LOGIC.md)

## 🧪 Testing

Hệ thống đã được test đầy đủ với các scenarios:
- ✅ Đặt phòng cùng ngày, khác time slot
- ✅ Đặt phòng khác ngày, cùng time slot
- ✅ Ngăn chặn double-booking
- ✅ Real-time availability display

Chi tiết xem trong [docs/tests/](docs/tests/)

## 🎨 Features Highlight

### Hourly Booking System
- Mỗi phòng có thể đặt nhiều lần trong ngày với các time slot khác nhau
- Kiểm tra availability chính xác theo ngày + giờ
- Hiển thị real-time trạng thái "Đã Đặt" / "Còn Trống"

### Mobile-First Design
- Giao diện tối ưu cho mobile
- Swipe gestures cho navigation
- Responsive day selector với scroll mượt mà

### Admin Dashboard
- Quản lý phòng, chi nhánh
- Xem danh sách bookings
- Bật/tắt chế độ nhận đặt phòng

## 🔧 Configuration

### Backend (application.yaml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/hotel_booking
    username: your_username
    password: your_password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## 🐛 Troubleshooting

### Backend không khởi động
- Kiểm tra MySQL đang chạy
- Kiểm tra credentials trong `application.yaml`
- Kiểm tra port 8080 chưa bị chiếm

### Frontend không kết nối được backend
- Kiểm tra `NEXT_PUBLIC_API_BASE_URL` trong `.env.local`
- Kiểm tra CORS configuration trong backend
- Kiểm tra backend đang chạy tại port 8080

### Trang chủ trống
- Xem hướng dẫn: [docs/guides/HUONG_DAN_KHAC_PHUC_TRANG_CHU_TRONG.md](docs/guides/HUONG_DAN_KHAC_PHUC_TRANG_CHU_TRONG.md)

## 📝 License

This project is for educational purposes.

## 👥 Contributors

- Development Team

---

**Version:** 1.0.0  
**Last Updated:** March 31, 2026
