-- ============================================================
-- V7__admin_schema.sql
-- Phase 6: Society Settings, Documents, seed settings row
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS society_settings (
    id                           BIGINT        PRIMARY KEY AUTO_INCREMENT,
    society_name                 VARCHAR(200),
    registration_no              VARCHAR(100),
    address                      TEXT,
    city                         VARCHAR(100),
    state                        VARCHAR(100),
    pincode                      VARCHAR(10),
    contact_phone                VARCHAR(15),
    contact_email                VARCHAR(100),
    website                      VARCHAR(200),
    default_maintenance_amount   DECIMAL(10,2) DEFAULT 2000.00,
    maintenance_due_day_of_month INT           DEFAULT 10,
    late_fine_amount             DECIMAL(10,2) DEFAULT 100.00,
    late_fine_days_after_due     INT           DEFAULT 5,
    bank_name                    VARCHAR(200),
    bank_account_no              VARCHAR(50),
    bank_ifsc_code               VARCHAR(20),
    bank_branch                  VARCHAR(200),
    financial_year_start         VARCHAR(10)   DEFAULT '01-04',
    currency                     VARCHAR(10)   DEFAULT 'INR',
    logo_path                    VARCHAR(500),
    version                      INT           DEFAULT 0,
    created_at                   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at                   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default settings row (id=1 always)
INSERT INTO society_settings (id, society_name, city, state, currency, financial_year_start)
VALUES (1, 'My Housing Society', 'Akola', 'Maharashtra', 'INR', '01-04')
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS documents (
    id               BIGINT        PRIMARY KEY AUTO_INCREMENT,
    title            VARCHAR(200)  NOT NULL,
    document_type    VARCHAR(50)   NOT NULL,
    file_path        VARCHAR(500)  NOT NULL,
    file_name        VARCHAR(200)  NOT NULL,
    file_size        BIGINT,
    mime_type        VARCHAR(100),
    uploaded_by      BIGINT,
    uploaded_by_name VARCHAR(200),
    member_id        BIGINT,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_docs_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)   ON DELETE SET NULL,
    CONSTRAINT fk_docs_member   FOREIGN KEY (member_id)   REFERENCES members(id)  ON DELETE SET NULL,
    INDEX idx_docs_type   (document_type),
    INDEX idx_docs_member (member_id)
);

SET FOREIGN_KEY_CHECKS = 1;
