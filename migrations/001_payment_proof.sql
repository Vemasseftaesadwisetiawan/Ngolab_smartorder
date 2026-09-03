-- Payment Proof Verification Feature
-- Run this migration to add payment proof support to orders

-- Add payment proof columns to orders table
ALTER TABLE orders ADD COLUMN payment_proof_url VARCHAR(255) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN payment_proof_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
