package com.example.demo.service;

import com.example.demo.model.HireRecord;
import com.example.demo.model.TokenWallet;
import com.example.demo.model.User;
import com.example.demo.repository.HireRecordRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.TokenWalletRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HireService {

    private final HireRecordRepository hireRecordRepository;
    private final UserRepository userRepository;
    private final TokenWalletRepository walletRepository;
    private final MessageRepository messageRepository;
    @Transactional
    public void createHireRecord(Long employerId, Long workerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found."));
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found."));

        HireRecord record = new HireRecord();
        record.setEmployer(employer);
        record.setWorker(worker);
        hireRecordRepository.save(record);
    }

    public List<Map<String, Object>> getActiveWorkers(String username) {
        User employer = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employer not found."));
        return hireRecordRepository.findByEmployerIdAndActiveTrue(employer.getId())
                .stream()
                .map(r -> Map.<String, Object>of(
                        "hireId",    r.getId(),
                        "workerId",  r.getWorker().getId(),
                        "firstName", r.getWorker().getFirstName(),
                        "lastName",  r.getWorker().getLastName(),
                        "username",  r.getWorker().getUsername(),  // ← add this
                        "jobTitle",  r.getWorker().getJobTitle() != null
                                        ? r.getWorker().getJobTitle() : "No job title",
                        "hiredAt",   r.getHiredAt().toString()
                ))
                .toList();
    }
    
    @Transactional
    public void endContract(Long hireId, String username) {
        User employer = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employer not found."));

        HireRecord record = hireRecordRepository.findById(hireId)
                .orElseThrow(() -> new RuntimeException("Hire record not found."));

        if (!record.getEmployer().getId().equals(employer.getId()))
            throw new RuntimeException("Forbidden.");

        record.setActive(false);
        hireRecordRepository.save(record);

        User worker = record.getWorker();
        worker.setHired(false);
        userRepository.save(worker);

        // Clear conversation
        messageRepository.deleteConversation(employer.getId(), worker.getId());
    }
    @Transactional
        public void cancelContract(Long hireId, String username) {
        User employer = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employer not found."));

        HireRecord record = hireRecordRepository.findById(hireId)
                .orElseThrow(() -> new RuntimeException("Hire record not found."));

        if (!record.getEmployer().getId().equals(employer.getId()))
                throw new RuntimeException("Forbidden.");

        if (record.getHiredAt().isBefore(LocalDateTime.now().minusMinutes(10)))
                throw new RuntimeException("Cancellation window has expired. You can only cancel within 10 minutes of hiring.");

        record.setActive(false);
        hireRecordRepository.save(record);

        User worker = record.getWorker();
        worker.setHired(false);
        userRepository.save(worker);

        TokenWallet workerWallet = walletRepository.findByUserId(worker.getId())
                .orElseThrow(() -> new RuntimeException("Worker wallet not found."));
        workerWallet.addTokens(3);
        walletRepository.save(workerWallet);

        messageRepository.deleteConversation(employer.getId(), worker.getId());
        }
}