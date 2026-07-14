CREATE TABLE vendors (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  vendor_type  VARCHAR(50)  NULL,
  mobile       VARCHAR(15)  NULL,
  address      VARCHAR(300) NULL,
  notes        VARCHAR(300) NULL,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE expense_vouchers ADD COLUMN vendor_id BIGINT NULL;
ALTER TABLE expense_vouchers ADD CONSTRAINT fk_voucher_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;