-- ============================================================
-- V1__auth_schema.sql
-- Phase 1: Auth foundation tables
-- SocietyMS v2.0 — ADITYA INFOTECH
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- USERS
-- Primary identity table. Role drives all authorization logic.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50)     NOT NULL,
    password    VARCHAR(255)    NOT NULL,           -- BCrypt hash
    role        VARCHAR(20)     NOT NULL,            -- ADMIN | MANAGER | ACCOUNTANT | SECURITY | MEMBER
    full_name   VARCHAR(200),
    is_active   TINYINT(1)      DEFAULT 1,
    member_id   BIGINT          DEFAULT NULL,        -- FK added in V2 when members table exists
    last_login  TIMESTAMP       NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_username UNIQUE (username),
    INDEX idx_users_role      (role),
    INDEX idx_users_is_active (is_active)
);

-- ─────────────────────────────────────────────────────────────
-- REFRESH TOKENS
-- Server-side token revocation list for secure JWT rotation.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT          NOT NULL,
    token       VARCHAR(512)    NOT NULL,
    expires_at  TIMESTAMP       NOT NULL,
    revoked     TINYINT(1)      DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rt_user    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_rt_token   UNIQUE (token),
    INDEX idx_rt_user_id     (user_id),
    INDEX idx_rt_expires_at  (expires_at)
);

-- ─────────────────────────────────────────────────────────────
-- USER ACTIVITY LOG
-- Audit trail for security events.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity_log (
    id          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT          DEFAULT NULL,
    username    VARCHAR(50)     NOT NULL,
    action      VARCHAR(200)    NOT NULL,
    module      VARCHAR(100),
    entity_id   BIGINT          DEFAULT NULL,
    details     TEXT,
    ip_address  VARCHAR(50),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_log_user_id  (user_id),
    INDEX idx_log_module   (module),
    INDEX idx_log_created  (created_at)
);

SET FOREIGN_KEY_CHECKS = 1;
