CREATE TABLE bank_accounts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_name    VARCHAR(100) NOT NULL,
  bank_name       VARCHAR(100) NOT NULL,
  account_number  VARCHAR(50)  NULL,
  branch          VARCHAR(100) NULL,
  opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bank_transactions (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  bank_account_id  BIGINT       NOT NULL,
  transaction_type VARCHAR(20)  NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  description      VARCHAR(200) NULL,
  transaction_date DATE         NOT NULL,
  reference        VARCHAR(100) NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_txn_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);