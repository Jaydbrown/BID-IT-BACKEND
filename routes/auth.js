import express from 'express';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);          // NEW: request password reset
router.post('/reset-password/:token', resetPassword);     // NEW: perform password reset

export default router;
