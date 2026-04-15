# PHÂN TÍCH DỰ ÁN - PHẦN 2: DATABASE & MODELS

## 5. DATABASE SCHEMA

### 5.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────┐         ┌─────────────────────┐
│       User          │         │       Role          │
├─────────────────────┤         ├─────────────────────┤
│ id (PK)             │◄───────►│ id (PK)             │
│ firstName           │  M:N    │ name                │
│ lastName            │         │ users (Collection)  │
│ email (unique)      │         └─────────────────────┘
│ password            │
│ roles (Collection)  │
└─────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│       Branch        │         │       Room          │
├─────────────────────┤         ├─────────────────────┤
│ id (PK)             │         │ id (PK)             │
│ name (unique)       │         │ roomType            │
│ address             │         │ roomPrice           │
│ description         │         │ areaName            │
│ imageUrl            │         │ displayName         │
│ active              │         │ description         │
│ displayOrder        │         │ imageUrl            │
└─────────────────────┘         │ galleryCsv          │
                                │ videoUrl            │
                                │ showOnHome          │
                                │ homeOrder           │
                                │ featuresCsv         │
                                │ slotTimesCsv        │
                                │ slotPricesCsv       │
                                │ slotStatusesCsv     │
                                │ isBooked            │
                                │ photo (Blob)        │
                                └─────────────────────┘
                                         │
                                         │ 1:N
                                         ▼
                                ┌─────────────────────┐
                                │    BookedRoom       │
                                ├─────────────────────┤
                                │ bookingId (PK)      │
                                │ room_id (FK)        │
                                │ checkInDate         │
                                │ checkOutDate        │
                                │ guestName           │
                                │ guestEmail          │
                                │ guestPhone          │
                                │ receiveBookingEmail │
                                │ numOfAdults         │
                                │ numOfChildren       │
                                │ totalNumOfGuests    │
                                │ confirmationCode    │
                                │ transportType       │
                                │ idCardFrontImage    │
                                │ idCardBackImage     │
                                │ discountCode        │
                                │ note                │
                                │ acceptedTerms       │
                                │ branchName          │
                                │ selectedRoomName    │
                                │ selectedDayLabel    │
                                │ selectedSlotTime    │
                                │ selectedSlotPrice   │
                                │ bookingStatus       │
                                └─────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              HomePageConfig (Singleton)                 │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ configKey (unique) = "landing-home-page"                │
│ brandName, brandSubtitle, hotline                       │
│ heroBadge, heroTitle, heroSubtitle                      │
│ introSectionTitle, introSectionDescription              │
│ bookingSectionTitle, bookingSectionSubtitle             │
│ footerDescription, footerTagsCsv, footerLinksCsv        │
│ footerLinkUrlsCsv, daysCsv                              │
│ discountCode, discountPercent                           │
│ termsPageTitle, termsPageSubtitle, termsPageIntro       │
│ termsSectionTitle, termsSectionContent                  │
│ servicesSectionTitle, servicesSectionContent            │
│ termsPageNote                                           │
│ acceptingBookings (boolean)                             │
│ bookingNotice                                           │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Chi Tiết Các Entity

#### 5.2.1 User Entity

```java
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String firstName;
    private String lastName;
    
    @Column(unique = true)
    private String email;
    
    private String password;
    
    @ManyToMany(fetch = FetchType.EAGER, 
                cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.DETACH})
    @JoinTable(name = "user_roles",
               joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"),
               inverseJoinColumns = @JoinColumn(name = "role_id", referencedColumnName = "id"))
    private Collection<Role> roles = new HashSet<>();
}
```

**Đặc điểm**:
- Email là unique identifier
- Password được mã hóa bằng BCrypt
- Quan hệ Many-to-Many với Role
- Fetch EAGER để load roles cùng user

#### 5.2.2 Role Entity

```java
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String name;
    
    @ManyToMany(mappedBy = "roles")
    private Collection<User> users = new HashSet<>();
    
    // Business methods
    public void assignRoleToUser(User user) { ... }
    public void removeUserFromRole(User user) { ... }
    public void removeAllUsersFromRole() { ... }
    public String getName() { return name != null ? name : ""; }
}
```

**Đặc điểm**:
- Role name là unique (ví dụ: "ROLE_ADMIN", "ROLE_USER")
- Có các method tiện ích để quản lý user-role relationship

#### 5.2.3 Room Entity

