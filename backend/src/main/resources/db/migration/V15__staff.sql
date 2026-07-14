CREATE TABLE staff (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name    VARCHAR(200) NOT NULL,
  mobile       VARCHAR(15)  NULL,
  address      TEXT         NULL,
  designation  VARCHAR(100) NOT NULL,
  salary       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  join_date    DATE         NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  notes        VARCHAR(500) NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE staff_salary (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  staff_id     BIGINT       NOT NULL,
  salary_month VARCHAR(7)   NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  paid_date    DATE         NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  notes        VARCHAR(200) NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_salary_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  CONSTRAINT uq_staff_month  UNIQUE (staff_id, salary_month)
);