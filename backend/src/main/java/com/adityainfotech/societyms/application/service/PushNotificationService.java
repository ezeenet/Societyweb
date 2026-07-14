package com.adityainfotech.societyms.application.service;

import com.adityainfotech.societyms.domain.entity.PushSubscription;
import com.adityainfotech.societyms.infrastructure.persistence.jpa.PushSubscriptionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private final PushSubscriptionJpaRepository subscriptionRepository;

    @Value("${app.vapid.public-key}")
    private String vapidPublicKey;

    @Value("${app.vapid.private-key}")
    private String vapidPrivateKey;

    @Value("${app.vapid.subject:mailto:admin@societyms.com}")
    private String vapidSubject;

    private PushService pushService;

    @PostConstruct
    public void init() {
        try {
            Security.addProvider(new BouncyCastleProvider());
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("PushNotificationService initialized");
        } catch (Exception e) {
            log.error("PushNotificationService init failed: {}", e.getMessage());
        }
    }

    public void subscribe(Long userId, String endpoint, String p256dh, String auth) {
        subscriptionRepository.findByUserIdAndEndpoint(userId, endpoint).ifPresentOrElse(
            existing -> log.debug("Subscription already exists for userId={}", userId),
            () -> {
                PushSubscription sub = PushSubscription.builder()
                    .userId(userId)
                    .endpoint(endpoint)
                    .p256dh(p256dh)
                    .auth(auth)
                    .createdAt(LocalDateTime.now())
                    .build();
                subscriptionRepository.save(sub);
                log.info("New push subscription saved for userId={}", userId);
            }
        );
    }

    public void unsubscribe(Long userId, String endpoint) {
        subscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
        log.info("Push subscription removed for userId={}", userId);
    }

    public void sendToUser(Long userId, String title, String body, String tag) {
        List<PushSubscription> subs = subscriptionRepository.findByUserId(userId);
        if (subs.isEmpty()) {
            log.debug("No push subscriptions for userId={}", userId);
            return;
        }
        String payload = buildPayload(title, body, tag);
        for (PushSubscription sub : subs) {
            try {
                Subscription subscription = new Subscription(
                    sub.getEndpoint(),
                    new Subscription.Keys(sub.getP256dh(), sub.getAuth())
                );
                Notification notification = new Notification(subscription, payload);
                pushService.send(notification);
                log.info("Push sent to userId={}", userId);
            } catch (Exception e) {
                log.warn("Push failed for userId={}: {}", userId, e.getMessage());
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    subscriptionRepository.deleteByUserIdAndEndpoint(userId, sub.getEndpoint());
                }
            }
        }
    }

    public String getPublicKey() {
        return vapidPublicKey;
    }

    private String buildPayload(String title, String body, String tag) {
        return "{\"title\":\"" + escape(title) + "\","
             + "\"body\":\""  + escape(body)   + "\","
             + "\"tag\":\""   + escape(tag)    + "\","
             + "\"icon\":\"/favicon.ico\"}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}