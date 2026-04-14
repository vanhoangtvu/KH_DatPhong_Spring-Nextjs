# Tài Liệu Chi Tiết Dự Án

## 1. Tổng Quan

Dự án này là hệ thống đặt phòng khách sạn/tour nghỉ theo mô hình backend Spring Boot và frontend Next.js. Luồng chính của hệ thống là:

1. Người dùng mở trang chủ.
2. Frontend gọi dữ liệu cấu hình trang chủ, danh sách phòng, khu vực và khung giờ từ backend.
3. Người dùng chọn khu vực, ngày, phòng và khung giờ.
4. Frontend gửi booking về backend.
5. Backend kiểm tra điều kiện hợp lệ, chống đặt trùng slot, rồi lưu booking.
6. Khu admin dùng JWT để đăng nhập và quản lý phòng, booking, chi nhánh và cấu hình trang chủ.

Các phần lõi của dự án nằm ở:

- Backend controller: [AuthController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/AuthController.java), [RoomController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/RoomController.java), [BookedRoomController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/BookedRoomController.java), [HomePageController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/HomePageController.java)
- Backend service: [BookedRoomServiceImpl](be/src/main/java/com/hotelbookingproject/BLITCoding/service/BookedRoomServiceImpl.java), [HomePageConfigServiceImpl](be/src/main/java/com/hotelbookingproject/BLITCoding/service/HomePageConfigServiceImpl.java), [RoomServiceImpl](be/src/main/java/com/hotelbookingproject/BLITCoding/service/RoomServiceImpl.java)
- Backend security: [SecurityConfig](be/src/main/java/com/hotelbookingproject/BLITCoding/security/SecurityConfig.java), [JwtUtils](be/src/main/java/com/hotelbookingproject/BLITCoding/security/jwt/JwtUtils.java)
- Frontend pages: [page.tsx](fe/src/app/page.tsx), [room/[roomId]/page.tsx](fe/src/app/room/[roomId]/page.tsx), [room/[roomId]/RoomDetailClient.tsx](fe/src/app/room/[roomId]/RoomDetailClient.tsx), [admin/page.tsx](fe/src/app/admin/page.tsx)

## 2. Kiến Trúc Tổng Thể

### Backend

Backend sử dụng Spring Boot, JPA, MySQL, Spring Security và JWT. Dữ liệu quan trọng được chia thành các nhóm sau:

- User và Role: quản lý tài khoản và phân quyền.
- Room: mô tả phòng, giá, ảnh, mô tả, danh sách slot và trạng thái hiển thị.
- BookedRoom: lưu booking, thông tin khách, ngày nhận/trả, slot đã chọn và mã xác nhận.
- Branch: quản lý chi nhánh/khu vực.
- HomePageConfig: cấu hình nội dung trang chủ.

### Frontend

Frontend dùng Next.js App Router. Các trang chính gồm:

- Trang chủ: [page.tsx](fe/src/app/page.tsx)
- Trang chi tiết phòng: [room/[roomId]/page.tsx](fe/src/app/room/[roomId]/page.tsx)
- Trang admin: [admin/page.tsx](fe/src/app/admin/page.tsx)

Frontend gọi API qua `NEXT_PUBLIC_API_BASE_URL`; nếu không có biến môi trường thì mặc định là `http://localhost:8080`.

## 3. Backend Chi Tiết

### 3.1 Xác Thực Và Phân Quyền

`/auth` là nhóm API công khai:

- `POST /auth/register-user` để đăng ký tài khoản.
- `POST /auth/login` để đăng nhập và nhận JWT.

JWT được tạo trong [JwtUtils](be/src/main/java/com/hotelbookingproject/BLITCoding/security/jwt/JwtUtils.java) và được gắn vào `Authorization: Bearer <token>` khi frontend admin gọi API cần quyền.

Trong [SecurityConfig](be/src/main/java/com/hotelbookingproject/BLITCoding/security/SecurityConfig.java), các đường dẫn được mở công khai là:

- `/auth/**`
- `/rooms/**`
- `/bookings/**`
- `/api/public/**`

