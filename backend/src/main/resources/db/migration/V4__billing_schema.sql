-- ============================================================
-- V4__billing_schema.sql
-- Phase 3: Maintenance billing and payments
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS maintenance_bills (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    flat_id      BIGINT         NOT NULL,
    bill_month   CHAR(7)        NOT NULL,
    amount       DECIMAL(10,2)  NOT NULL,
    late_fine    DECIMAL(10,2)  DEFAULT 0.00,
    total_due    DECIMAL(10,2),
    due_date     DATE,
    status       VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    generated_by BIGINT,

    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_bills_flat      FOREIGN KEY (flat_id)      REFERENCES flats(id),
    CONSTRAINT fk_bills_generator FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_bill_flat_month UNIQUE (flat_id, bill_month),
    INDEX idx_bills_flat   (flat_id),
    INDEX idx_bills_status (status),
    INDEX idx_bills_month  (bill_month)
);

CREATE TABLE IF NOT EXISTS payments (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_id          BIGINT         NOT NULL,
    member_id        BIGINT         NOT NULL,
    amount_paid      DECIMAL(10,2)  NOT NULL,
    payment_date     DATE           NOT NULL,
    payment_mode     VARCHAR(20)    NOT NULL,
    reference_no     VARCHAR(100),
    receipt_number   VARCHAR(50)    UNIQUE,
    remarks          VARCHAR(500),
    approval_status  VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    approved_by      BIGINT,
    approved_at      TIMESTAMP      NULL,
    rejection_reason VARCHAR(300),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_bill     FOREIGN KEY (bill_id)     REFERENCES maintenance_bills(id),
    CONSTRAINT fk_payments_member   FOREIGN KEY (member_id)   REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payments_bill    (bill_id),
    INDEX idx_payments_member  (member_id),
    INDEX idx_payments_status  (approval_status),
    INDEX idx_payments_date    (payment_date),
    INDEX idx_payments_mode    (payment_mode)
);

SET FOREIGN_KEY_CHECKS = 1;
