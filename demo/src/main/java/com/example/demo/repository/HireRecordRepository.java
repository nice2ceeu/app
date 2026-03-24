package com.example.demo.repository;

import com.example.demo.model.HireRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HireRecordRepository extends JpaRepository<HireRecord, Long> {
    List<HireRecord> findByEmployerIdAndActiveTrue(Long employerId);
}