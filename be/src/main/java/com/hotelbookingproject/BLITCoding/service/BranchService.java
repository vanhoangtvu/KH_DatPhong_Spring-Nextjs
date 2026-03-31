package com.hotelbookingproject.BLITCoding.service;

import com.hotelbookingproject.BLITCoding.model.Branch;

import java.util.List;
import java.util.Optional;

public interface BranchService {
    List<Branch> getAllBranches();
    Optional<Branch> getBranchById(Long id);
    Optional<Branch> getBranchByName(String name);
    Branch createBranch(Branch branch);
    Branch updateBranch(Long id, Branch branch);
    void deleteBranch(Long id);
    Branch toggleBranchStatus(Long id, boolean active);
}
