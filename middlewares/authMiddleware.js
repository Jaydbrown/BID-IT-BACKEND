import jwt from 'jsonwebtoken';
import pool from '../utils/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { rows } = await pool.query(
        'SELECT id, username, email FROM users WHERE id = $1', 
        [decoded.id]
      );

      if (!rows[0]) {
        return res.status(401).json({ message: 'User not found, unauthorized' });
      }

      req.user = rows[0]; // attach user info to request
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'No token, authorization denied' });
};