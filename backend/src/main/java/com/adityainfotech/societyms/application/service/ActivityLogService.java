package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.domain.entity.UserActivityLog;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserActivityLogJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Writes audit entries asynchronously — never blocks the main request thread.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final UserActivityLogJpaRepository logRepository;

    @Async
    public void log(Long userId, String username, String action,
                    String module, Long entityId, String details, String ipAddress) {
        try {
            UserActivityLog entry = UserActivityLog.builder()
                .userId(userId)
                .username(username)
                .action(action)
                .module(module)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .build();
            logRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to write activity log: {}", e.getMessage());
        }
    }
}
