-- ============================================================
-- V3__property_schema.sql
-- Phase 2: Wings, Flats, Members tables
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS wings (
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flats (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    flat_number  VARCHAR(20) NOT NULL,
    floor_number INT,
    flat_type    VARCHAR(20),
    area_sqft    DECIMAL(10,2),
    status       VARCHAR(20) NOT NULL DEFAULT 'VACANT',
    wing_id      BIGINT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_flats_wing     FOREIGN KEY (wing_id) REFERENCES wings(id),
    CONSTRAINT uq_flat_number_wing UNIQUE (flat_number, wing_id),
    INDEX idx_flats_wing   (wing_id),
    INDEX idx_flats_status (status)
);

CREATE TABLE IF NOT EXISTS members (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name      VARCHAR(200) NOT NULL,
    mobile         VARCHAR(15),
    email          VARCHAR(100),
    aadhar_number  VARCHAR(12),
    member_type    VARCHAR(20) DEFAULT 'OWNER',
    flat_id        BIGINT,
    move_in_date   DATE,
    move_out_date  DATE,
    vehicle_number VARCHAR(20),
    parking_slot   VARCHAR(20),
    is_active      TINYINT(1) DEFAULT 1,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_members_flat FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL,
    INDEX idx_members_flat   (flat_id),
    INDEX idx_members_active (is_active)
);

-- Add member_id FK to users (was deferred from V1 — members table now exists)
ALTER TABLE users
    ADD CONSTRAINT fk_users_member
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;