Các nhóm cần quyền admin là:

- `/api/admin/**`
- `/api/roles/**`

### 3.2 Phòng

Controller chính: [RoomController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/RoomController.java)

Các endpoint chính:

- `GET /rooms/room/types`: lấy danh sách loại phòng.
- `GET /rooms/all-rooms`: lấy toàn bộ phòng kèm ảnh base64.
- `GET /rooms/room/{roomId}`: lấy chi tiết 1 phòng.
- `GET /rooms/available-rooms?checkInDate&checkOutDate&roomType`: tìm phòng còn trống theo ngày và loại.
- `POST /rooms/add/new-room`: thêm phòng mới, yêu cầu admin.
- `PUT /rooms/update/{roomId}`: cập nhật phòng, yêu cầu admin.
- `DELETE /rooms/delete/room/{roomId}`: xóa phòng, yêu cầu admin.

Logic lấy dữ liệu phòng nằm trong [RoomServiceImpl](be/src/main/java/com/hotelbookingproject/BLITCoding/service/RoomServiceImpl.java):

- `addNewRoom(...)`: lưu ảnh vào `Blob` nếu có.
- `getAllRoomTypes()`: lấy type duy nhất từ repository.
- `getAllRooms()`: trả toàn bộ bản ghi phòng.
- `getRoomPhotoByRoomId(...)`: đọc ảnh từ `Blob`.
- `updateRoom(...)`: cập nhật type, giá và ảnh.
- `getAvailableRooms(...)`: tìm phòng trống theo ngày và loại.

### 3.3 Booking

Controller chính: [BookedRoomController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/BookedRoomController.java)

Các endpoint:

- `GET /bookings/all-bookings`: admin xem tất cả booking.
- `GET /bookings/confirmation/{confirmationCode}`: lấy booking theo mã xác nhận.
- `GET /bookings/user/{email}/bookings`: lấy booking theo email khách.
- `POST /bookings/room/{roomId}/booking`: tạo booking.
- `PUT /bookings/booking/{bookingId}/update`: admin cập nhật booking.
- `DELETE /bookings/booking/{bookingId}/delete`: admin xóa booking.

Logic quan trọng nằm trong [BookedRoomServiceImpl](be/src/main/java/com/hotelbookingproject/BLITCoding/service/BookedRoomServiceImpl.java):

- Kiểm tra hệ thống có đang nhận booking hay không.
- Bắt buộc người dùng đồng ý điều khoản.
- Kiểm tra `checkOutDate` phải sau `checkInDate`.
- Kiểm tra slot trùng theo đúng `roomId + checkInDate + selectedSlotTime` để tránh double-booking.
- Khi booking hợp lệ, hệ thống gọi `room.addBooking(bookingRequest)` và lưu `BookedRoom`.

### 3.4 Trang Chủ

Controller public: [HomePageController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/HomePageController.java)

Endpoint:

- `GET /api/public/home-page?dayLabel=`: trả toàn bộ dữ liệu landing page.
- `GET /api/public/rooms/{roomId}?date=`: trả chi tiết phòng + slot đã bị đặt ở ngày đó.

Controller admin: [AdminHomePageController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/AdminHomePageController.java)

Endpoint:

- `POST /api/admin/home-page/reset`: reset cấu hình mặc định.
- `PUT /api/admin/home-page/update`: cập nhật nội dung trang chủ.
- `GET /api/admin/home-page/booking-settings`: lấy trạng thái nhận booking.
- `PUT /api/admin/home-page/booking-settings`: bật/tắt nhận booking và sửa thông báo.

Phần ghép dữ liệu trang chủ được thực hiện trong [HomePageConfigServiceImpl](be/src/main/java/com/hotelbookingproject/BLITCoding/service/HomePageConfigServiceImpl.java):

- Lấy config singleton `landing-home-page`.
- Lọc phòng theo chi nhánh đang active.
- Tự sinh danh sách ngày hiển thị.
- Ghép dữ liệu khu vực, room lists, showcase rooms, intro cards và legend.
- Đánh dấu slot đã đặt theo ngày và room.

