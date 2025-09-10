import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getMyStats
} from '../controllers/usersController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protect all routes below this middleware
router.use(protect);

/**
 * Authenticated user routes (current user "me")
 */
router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.delete('/me', deleteMyAccount);
router.get('/me/stats', getMyStats);   // <-- NEW ROUTE for dynamic stats

/**
 * Admin/general user routes (by ID)
 */
router.get('/:id', getUserProfile);
router.patch('/:id', updateUserProfile);
router.delete('/:id', deleteUserAccount);

export default router;
