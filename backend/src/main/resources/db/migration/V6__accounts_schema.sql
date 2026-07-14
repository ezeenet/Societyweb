-- ============================================================
-- V6__accounts_schema.sql
-- Phase 5: General account entries
-- ============================================================

CREATE TABLE IF NOT EXISTS account_entries (
    id           BIGINT        PRIMARY KEY AUTO_INCREMENT,
    title        VARCHAR(200)  NOT NULL,
    amount       DECIMAL(10,2) NOT NULL,
    entry_type   VARCHAR(30)   NOT NULL,
    category     VARCHAR(100),
    sub_category VARCHAR(100),
    description  TEXT,
    entry_date   DATE          NOT NULL,
    reference    VARCHAR(100),
    is_verified  TINYINT(1)    DEFAULT 0,
    created_by   BIGINT,

    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_accounts_type     (entry_type),
    INDEX idx_accounts_date     (entry_date),
    INDEX idx_accounts_category (category)
);
