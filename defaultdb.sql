USE myappdb;
SELECT NOW();


USE myappdb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_uid VARCHAR(12) NOT NULL UNIQUE, -- random user ID
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO users (user_uid, name, email, password)
VALUES ('123456789abc','Test User', 'test@test.test', '$2b$10$NWMPvWeXsXZ5Z26O2C8eRONfPWxwGYewA16oTBBhIxU73XTi/WzT6');

SHOW CREATE TABLE users;
DESCRIBE users;

