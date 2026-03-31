package com.hotelbookingproject.BLITCoding.repository;

import com.hotelbookingproject.BLITCoding.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByName(String name);
    boolean existsByName(String name);
}
