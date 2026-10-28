-- ===================================================================
-- Income Tax Filing Assistant - Database Schema & Sample Data
-- Target Database: MySQL / MariaDB (XAMPP default)
-- ===================================================================

CREATE DATABASE IF NOT EXISTS `tax_assistant` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tax_assistant`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `pan_number` VARCHAR(10) NOT NULL,
  `dob` DATE NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `default_fy` VARCHAR(10) DEFAULT '2024-2025',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Income Details Table
CREATE TABLE IF NOT EXISTS `income_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `financial_year` VARCHAR(10) NOT NULL,
  `category` ENUM('salary', 'house_property', 'capital_gains', 'business', 'other') NOT NULL,
  `subcategory` VARCHAR(150) DEFAULT NULL,
  `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_income_fy` (`user_id`, `financial_year`),
  CONSTRAINT `fk_income_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Deductions Table (Chapter VI-A)
CREATE TABLE IF NOT EXISTS `deductions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `financial_year` VARCHAR(10) NOT NULL,
  `section` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_ded_fy` (`user_id`, `financial_year`),
  CONSTRAINT `fk_deductions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tax Calculation Snapshots Table
CREATE TABLE IF NOT EXISTS `tax_calculations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `financial_year` VARCHAR(10) NOT NULL,
  `gross_income` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `total_deductions_old` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `total_deductions_new` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `taxable_income_old` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `taxable_income_new` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `net_tax_old` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `net_tax_new` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `recommended_regime` VARCHAR(20) DEFAULT 'new',
  `calculation_details` LONGTEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_calc_fy` (`user_id`, `financial_year`),
  CONSTRAINT `fk_calculations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Document Checklist Table
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `financial_year` VARCHAR(10) NOT NULL,
  `doc_name` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'uploaded', 'verified', 'na') DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_doc_fy` (`user_id`, `financial_year`),
  CONSTRAINT `fk_documents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- Sample Data Insertion for Demonstration
-- ===================================================================

-- Sample User Credentials:
-- Email: demo@taxassistant.local
-- Password: Demo@1234
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `pan_number`, `dob`, `phone`, `default_fy`)
VALUES (
  1,
  'Ramesh Kumar',
  'demo@taxassistant.local',
  '$2y$10$0knVC5/1cRQJIj5nDiAjz.JwY2ApwIKbX9mzWp6UrshHG8IBQUjb6',
  'ABCDE1234F',
  '1990-05-15',
  '9876543210',
  '2024-2025'
) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Sample Income Records (FY 2024-25)
INSERT INTO `income_details` (`user_id`, `financial_year`, `category`, `subcategory`, `amount`, `description`)
VALUES
  (1, '2024-2025', 'salary', 'Basic Salary', 960000.00, 'ABC Technologies Pvt Ltd (Form 16 verified)'),
  (1, '2024-2025', 'salary', 'Special Allowance & Bonus', 240000.00, 'Annual performance bonus & allowances'),
  (1, '2024-2025', 'house_property', 'Residential Rental Income', 180000.00, '2BHK Apartment at Indiranagar, Bangalore'),
  (1, '2024-2025', 'other', 'Bank Interest & Fixed Deposit', 45000.00, 'HDFC Bank Savings & SBI Term Deposit interest')
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

-- Sample Deductions (FY 2024-25)
INSERT INTO `deductions` (`user_id`, `financial_year`, `section`, `amount`, `notes`)
VALUES
  (1, '2024-2025', '80c', 150000.00, 'EPF ₹90,000 + PPF SBI Account ₹60,000 (Max ₹1.5L cap)'),
  (1, '2024-2025', '80d', 35000.00, 'Star Health Comprehensive Plan (Self ₹20,000 + Parents ₹15,000)'),
  (1, '2024-2025', '80ccd_1b', 50000.00, 'National Pension Scheme (NPS Tier-1 PRAN: 1100223344)'),
  (1, '2024-2025', 'sec_24b', 120000.00, 'Housing Loan Interest Certificate from SBI Home Finance'),
  (1, '2024-2025', '80tta', 10000.00, 'Savings Bank Account Interest deduction under Sec 80TTA')
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

-- Sample Document Checklist (FY 2024-25)
INSERT INTO `documents` (`user_id`, `financial_year`, `doc_name`, `status`, `notes`)
VALUES
  (1, '2024-2025', 'Form 16 (Part A & Part B)', 'verified', 'Received from Employer ABC Technologies Pvt Ltd on 15-Jun-2024'),
  (1, '2024-2025', 'Form 26AS & AIS / TIS Statement', 'verified', 'Downloaded from Income Tax portal; TDS matched with Form 16'),
  (1, '2024-2025', 'PAN Card & Aadhaar Linkage Confirmation', 'verified', 'Linked and verified on e-Filing portal'),
  (1, '2024-2025', 'Bank Account Statements & Interest Certificates', 'uploaded', 'HDFC & SBI statements collected for all 4 quarters'),
  (1, '2024-2025', 'Housing Loan Interest & Principal Certificate', 'uploaded', 'Issued by State Bank of India for FY 2024-25'),
  (1, '2024-2025', 'Section 80D Medical Insurance Premium Receipt', 'verified', 'Policy #STAR-102938 paid via net banking'),
  (1, '2024-2025', 'PPF & NPS Tier-1 Deposit Receipts', 'uploaded', 'SBI PPF receipt ₹60,000 and NPS contribution receipt ₹50,000'),
  (1, '2024-2025', 'Capital Gains Broker Statement (Stocks/Mutual Funds)', 'pending', 'Awaiting annual capital gains statement from Zerodha')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- Sample Calculation Snapshot
INSERT INTO `tax_calculations` (
  `user_id`, `financial_year`, `gross_income`, `total_deductions_old`, `total_deductions_new`,
  `taxable_income_old`, `taxable_income_new`, `net_tax_old`, `net_tax_new`, `recommended_regime`, `calculation_details`
)
VALUES (
  1,
  '2024-2025',
  1425000.00,
  415000.00,
  75000.00,
  1010000.00,
  1350000.00,
  119600.00,
  114400.00,
  'new',
  '{"note": "Initial comparative assessment. New regime yields ₹5,200 savings."}'
);
