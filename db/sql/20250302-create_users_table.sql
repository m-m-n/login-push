CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  expirationTime DATETIME,
  errorCount TINYINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY unique_user_endpoint_p256dh_auth (userId, endpoint(100), p256dh(100), auth(100))
);
