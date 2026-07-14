-- ============================================================
-- V2__seed_admin_user.sql
-- Seeds the default ADMIN user for first-time setup.
-- Password: Admin@123 (BCrypt hash — change immediately after first login)
-- ============================================================

INSERT INTO users (username, password, role, full_name, is_active)
VALUES (
    'admin',
    '$2a$12$7Kd5vxOH7BYPe8vE3Z6LCeXPlXNy4J7RfLVXFzPFyT1L3t3P5mKBe',
    'ADMIN',
    'System Administrator',
    1
)
ON DUPLICATE KEY UPDATE id = id;   -- Idempotent: safe to re-run