```java
@Entity
@Getter @Setter
@AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Basic info
    private String roomType;
    private BigDecimal roomPrice;
    private String areaName;
    private String displayName;
    
    @Column(columnDefinition = "LONGTEXT")
    private String description;
    
    // Media
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;
    
    @Column(columnDefinition = "LONGTEXT")
    private String galleryCsv;  // Pipe-separated: "url1|url2|url3"
    
    @Column(columnDefinition = "LONGTEXT")
    private String videoUrl;
    
    @Lob
    private Blob photo;  // Legacy field
    
    // Display settings
    private boolean showOnHome = false;
    private Integer homeOrder;
    
    // Features
    @Column(columnDefinition = "LONGTEXT")
    private String featuresCsv;  // Pipe-separated: "WiFi|TV|AC"
    
    // Slots (CSV format)
    @Column(columnDefinition = "LONGTEXT")
    private String slotTimesCsv;    // "14h-16h|16h-18h|18h-20h"
    
    @Column(columnDefinition = "LONGTEXT")
    private String slotPricesCsv;   // "200k|250k|300k"
    
    @Column(columnDefinition = "LONGTEXT")
    private String slotStatusesCsv; // "available|available|booked"
    
    // Booking status
    private boolean isBooked = false;
    
    // Relationships
    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<BookedRoom> bookings;
    
    public void addBooking(BookedRoom booking) {
        if(bookings == null) bookings = new ArrayList<>();
        this.bookings.add(booking);
        booking.setRoom(this);
        isBooked = true;
        String bookingCode = RandomStringUtils.randomAlphanumeric(10);
        booking.setBookingConfirmationCode(bookingCode);
    }
}
```

**Đặc điểm quan trọng**:
- **Slot data được lưu dạng CSV** (pipe-separated): đây là điểm cần cải tiến
- `isBooked` chỉ là flag đơn giản, không phản ánh chính xác trạng thái slot
- Gallery, features, slots đều dùng LONGTEXT để lưu CSV
- Có cả `photo` (Blob) và `imageUrl` (String) - legacy design

#### 5.2.4 BookedRoom Entity

```java
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class BookedRoom {
    
    public static final String DEFAULT_BOOKING_STATUS = "Đã đặt";
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;
    
    // Dates
    @Column(name = "ckeck_In")
    private LocalDate checkInDate;
    
    @Column(name = "ckeck_out")
    private LocalDate checkOutDate;
    
    // Guest info
    @Column(name = "guest_FullName")
    private String guestName;
    
    @Column(name = "guest_Email")
    private String guestEmail;
    
    @Column(name = "guest_phone")
    private String guestPhone;
    
    @Column(name = "receive_booking_email")
    private boolean receiveBookingEmail;
    
    // Guest count
    @Column(name = "adults")
    private int numOfAdults;
    
    @Column(name = "children")
    private int numOfChildren;
    
    @Column(name = "total_guest")
    private int totalNumOfGuests;
    
    // Booking details
    @Column(name = "confirmation_code")
    private String bookingConfirmationCode;
    
    @Column(name = "transport_type")
    private String transportType;  // "Xe may" | "Xe o to"
    
    // ID Card images (Base64)
    @Column(name = "id_card_front", columnDefinition = "LONGTEXT")
    private String idCardFrontImage;
    
    @Column(name = "id_card_back", columnDefinition = "LONGTEXT")
    private String idCardBackImage;
    
    // Discount & notes
    @Column(name = "discount_code")
    private String discountCode;
    
    @Column(name = "note_text", columnDefinition = "LONGTEXT")
    private String note;
    
    @Column(name = "accepted_terms")
    private boolean acceptedTerms;
    
    // Selected details
    @Column(name = "branch_name")
    private String branchName;
    
    @Column(name = "selected_room_name")
    private String selectedRoomName;
    
    @Column(name = "selected_day_label")
    private String selectedDayLabel;  // "Hôm nay", "Ngày mai", etc.
    
    @Column(name = "selected_slot_time")
    private String selectedSlotTime;  // "14h-16h"
    
    @Column(name = "selected_slot_price")
    private String selectedSlotPrice; // "200k"
    
    @Column(name = "booking_status")
    private String bookingStatus = DEFAULT_BOOKING_STATUS;
    
    // Relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;
    
    // Business methods
    public void calculateTotalNumberOfGuests() {
        this.totalNumOfGuests = this.numOfAdults + this.numOfChildren;
    }
    
    public void setNumOfChildren(int numOfChildren) {
        this.numOfChildren = numOfChildren;
        calculateTotalNumberOfGuests();
    }
    
    public void setNumOfAdults(int numOfAdults) {
        this.numOfAdults = numOfAdults;
        calculateTotalNumberOfGuests();
    }
}
```

