package com.adityainfotech.societyms.presentation.controller;

import com.adityainfotech.societyms.application.service.PushNotificationService;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class PushNotificationController {

    private final PushNotificationService pushService;
    private final UserJpaRepository       userRepository;
    private final com.adityainfotech.societyms.application.service.EmailService emailService;
    private final com.adityainfotech.societyms.application.service.MemberService memberService;

    /** Frontend ला VAPID public key द्या */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushService.getPublicKey()));
    }

    /** Browser subscription save करा */
    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@RequestBody Map<String, String> body) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.badRequest().build();
        pushService.subscribe(userId, body.get("endpoint"), body.get("p256dh"), body.get("auth"));
        return ResponseEntity.ok().build();
    }

    /** Browser subscription remove करा */
    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(@RequestBody Map<String, String> body) {
        Long userId = resolveUserId();
        if (userId == null) return ResponseEntity.badRequest().build();
        pushService.unsubscribe(userId, body.get("endpoint"));
        return ResponseEntity.ok().build();
    }

    /** Defaulter ला maintenance due reminder email पाठवा (ADMIN only) */
    @PostMapping("/remind/{memberId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> sendReminder(
        @org.springframework.web.bind.annotation.PathVariable Long memberId,
        @RequestBody Map<String, String> body
    ) {
        var member = memberService.getOrThrow(memberId);
        String amountDue = body.getOrDefault("amountDue", "");

        emailService.sendMaintenanceReminder(member.getEmail(), member.getFullName(), amountDue);

        return ResponseEntity.ok(Map.of("message", "Reminder email sent"));
    }

    /** Multiple defaulters ना एकदम reminder email पाठवा (ADMIN only) */
    @PostMapping("/remind-bulk")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendBulkReminder(
        @RequestBody java.util.List<Map<String, String>> recipients
    ) {
        int sent = 0;
        int skipped = 0;
        for (Map<String, String> r : recipients) {
            try {
                Long memberId = Long.valueOf(r.get("memberId"));
                String amountDue = r.getOrDefault("amountDue", "");
                var member = memberService.getOrThrow(memberId);
                if (member.getEmail() == null || member.getEmail().isBlank()) {
                    skipped++;
                    continue;
                }
                emailService.sendMaintenanceReminder(member.getEmail(), member.getFullName(), amountDue);
                sent++;
            } catch (Exception e) {
                skipped++;
            }
        }
        return ResponseEntity.ok(Map.of(
            "message", sent + " reminder(s) sent" + (skipped > 0 ? ", " + skipped + " skipped (no email)" : ""),
            "sent", sent,
            "skipped", skipped
        ));
    }

    private Long resolveUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).map(u -> u.getId()).orElse(null);
    }
}