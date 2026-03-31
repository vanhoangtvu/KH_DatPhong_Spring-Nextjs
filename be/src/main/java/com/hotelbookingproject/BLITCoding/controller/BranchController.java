package com.hotelbookingproject.BLITCoding.controller;

import com.hotelbookingproject.BLITCoding.model.Branch;
import com.hotelbookingproject.BLITCoding.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class BranchController {

    private final BranchService branchService;

    @GetMapping("/public/branches")
    public ResponseEntity<List<Branch>> getAllBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/public/branches/active")
    public ResponseEntity<List<Branch>> getActiveBranches() {
        List<Branch> activeBranches = branchService.getAllBranches().stream()
                .filter(Branch::isActive)
                .toList();
        return ResponseEntity.ok(activeBranches);
    }

    @GetMapping("/admin/branches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBranchById(@PathVariable Long id) {
        return branchService.getBranchById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/branches")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBranch(@RequestBody Branch branch) {
        try {
            Branch created = branchService.createBranch(branch);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/admin/branches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBranch(@PathVariable Long id, @RequestBody Branch branch) {
        try {
            Branch updated = branchService.updateBranch(id, branch);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/admin/branches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBranch(@PathVariable Long id) {
        try {
            branchService.deleteBranch(id);
            return ResponseEntity.ok("Chi nhánh và các phòng liên quan đã được xóa");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/admin/branches/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleBranchStatus(@PathVariable Long id, @RequestParam boolean active) {
        try {
            Branch updated = branchService.toggleBranchStatus(id, active);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