### 3.5 Chi Nhánh

Controller: [BranchController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/BranchController.java)

Endpoint:

- `GET /api/public/branches`: danh sách toàn bộ chi nhánh.
- `GET /api/public/branches/active`: danh sách chi nhánh đang active.
- `GET /api/admin/branches/{id}`: xem 1 chi nhánh.
- `POST /api/admin/branches`: tạo chi nhánh.
- `PUT /api/admin/branches/{id}`: cập nhật chi nhánh.
- `DELETE /api/admin/branches/{id}`: xóa chi nhánh và dữ liệu liên quan.
- `PATCH /api/admin/branches/{id}/toggle?active=`: bật/tắt trạng thái chi nhánh.

### 3.6 User Và Role

User controller: [UserController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/UserController.java)

- `GET /users/all`: lấy tất cả user.
- `GET /users/{email}`: lấy user theo email.
- `DELETE /users/delete/{email}`: xóa user.

Role controller: [RoleController](be/src/main/java/com/hotelbookingproject/BLITCoding/controller/RoleController.java)

- `GET /api/roles/all-roles`
- `POST /api/roles/create-new-role`
- `DELETE /api/roles/delete/{roleId}`
- `POST /api/roles/remove-all-users-from-role/{roleId}`
- `POST /api/roles/remove-user-from-role`
- `POST /api/roles/assign-user-to-role`

## 4. Data Model

### 4.1 Room

Entity: [Room](be/src/main/java/com/hotelbookingproject/BLITCoding/model/Room.java)

Phòng lưu các trường chính:

- `roomType`
- `roomPrice`
- `areaName`
- `displayName`
- `description`
- `imageUrl`
- `galleryCsv`
- `videoUrl`
- `showOnHome`
- `homeOrder`
- `featuresCsv`
- `slotTimesCsv`
- `slotPricesCsv`
- `slotStatusesCsv`
- `isBooked`

Điểm đáng chú ý là slot đang được lưu dưới dạng chuỗi phân tách bằng dấu `|`, không phải bảng slot riêng.

### 4.2 BookedRoom

Entity: [BookedRoom](be/src/main/java/com/hotelbookingproject/BLITCoding/model/BookedRoom.java)

Booking lưu:

- thông tin khách: tên, email, số điện thoại
- ngày check-in/check-out
- số người lớn, trẻ em, tổng khách
- mã xác nhận booking
- loại phương tiện
- ảnh CCCD/CMND dạng base64
- mã giảm giá, ghi chú
- đồng ý điều khoản
- tên chi nhánh
- tên phòng đã chọn
- day label
- slot time và slot price

### 4.3 HomePageConfig

Entity: [HomePageConfig](be/src/main/java/com/hotelbookingproject/BLITCoding/model/HomePageConfig.java)

Đây là cấu hình singleton cho landing page, gồm:

- brand name, subtitle
- hotline
- hero title/subtitle/badge
- nội dung intro section
- nội dung booking section
- footer description, tags, links, link URLs
- danh sách day labels
- trạng thái acceptingBookings
- bookingNotice

## 5. Frontend Chi Tiết

### 5.1 Trang Chủ

File: [page.tsx](fe/src/app/page.tsx)

Trang chủ làm các việc chính:

- Gọi `GET /api/public/home-page` để lấy dữ liệu hiển thị.
- Cho người dùng chọn khu vực và ngày.
- Hiển thị danh sách phòng theo khu vực.
- Hiển thị slot của từng phòng.
- Cho phép chọn slot và đặt phòng ngay trên trang.

Luồng booking từ trang chủ:

1. Người dùng chọn khu vực và ngày.
2. Frontend chuyển day label thành `checkInDate` và `checkOutDate`.
3. Frontend tạo payload booking.
4. Gửi `POST /bookings/room/{roomId}/booking`.
5. Nếu backend trả thành công, frontend làm mới dữ liệu home page.

### 5.2 Trang Chi Tiết Phòng

File: [room/[roomId]/page.tsx](fe/src/app/room/[roomId]/page.tsx)

Trang này:

