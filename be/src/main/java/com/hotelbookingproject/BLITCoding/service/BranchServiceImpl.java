package com.hotelbookingproject.BLITCoding.service;

import com.hotelbookingproject.BLITCoding.exception.ResourceNotFoundException;
import com.hotelbookingproject.BLITCoding.model.Branch;
import com.hotelbookingproject.BLITCoding.model.Room;
import com.hotelbookingproject.BLITCoding.repository.BranchRepository;
import com.hotelbookingproject.BLITCoding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final RoomRepository roomRepository;

    @Override
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    @Override
    public Optional<Branch> getBranchById(Long id) {
        return branchRepository.findById(id);
    }

    @Override
    public Optional<Branch> getBranchByName(String name) {
        return branchRepository.findByName(name);
    }

    @Override
    @Transactional
    public Branch createBranch(Branch branch) {
        if (branchRepository.existsByName(branch.getName())) {
            throw new IllegalArgumentException("Chi nhánh với tên này đã tồn tại");
        }
        return branchRepository.save(branch);
    }

    @Override
    @Transactional
    public Branch updateBranch(Long id, Branch branch) {
        Branch existingBranch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
        
        if (!existingBranch.getName().equals(branch.getName()) 
                && branchRepository.existsByName(branch.getName())) {
            throw new IllegalArgumentException("Chi nhánh với tên này đã tồn tại");
        }
        
        String oldName = existingBranch.getName();
        existingBranch.setName(branch.getName());
        existingBranch.setDescription(branch.getDescription());
        existingBranch.setAddress(branch.getAddress());
        existingBranch.setPhone(branch.getPhone());
        existingBranch.setActive(branch.isActive());
        
        Branch updated = branchRepository.save(existingBranch);
        
        // Update room areaName if branch name changed
        if (!oldName.equals(branch.getName())) {
            List<Room> rooms = roomRepository.findByAreaName(oldName);
            rooms.forEach(room -> room.setAreaName(branch.getName()));
            roomRepository.saveAll(rooms);
        }
        
        return updated;
    }

    @Override
    @Transactional
    public void deleteBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
        
        // Delete all rooms in this branch
        List<Room> rooms = roomRepository.findByAreaName(branch.getName());
        roomRepository.deleteAll(rooms);
        
        // Delete the branch
        branchRepository.delete(branch);
    }

    @Override
    @Transactional
    public Branch toggleBranchStatus(Long id, boolean active) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
        
        branch.setActive(active);
        return branchRepository.save(branch);
    }
}
