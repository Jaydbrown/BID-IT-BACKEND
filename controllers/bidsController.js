import { 
  getBidsByItemId, 
  createBid, 
  getHighestBidForItem, 
  getUserBidCount 
} from '../models/bidsModel.js';
import { getItemById } from '../models/itemsModel.js';

export const placeBid = async (req, res, next) => {
  try {
    const { item_id, amount } = req.body;
    const bidder_id = req.user.id;

    if (!item_id || amount === undefined) {
      res.status(400);
      throw new Error('item_id and amount are required.');
    }

    const item = await getItemById(item_id);
    if (!item) {
      res.status(404);
      throw new Error('Item not found.');
    }

    if (!item.is_auction) {
      res.status(400);
      throw new Error('This item is not up for auction.');
    }

    if (amount <= 0) {
      res.status(400);
      throw new Error('Bid amount must be positive.');
    }

    const highestBid = await getHighestBidForItem(item_id);
    const minAcceptableBid = highestBid !== null
      ? highestBid + 1
      : item.starting_price;

    if (amount < minAcceptableBid) {
      res.status(400);
      throw new Error(
        `Your bid must be at least ₦${minAcceptableBid.toLocaleString()}`
      );
    }

    const newBid = await createBid({ item_id, bidder_id, amount });

    res.status(201).json(newBid);
  } catch (error) {
    next(error);
  }
};

export const getBidsForItem = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const item = await getItemById(itemId);
    if (!item) {
      res.status(404);
      throw new Error('Item not found.');
    }

    const bids = await getBidsByItemId(itemId);
    res.json(bids);
  } catch (error) {
    next(error);
  }
};

export const getMyBidCount = async (req, res, next) => {
  try {
    const bidder_id = req.user.id;
    const count = await getUserBidCount(bidder_id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};
