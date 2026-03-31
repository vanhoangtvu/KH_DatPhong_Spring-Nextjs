package com.hotelbookingproject.BLITCoding.config;

import com.hotelbookingproject.BLITCoding.model.Role;
import com.hotelbookingproject.BLITCoding.model.User;
import com.hotelbookingproject.BLITCoding.repository.RoleRepository;
import com.hotelbookingproject.BLITCoding.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@hotel.com";
    private static final String ADMIN_PASSWORD = "Admin@123";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Role adminRole = ensureRole("ROLE_ADMIN");
        ensureRole("ROLE_USER");

        if (userRepository.findByEmail(ADMIN_EMAIL).isPresent()) {
            return;
        }

        User admin = new User();
        admin.setFirstName("System");
        admin.setLastName("Admin");
        admin.setEmail(ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setRoles(Collections.singletonList(adminRole));
        userRepository.save(admin);
    }

    private Role ensureRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
    }
}
