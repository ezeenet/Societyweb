package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.domain.entity.SocietySetting;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.SocietySettingJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final SocietySettingJpaRepository settingsRepository;

    private static final Long SETTINGS_ID = 1L;

    public void sendMaintenanceReminder(String toEmail, String memberName, String amountDue) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Reminder skipped - no email for member {}", memberName);
            return;
        }

        SocietySetting settings = settingsRepository.findById(SETTINGS_ID).orElse(null);

        String username = (settings != null) ? settings.getEmailUsername() : null;
        String password = (settings != null) ? settings.getEmailPassword() : null;

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            log.warn("Email not configured in Settings - reminder skipped for {}", memberName);
            return;
        }

        String subject = (settings.getReminderEmailSubject() != null)
            ? settings.getReminderEmailSubject() : "Maintenance Due Reminder";

        String bodyTemplate = (settings.getReminderEmailBody() != null)
            ? settings.getReminderEmailBody()
            : "Dear {memberName},\n\nYour pending maintenance amount is {amountDue}.\nPlease clear it at the earliest.\n\nRegards,\nSociety Management";

        String body = bodyTemplate
            .replace("{memberName}", memberName)
            .replace("{amountDue}", amountDue);

        try {
            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost("smtp.gmail.com");
            mailSender.setPort(587);
            mailSender.setUsername(username);
            mailSender.setPassword(password);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Reminder email sent to {} ({})", memberName, toEmail);
        } catch (Exception e) {
            log.error("Failed to send reminder email to {}: {}", toEmail, e.getMessage());
        }
    }
}