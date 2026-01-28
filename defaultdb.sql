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
VALUES ('78q9lL9u7Rs2','Harry Kane', 'HarryKane@test.test', '$2b$10$NWMPvWeXsXZ5Z26O2C8eRONfPWxwGYewA16oTBBhIxU73XTi/WzT6');

SHOW CREATE TABLE users;
DESCRIBE users;




-- View all carousel cards
SELECT id, title, header, subheader, items FROM carousel_insights;

-- View specific card
SELECT * FROM carousel_insights WHERE id = 1;

-- Edit a card
UPDATE carousel_insights 
SET title = 'New Title', header = 'New Header' 
WHERE id = 1;

-- Delete a card
DELETE FROM carousel_insights WHERE id = 1;

-- Add new card
INSERT INTO carousel_insights (title, header, subheader, items) 
VALUES ('Title', 'Header', 'Subheader', '[{"title":"Item","description":"Desc"}]');

USE myappdb;
SELECT NOW();

-- Add new columns to carousel_insights table for the new dropdown structure
ALTER TABLE carousel_insights 
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS dropdowns JSON;

-- Verify the table structure
DESCRIBE carousel_insights;


-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user';

-- Make Harry Kane an admin
UPDATE users SET role = 'admin' WHERE email = 'HarryKane@test.test';

-- Verify it worked
SELECT id, name, email, role FROM users;


USE myappdb;
