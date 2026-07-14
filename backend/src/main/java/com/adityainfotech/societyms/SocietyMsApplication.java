package com.adityainfotech.societyms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SocietyMS — Society Management System
 * Web Edition v2.0 | ADITYA INFOTECH, Akola
 *
 * @EnableJpaAuditing  → Activates @CreatedDate / @LastModifiedDate on entities
 * @EnableScheduling   → Activates @Scheduled jobs (e.g. token cleanup in Phase 7)
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
public class SocietyMsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SocietyMsApplication.class, args);
    }

}
