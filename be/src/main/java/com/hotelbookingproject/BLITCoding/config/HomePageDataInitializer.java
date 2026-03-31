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
        config.setHeroBadge("Mọi lúc, mọi nơi");
        config.setHeroTitle("Chọn phòng chill, đặt nhanh trên điện thoại.");
        config.setHeroSubtitle("Bố cục gọn, rõ, có thể vuốt qua để xem khu vực, phòng nổi bật và khung giờ.");
        config.setIntroSectionTitle("Trang giới thiệu");
        config.setIntroSectionDescription("Vuốt qua để xem các điểm nổi bật và cảm hứng lưu trú.");
        config.setBookingSectionTitle("Chủ động thời gian");
        config.setBookingSectionSubtitle("mọi lúc, mọi nơi");
        config.setFooterDescription("Dịch vụ lưu trú hiện đại, thân thiện mobile, bố cục rõ ràng và dễ đặt phòng.");
        config.setFooterTagsCsv("Căn PG2-11 · khu Vincom|Hẻm Duy Khổng");
        config.setFooterLinksCsv("Facebook|TikTok|Bảng giá|Nội quy");
        config.setFooterLinkUrlsCsv("https://facebook.com|https://tiktok.com|/bang-gia|/noi-quy");
        config.setDaysCsv("Hôm nay|Thứ 3|Thứ 4|Thứ 5");
        config.setAcceptingBookings(true);
        config.setBookingNotice("Hiện tại hệ thống đang nhận đặt phòng bình thường.");
        return config;
    }
}
