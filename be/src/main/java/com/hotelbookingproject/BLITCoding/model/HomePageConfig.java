package com.hotelbookingproject.BLITCoding.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HomePageConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String configKey;

    @Column(nullable = false)
    private String brandName;

    @Column(nullable = false)
    private String brandSubtitle;

    @Column(nullable = false)
    private String hotline;

    @Column(nullable = false)
    private String heroBadge;

    @Column(nullable = false)
    private String heroTitle;

    @Column(nullable = false)
    private String heroSubtitle;

    @Column(nullable = false)
    private String introSectionTitle;

    @Column(nullable = false)
    private String introSectionDescription;

    @Column(nullable = false)
    private String bookingSectionTitle;

    @Column(nullable = false)
    private String bookingSectionSubtitle;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerDescription;

    @Column(nullable = false)
    private String discountCode;

    @Column(nullable = false)
    private Integer discountPercent;

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

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerTagsCsv;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerLinksCsv;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String footerLinkUrlsCsv;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String daysCsv;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean acceptingBookings = true;

    @Column(columnDefinition = "LONGTEXT")
    private String bookingNotice;
}
