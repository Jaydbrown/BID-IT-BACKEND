import pool from '../utils/db.js';

// Create new user
export const createUser = async (username, email, passwordHash, institution) => {
  const query = `
    INSERT INTO users (username, email, password_hash, institution)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, email, institution, created_at
  `;
  const values = [username, email, passwordHash, institution];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Find user by email
export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
};

// Find user by ID
export const findUserById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, username, email, institution FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
};

// Update user details
export const updateUserById = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.username) {
    fields.push(`username = $${idx++}`);
    values.push(data.username);
  }
  if (data.email) {
    fields.push(`email = $${idx++}`);
    values.push(data.email);
  }
  if (data.institution) {
    fields.push(`institution = $${idx++}`);
    values.push(data.institution);
  }

  if (fields.length === 0) return null;

  values.push(id);

  const query = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING id, username, email, institution, created_at
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Delete user
export const deleteUserById = async (id) => {
  const { rows } = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id]
  );
  return rows.length > 0;
};

// Get items sold count
export const getItemsSoldCountByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM items WHERE seller_id = $1 AND is_sold = true',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

// Get balance for user
export const getBalanceByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT balance FROM users WHERE id = $1',
    [userId]
  );
  return parseFloat(result.rows[0]?.balance || 0);
};

// -------------------------------
// Password Reset Related Methods
// -------------------------------

// 1️⃣ Store reset token + expiry
export const updateUserPasswordResetToken = async (userId, token, expiresAt) => {
  const query = `
    UPDATE users
    SET password_reset_token = $1,
        password_reset_expires = $2
    WHERE id = $3
  `;
  const values = [token, expiresAt, userId];
  await pool.query(query, values);
};

// 2️⃣ Find user by reset token (checking expiry too)
export const findUserByResetToken = async (token) => {
  const query = `
    SELECT * FROM users
    WHERE password_reset_token = $1
      AND password_reset_expires > NOW()
  `;
  const { rows } = await pool.query(query, [token]);
  return rows[0];
};

// 3️⃣ Update password (and clear token after use)
export const updateUserPassword = async (userId, newHashedPassword) => {
  const query = `
    UPDATE users
    SET password_hash = $1,
        password_reset_token = NULL,
        password_reset_expires = NULL
    WHERE id = $2
  `;
  await pool.query(query, [newHashedPassword, userId]);
};