- đọc `roomId` từ route
- gọi `GET /api/public/rooms/{roomId}?date=...`
- gọi thêm `GET /api/public/home-page` để có danh sách room phục vụ điều hướng qua lại
- render component con [RoomDetailClient](fe/src/app/room/[roomId]/RoomDetailClient.tsx)

Trong [RoomDetailClient](fe/src/app/room/[roomId]/RoomDetailClient.tsx), người dùng có thể:

- đổi ngày
- xem gallery, video và features của phòng
- chọn slot
- nhập thông tin booking
- upload ảnh mặt trước/mặt sau CMND/CCCD base64
- gửi booking về backend

### 5.3 Trang Admin

File: [admin/page.tsx](fe/src/app/admin/page.tsx)

Trang admin có các tab:

- tổng quan
- chi nhánh
- quản lý phòng
- đặt phòng
- cài đặt

Luồng admin:

1. Đăng nhập bằng `/auth/login`.
2. Lưu JWT vào localStorage.
3. Gọi các API admin với header `Authorization: Bearer <token>`.
4. Quản lý room, branch, booking và home-page settings.

## 6. Seed Data Và Khởi Tạo

Khi ứng dụng khởi động, có các initializer sẵn:

- [AdminAccountInitializer](be/src/main/java/com/hotelbookingproject/BLITCoding/config/AdminAccountInitializer.java): tạo sẵn admin `admin@hotel.com` với mật khẩu `Admin@123` nếu chưa có.
- [BranchDataInitializer](be/src/main/java/com/hotelbookingproject/BLITCoding/config/BranchDataInitializer.java): tạo chi nhánh mẫu và một số phòng mẫu.
- [HomePageDataInitializer](be/src/main/java/com/hotelbookingproject/BLITCoding/config/HomePageDataInitializer.java): tạo cấu hình landing page mặc định.

## 7. Business Logic Quan Trọng

1. Booking chỉ được tạo nếu điều khoản đã được đồng ý.
2. Booking bị chặn nếu hệ thống đang tắt nhận booking.
3. Slot bị kiểm tra trùng theo đúng phòng + ngày + giờ.
4. Trang chủ không dựng dữ liệu tĩnh mà luôn ghép từ config, room và booking hiện tại.
5. Chi nhánh inactive sẽ không được đưa vào dữ liệu hiển thị trang chủ.
6. Phần slot và gallery đang dùng chuỗi phân tách `|`, nên thay đổi cấu trúc dữ liệu cần cẩn thận.

## 8. Điểm Mạnh Và Điểm Cần Cân Nhắc

### Điểm mạnh

- Luồng đặt phòng khá rõ.
- Có phân quyền JWT cho phần admin.
- Trang chủ và room detail đều lấy dữ liệu động từ backend.
- Có cơ chế chống đặt trùng slot.

### Điểm cần cân nhắc

- Slot lưu bằng CSV nên khó mở rộng lâu dài.
- Ảnh ID card và ảnh phòng đang dùng base64, payload có thể lớn.
- Một số quy ước role trong code có thể chưa thật đồng nhất.
- Việc map day label giữa UI và backend cần giữ đồng bộ.

## 9. Cách Chạy Nhanh

- Backend: vào thư mục `be`, chạy Maven theo cấu hình hiện có.
- Frontend: vào thư mục `fe`, chạy `npm install` rồi `npm run dev`.
- Frontend mặc định chạy ở cổng `3002` theo script trong [package.json](fe/package.json).

## 10. Kết Luận

Dự án là một hệ thống đặt phòng có đủ ba lớp chính: hiển thị trang chủ, xem chi tiết phòng và quản trị nội dung/booking. Logic quan trọng nhất nằm ở backend booking và home-page service, còn frontend tập trung vào trải nghiệm chọn khu vực, ngày và khung giờ trên mobile.

Nếu cần mở rộng tài liệu, có thể tách tiếp thành các file riêng cho:

- mô tả API chi tiết từng endpoint
- sơ đồ dữ liệu database
- hướng dẫn triển khai local/docker
- phân tích luồng đặt phòng từ UI đến DB