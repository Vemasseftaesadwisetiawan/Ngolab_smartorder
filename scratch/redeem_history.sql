CREATE TABLE IF NOT EXISTS redeem_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reward_id INT NOT NULL,
  reward_name VARCHAR(255) NOT NULL,
  points_spent INT NOT NULL,
  voucher_code VARCHAR(255) NOT NULL,
  status ENUM('active','used','expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_reward (reward_id)
);
