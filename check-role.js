import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { ca: fs.readFileSync(process.env.DB_SSL_CA) }
});

async function checkAndAddRole() {
  try {
    const connection = await pool.getConnection();
    
    // Check current table structure
    console.log('\n📋 Current users table structure:');
    const [describe] = await connection.query('DESCRIBE users');
    console.table(describe);
    
    // Check if role column exists
    const roleExists = describe.some(col => col.Field === 'role');
    
    if (roleExists) {
      console.log('\n✅ Role column already exists!');
    } else {
      console.log('\n⚠️  Role column does not exist. Adding now...');
      
      // Add the role column with proper quoting
      await connection.query("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
      console.log('✅ Role column added successfully!');
      
      // Update Harry Kane to admin
      const [result] = await connection.query(
        'UPDATE users SET role = ? WHERE email = ?',
        ['admin', 'HarryKane@test.test']
      );
      console.log(`✅ Updated ${result.affectedRows} user(s) to admin role`);
    }
    
    // Show all users with their roles
    console.log('\n👥 All users:');
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.table(users);
    
    connection.release();
    pool.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAndAddRole();
