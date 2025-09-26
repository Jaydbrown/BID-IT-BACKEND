import express from 'express';
import {
  fetchItems,
  fetchItemById,
  addItem,
  editItem,
  removeItem,
  fetchMyItems,
} from '../controllers/itemsController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * PUBLIC ROUTES
 */
router.get('/', fetchItems); // GET /api/items - List all items with optional filters

/**
 * PROTECTED ROUTES
 * Require authentication middleware
 */
router.get('/my', protect, fetchMyItems); // GET /api/items/my - seller's own listings (MUST come before /:id)

router.post(
  '/',
  protect,
  upload.single('image'),
  addItem
); // POST /api/items - create new item

router.patch(
  '/:id',
  protect,
  upload.single('image'),
  editItem
); // PATCH /api/items/:id - update existing item

router.delete(
  '/:id',
  protect,
  removeItem
); // DELETE /api/items/:id - delete item

/**
 * DYNAMIC ROUTE (MUST be LAST to avoid conflicts)
 * This catches any GET request that doesn't match the specific routes above
 */
router.get('/:id', fetchItemById); // GET /api/items/:id - get single item by ID

export default router;
