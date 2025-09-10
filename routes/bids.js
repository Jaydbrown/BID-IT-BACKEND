import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { placeBid, getBidsForItem, getMyBidCount } from '../controllers/bidsController.js';

const router = express.Router();

router.post('/', protect, placeBid);
router.get('/item/:itemId', getBidsForItem);
router.get('/my-count', protect, getMyBidCount);  // <-- This route

export default router;