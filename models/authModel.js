// backend/models/authModel.js
const pool = require('../utils/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 * @param {Object} userData - { username, email, password, university }
 * @returns {Object} newly created user info (without password)
 */
async function registerUser({ username, email, password, university }) {
  // Check if username or email already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error('Username or email already taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, university)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, university`,
    [username, email, hashedPassword, university]
  );

  return result.rows[0];
}

/**
 * Fetch a user by email (for login)
 * @param {string} email
 * @returns {Object|null} user data with password_hash for verification
 */
async function getUserByEmail(email) {
  const result = await pool.query(
    'SELECT id, username, email, password_hash, university FROM users WHERE email = $1',
    [email]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

/**
 * Verify user password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {boolean}
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  registerUser,
  getUserByEmail,
  verifyPassword,
};
