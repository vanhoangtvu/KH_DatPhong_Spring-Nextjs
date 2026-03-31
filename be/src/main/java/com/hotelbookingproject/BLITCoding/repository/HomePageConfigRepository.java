package com.hotelbookingproject.BLITCoding.repository;

import com.hotelbookingproject.BLITCoding.model.HomePageConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HomePageConfigRepository extends JpaRepository<HomePageConfig, Long> {
    Optional<HomePageConfig> findByConfigKey(String configKey);
}