**Đặc điểm quan trọng**:
- Lưu **cả thông tin slot đã chọn** (time, price) để tránh mất dữ liệu khi room thay đổi
- ID card images lưu dạng **Base64 trong LONGTEXT** - có thể gây vấn đề performance
- `acceptedTerms` bắt buộc phải true mới tạo được booking
- `bookingStatus` dùng để phân biệt booking active/completed/cancelled

#### 5.2.5 Branch Entity

```java
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name;
    
    @Column(columnDefinition = "LONGTEXT")
    private String address;
    
    @Column(columnDefinition = "LONGTEXT")
    private String description;
    
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;
    
    @Column(nullable = false)
    private boolean active = true;
    
    private Integer displayOrder;
}
```

**Đặc điểm**:
- Branch name là unique
- `active` flag để bật/tắt chi nhánh
- Không có relationship trực tiếp với Room (chỉ dùng `areaName` string)

#### 5.2.6 HomePageConfig Entity

```java
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class HomePageConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String configKey;  // Always "landing-home-page"
    
    // Brand info
    @Column(nullable = false)
    private String brandName;
    
    @Column(nullable = false)
    private String brandSubtitle;
    
    @Column(nullable = false)
    private String hotline;
    
    // Hero section
    @Column(nullable = false)
    private String heroBadge;
    
    @Column(nullable = false)
    private String heroTitle;
    
    @Column(nullable = false)
    private String heroSubtitle;
    
    // Intro section
    @Column(nullable = false)
    private String introSectionTitle;
    
    @Column(nullable = false)
    private String introSectionDescription;
    
    // Booking section
    @Column(nullable = false)
    private String bookingSectionTitle;
    
    @Column(nullable = false)
    private String bookingSectionSubtitle;
    
    // Footer
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerDescription;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerTagsCsv;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerLinksCsv;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerLinkUrlsCsv;
    
    // Days configuration
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String daysCsv;  // "Hôm nay|Ngày mai|..."
    
    // Discount
    @Column(nullable = false)
    private String discountCode;
    
    @Column(nullable = false)
    private Integer discountPercent;
    
    // Terms page
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String termsPageTitle;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String termsPageSubtitle;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String termsPageIntro;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String termsSectionTitle;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String termsSectionContent;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String servicesSectionTitle;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String servicesSectionContent;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String termsPageNote;
    
    // Booking control
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean acceptingBookings = true;
    
    @Column(columnDefinition = "LONGTEXT")
    private String bookingNotice;
}
```

**Đặc điểm**:
- **Singleton pattern**: chỉ có 1 record với `configKey = "landing-home-page"`
- Chứa toàn bộ nội dung trang chủ
- `acceptingBookings` để bật/tắt chức năng đặt phòng toàn hệ thống
- Nhiều field dùng CSV format (footerTags, footerLinks, days)

### 5.3 Repositories

#### 5.3.1 UserRepository

```java
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    void deleteByEmail(String email);
    Optional<User> findByEmail(String email);
}
```

#### 5.3.2 RoleRepository

```java
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    boolean existsByName(String name);
}
```

#### 5.3.3 RoomRepository

```java
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<String> findDistinctRoomTypes();
    
    @Query("SELECT r FROM Room r WHERE r.areaName = :areaName")
    List<Room> findByAreaName(@Param("areaName") String areaName);
    
    @Query("SELECT r FROM Room r " +
           "WHERE r.id NOT IN (" +
           "  SELECT br.room.id FROM BookedRoom br " +
           "  WHERE ((br.checkInDate <= :checkOutDate) AND (br.checkOutDate >= :checkInDate))" +
           ") AND r.roomType LIKE %:roomType%")
    List<Room> findAvailableRoomsByDateAndType(
        LocalDate checkInDate, 
        LocalDate checkOutDate, 
        String roomType
    );
}
```

**Lưu ý**: Query `findAvailableRoomsByDateAndType` không xét đến slot cụ thể, chỉ xét date range.

#### 5.3.4 BookedRoomRepository

```java
public interface BookedRoomRepository extends JpaRepository<BookedRoom, Long> {
    Optional<BookedRoom> findByBookingId(Long bookingId);
    BookedRoom findByBookingConfirmationCode(String confirmationCode);
    List<BookedRoom> findByGuestEmail(String email);
    List<BookedRoom> findByRoomId(Long roomId);
}
```

#### 5.3.5 BranchRepository

```java
public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByName(String name);
    boolean existsByName(String name);
}
```

#### 5.3.6 HomePageConfigRepository

```java
public interface HomePageConfigRepository extends JpaRepository<HomePageConfig, Long> {
    Optional<HomePageConfig> findByConfigKey(String configKey);
}
```

---

*Tiếp tục ở phần 3...*
