package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.application.dto.request.SettingsRequest;
import com.adityainfotech.societyms.application.dto.response.SettingsResponse;
import com.adityainfotech.societyms.domain.entity.SocietySetting;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.SocietySettingJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {

    private final SocietySettingJpaRepository settingsRepository;

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    private static final Long SETTINGS_ID = 1L;

    @Transactional(readOnly = true)
    public SettingsResponse getSettings() {
        return SettingsResponse.from(getOrCreate());
    }

    @Transactional
    public SettingsResponse updateSettings(SettingsRequest request) {
        SocietySetting settings = getOrCreate();

        settings.setSocietyName(request.societyName());
        settings.setRegistrationNo(request.registrationNo());
        settings.setAddress(request.address());
        settings.setCity(request.city());
        settings.setState(request.state());
        settings.setPincode(request.pincode());
        settings.setContactPhone(request.contactPhone());
        settings.setContactEmail(request.contactEmail());
        settings.setWebsite(request.website());

        if (request.defaultMaintenanceAmount() != null)
            settings.setDefaultMaintenanceAmount(request.defaultMaintenanceAmount());
        if (request.maintenanceDueDayOfMonth() != null)
            settings.setMaintenanceDueDayOfMonth(request.maintenanceDueDayOfMonth());
        if (request.lateFineAmount() != null)
            settings.setLateFineAmount(request.lateFineAmount());
        if (request.lateFineDaysAfterDue() != null)
            settings.setLateFineDaysAfterDue(request.lateFineDaysAfterDue());

        settings.setBankName(request.bankName());
        settings.setBankAccountNo(request.bankAccountNo());
        settings.setBankIfscCode(request.bankIfscCode());
        settings.setBankBranch(request.bankBranch());

        if (request.financialYearStart() != null)
            settings.setFinancialYearStart(request.financialYearStart());
        if (request.currency() != null)
            settings.setCurrency(request.currency());

        if (request.reminderEmailSubject() != null)
            settings.setReminderEmailSubject(request.reminderEmailSubject());
        if (request.reminderEmailBody() != null)
            settings.setReminderEmailBody(request.reminderEmailBody());
        if (request.emailUsername() != null)
            settings.setEmailUsername(request.emailUsername());
        if (request.emailPassword() != null && !request.emailPassword().isBlank())
            settings.setEmailPassword(request.emailPassword());

        return SettingsResponse.from(settingsRepository.save(settings));
    }

    @Transactional
    public SettingsResponse uploadLogo(MultipartFile file) throws IOException {
        SocietySetting settings = getOrCreate();

        String ts        = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String extension = getExtension(file.getOriginalFilename());
        String filename  = "logo_" + ts + "." + extension;
        Path   dest      = Paths.get(uploadDir, "logo", filename);

        Files.createDirectories(dest.getParent());
        file.transferTo(dest.toFile());

        settings.setLogoPath("/uploads/logo/" + filename);
        return SettingsResponse.from(settingsRepository.save(settings));
    }

    private SocietySetting getOrCreate() {
        return settingsRepository.findById(SETTINGS_ID)
            .orElseGet(() -> settingsRepository.save(SocietySetting.builder().build()));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "png";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
