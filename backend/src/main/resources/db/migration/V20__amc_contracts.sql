CREATE TABLE amc_contracts (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  contract_name   VARCHAR(200) NOT NULL,
  vendor_id       BIGINT       NULL,
  vendor_name     VARCHAR(150) NULL,
  category        VARCHAR(50)  NOT NULL,
  start_date      DATE         NOT NULL,
  end_date        DATE         NOT NULL,
  amount          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_mode    VARCHAR(20)  NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  notes           VARCHAR(500) NULL,
  reminder_days   INT          NOT NULL DEFAULT 30,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_amc_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);