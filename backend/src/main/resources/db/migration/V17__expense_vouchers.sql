CREATE TABLE expense_vouchers (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  voucher_number  VARCHAR(30)   NOT NULL UNIQUE,
  expense_for     VARCHAR(200)  NOT NULL,
  vendor_name     VARCHAR(150)  NULL,
  voucher_date    DATE          NOT NULL,
  sub_total       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  paid_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_mode    VARCHAR(20)   NOT NULL DEFAULT 'CASH',
  description     VARCHAR(500)  NULL,
  account_entry_id BIGINT       NULL,
  created_by      BIGINT        NULL,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE expense_voucher_items (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  voucher_id  BIGINT        NOT NULL,
  item_name   VARCHAR(200)  NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
  price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_voucher_item FOREIGN KEY (voucher_id) REFERENCES expense_vouchers(id) ON DELETE CASCADE
);