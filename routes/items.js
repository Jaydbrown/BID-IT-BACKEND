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
 * GET /api/items - List all items with optional filters
 * GET /api/items/:id - Get single item by ID (MUST stay last)
 */
router.get('/', fetchItems);

/**
 * PROTECTED ROUTES
 * Require authentication middleware
 */
router.get('/my', protect, fetchMyItems); // GET /api/items/my - seller's own listings

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
 * DYNAMIC ROUTE (place LAST to avoid conflicts)
 * GET /api/items/:id - get single item by ID
 */
router.get('/:id', fetchItemById);

export default router;