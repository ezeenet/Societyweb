-- ============================================================
-- V5__operations_schema.sql
-- Phase 4: Complaints, Visitors, Notices
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- COMPLAINTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
    id          BIGINT        PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(200)  NOT NULL,
    description TEXT,
    category    VARCHAR(50),
    status      VARCHAR(20)   NOT NULL DEFAULT 'OPEN',
    member_id   BIGINT        NOT NULL,
    remarks     VARCHAR(500),
    resolved_at TIMESTAMP     NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaints_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_complaints_member   (member_id),
    INDEX idx_complaints_status   (status),
    INDEX idx_complaints_category (category)
);

-- ─────────────────────────────────────────────────────────────
-- VISITORS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitors (
    id           BIGINT        PRIMARY KEY AUTO_INCREMENT,
    visitor_name VARCHAR(200)  NOT NULL,
    mobile       VARCHAR(15),
    purpose      VARCHAR(200),
    flat_id      BIGINT,
    host_member  BIGINT,
    entry_time   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time    DATETIME,
    vehicle_no   VARCHAR(20),
    logged_by    BIGINT,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_visitors_flat   FOREIGN KEY (flat_id)     REFERENCES flats(id)   ON DELETE SET NULL,
    CONSTRAINT fk_visitors_host   FOREIGN KEY (host_member) REFERENCES members(id)  ON DELETE SET NULL,
    CONSTRAINT fk_visitors_logger FOREIGN KEY (logged_by)   REFERENCES users(id)    ON DELETE SET NULL,
    INDEX idx_visitors_flat  (flat_id),
    INDEX idx_visitors_entry (entry_time),
    INDEX idx_visitors_exit  (exit_time)
);

-- ─────────────────────────────────────────────────────────────
-- NOTICES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
    id              BIGINT        PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(200)  NOT NULL,
    content         TEXT,
    category        VARCHAR(50)   DEFAULT 'General',
    created_by      BIGINT,
    created_by_name VARCHAR(200),
    is_active       TINYINT(1)    DEFAULT 1,
    expires_at      DATE,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_notices_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_notices_active   (is_active),
    INDEX idx_notices_category (category),
    INDEX idx_notices_expires  (expires_at)
);

-- ─────────────────────────────────────────────────────────────
-- NOTICE POLLS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notice_polls (
    id        BIGINT        PRIMARY KEY AUTO_INCREMENT,
    notice_id BIGINT        NOT NULL,
    question  VARCHAR(500)  NOT NULL,
    option_a  VARCHAR(200)  NOT NULL,
    option_b  VARCHAR(200)  NOT NULL,
    option_c  VARCHAR(200),
    option_d  VARCHAR(200),
    is_active TINYINT(1)    DEFAULT 1,
    ends_at   DATETIME,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_polls_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- NOTICE POLL VOTES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notice_poll_votes (
    id              BIGINT      PRIMARY KEY AUTO_INCREMENT,
    poll_id         BIGINT      NOT NULL,
    member_id       BIGINT      NOT NULL,
    selected_option VARCHAR(1)  NOT NULL,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_votes_poll   FOREIGN KEY (poll_id)   REFERENCES notice_polls(id) ON DELETE CASCADE,
    CONSTRAINT fk_votes_member FOREIGN KEY (member_id) REFERENCES members(id)      ON DELETE CASCADE,
    CONSTRAINT uq_vote_poll_member UNIQUE (poll_id, member_id),
    INDEX idx_votes_poll (poll_id)
);

-- ─────────────────────────────────────────────────────────────
-- NOTICE ACKNOWLEDGEMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notice_acknowledgements (
    id        BIGINT     PRIMARY KEY AUTO_INCREMENT,
    notice_id BIGINT     NOT NULL,
    member_id BIGINT     NOT NULL,
    read_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_acks_notice FOREIGN KEY (notice_id) REFERENCES notices(id)  ON DELETE CASCADE,
    CONSTRAINT fk_acks_member FOREIGN KEY (member_id) REFERENCES members(id)  ON DELETE CASCADE,
    CONSTRAINT uq_ack_notice_member UNIQUE (notice_id, member_id)
);

SET FOREIGN_KEY_CHECKS = 1;
