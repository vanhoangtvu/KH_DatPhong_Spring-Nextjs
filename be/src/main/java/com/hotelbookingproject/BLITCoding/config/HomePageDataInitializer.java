package com.hotelbookingproject.BLITCoding.config;

import com.hotelbookingproject.BLITCoding.model.HomePageConfig;
import com.hotelbookingproject.BLITCoding.repository.HomePageConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
public class HomePageDataInitializer implements CommandLineRunner {

    private static final String CONFIG_KEY = "landing-home-page";

    private final HomePageConfigRepository homePageConfigRepository;

    @Override
    public void run(String... args) throws Exception {
        if (homePageConfigRepository.findByConfigKey(CONFIG_KEY).isPresent()) {
            return;
        }

        homePageConfigRepository.save(buildDefaultConfig());
    }

    private HomePageConfig buildDefaultConfig() {
        HomePageConfig config = new HomePageConfig();
        config.setConfigKey(CONFIG_KEY);
        config.setBrandName("Fiin Home");
        config.setBrandSubtitle("Đặt phòng khách sạn hiện đại");
        config.setHotline("1900 2026");
        config.setHeroBadge("Đặt phòng nhanh");
        config.setHeroTitle("Đặt phòng nhanh trên điện thoại");
        config.setHeroSubtitle("Giao diện rõ ràng, chọn khu vực, phòng và khung giờ trong vài thao tác.");
        config.setIntroSectionTitle("Trang giới thiệu");
        config.setIntroSectionDescription("Vuốt để xem các khu vực và phòng nổi bật.");
        config.setBookingSectionTitle("Chủ động thời gian");
        config.setBookingSectionSubtitle("Lịch trống cập nhật theo thời gian thực.");
        config.setFooterDescription("Dịch vụ lưu trú hiện đại, thân thiện mobile, bố cục rõ ràng và dễ đặt phòng.");
        config.setDiscountCode("FIIN10");
        config.setDiscountPercent(10);
        config.setTermsPageTitle("Điều khoản và dịch vụ");
        config.setTermsPageSubtitle("Thông tin sử dụng và phạm vi dịch vụ của hệ thống");
        config.setTermsPageIntro("Trang này giúp khách hiểu rõ cách đặt phòng, trách nhiệm của khách hàng và các dịch vụ hỗ trợ.");
        config.setTermsSectionTitle("Điều khoản sử dụng");
        config.setTermsSectionContent("Khách hàng cần cung cấp thông tin chính xác khi đặt phòng, tuân thủ thời gian nhận phòng và thanh toán theo xác nhận hiển thị trên hệ thống. Fiin Home có quyền từ chối hoặc hủy giao dịch nếu phát hiện thông tin không hợp lệ, gian lận hoặc vi phạm nội quy.");
        config.setServicesSectionTitle("Dịch vụ cung cấp");
        config.setServicesSectionContent("Hệ thống hỗ trợ tra cứu phòng trống, đặt phòng theo khung giờ, lưu thông tin booking và quản lý lịch sử đặt phòng. Các dịch vụ bổ sung có thể được cập nhật theo từng thời điểm và hiển thị trực tiếp trên website.");
        config.setTermsPageNote("Nếu cần hỗ trợ thêm, vui lòng liên hệ hotline hoặc gửi yêu cầu qua các kênh liên hệ ở footer.");
        config.setFooterTagsCsv("Căn PG2-11 · khu Vincom|Hẻm Duy Khổng");
        config.setFooterLinksCsv("Facebook|TikTok|Bảng giá|Nội quy|Điều khoản & dịch vụ");
        config.setFooterLinkUrlsCsv("https://facebook.com|https://tiktok.com|/bang-gia|/noi-quy|/dieu-khoan-dich-vu");
        config.setDaysCsv("Hôm nay|Thứ 3|Thứ 4|Thứ 5");
        config.setAcceptingBookings(true);
        config.setBookingNotice("Hiện tại hệ thống đang nhận đặt phòng bình thường.");
        return config;
    }
}
