package com.hotelbookingproject.BLITCoding.config;

import com.hotelbookingproject.BLITCoding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(3)
@RequiredArgsConstructor
public class RoomDataInitializer implements CommandLineRunner {

    private final RoomRepository roomRepository;

    @Override
    public void run(String... args) {
        // Disabled: BranchDataInitializer now creates sample rooms
        // This initializer is kept for reference only
        System.out.println("RoomDataInitializer: Skipped (rooms created by BranchDataInitializer)");
    }
}
