package com.adityainfotech.societyms.infrastructure.persistence.jpa;

import com.adityainfotech.societyms.domain.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenJpaRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    /**
     * Revokes all active refresh tokens for a given user.
     * Called on logout to invalidate all sessions for that user.
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user.id = :userId AND rt.revoked = false")
    void revokeAllByUserId(Long userId);

    /**
     * Scheduled cleanup — purges expired rows to keep the table lean.
     * Invoked by a @Scheduled job (added in Phase 7).
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now OR rt.revoked = true")
    void deleteExpiredAndRevoked(Instant now);

}
