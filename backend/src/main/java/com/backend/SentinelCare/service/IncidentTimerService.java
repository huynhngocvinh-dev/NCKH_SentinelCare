package com.backend.SentinelCare.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;

@Service
@Slf4j
public class IncidentTimerService {

    private final TransactionTemplate transactionTemplate;
    private ThreadPoolTaskScheduler scheduler;

    public IncidentTimerService(PlatformTransactionManager transactionManager) {
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @PostConstruct
    void init() {
        scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("incident-timer-");
        scheduler.setRemoveOnCancelPolicy(true);
        scheduler.initialize();
    }

    @PreDestroy
    void shutdown() {
        if (scheduler != null) scheduler.shutdown();
    }

    /**
     * Chạy job sau delaySeconds giây, KHÔNG chặn request hiện tại.
     * Nếu đang trong transaction thì chỉ hẹn giờ sau khi transaction commit thành công.
     */
    public void runAfter(long delaySeconds, String label, Runnable job) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    schedule(delaySeconds, label, job);
                }
            });
        } else {
            schedule(delaySeconds, label, job);
        }
    }

    private void schedule(long delaySeconds, String label, Runnable job) {
        scheduler.schedule(() -> {
            try {
                // Mỗi job chạy trong 1 transaction riêng để đọc dữ liệu lazy không bị lỗi
                transactionTemplate.executeWithoutResult(status -> job.run());
            } catch (Exception e) {
                log.error("loi khi run bo dem '{}'", label, e);
            }
        }, Instant.now().plusSeconds(delaySeconds));
    }
}