import asyncHandler from 'express-async-handler';
import * as ItemsModel from '../models/itemsModel.js';

const validateIdParam = (id) => {
  if (id === undefined || id === null) return false;
  const parsedId = Number(id);
  return !isNaN(parsedId) && Number.isInteger(parsedId) && parsedId > 0;
};

/**
 * GET /api/items
 * Fetch items with optional filters: is_auction, university, category, search
 */
export const fetchItems = asyncHandler(async (req, res) => {
  const { is_auction, university, category, search } = req.query;
  const filters = {
    is_auction,
    university: university?.trim(),
    category: category?.trim(),
    search: search?.trim(),
  };
  const items = await ItemsModel.searchItems(filters);
  res.json(items);
});

/**
 * GET /api/items/:id
 * Fetch single item by ID
 */
export const fetchItemById = asyncHandler(async (req, res) => {
  if (!validateIdParam(req.params.id)) {
    res.status(400);
    throw new Error('Invalid item ID');
  }
  const item = await ItemsModel.getItemWithSeller(req.params.id); // <-- updated
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  res.json(item);
});

/**
 * GET /api/items/my
 * Fetch items created by authenticated user (seller)
 */
export const fetchMyItems = asyncHandler(async (req, res) => {
  const items = await ItemsModel.getItemsBySellerWithUsername(req.user.id); // <-- updated
  res.json(items);
});

/**
 * POST /api/items
 * Add new item
 */
export const addItem = asyncHandler(async (req, res) => {
  const { title, description, starting_price, is_auction, category, auction_duration } = req.body;

  if (!title || !starting_price || !description || !category) {
    res.status(400);
    throw new Error('Title, price, description, and category are required.');
  }

  const university = req.user.institution;
  let auction_end_time = null;

  if (is_auction === 'true' || is_auction === true) {
    if (!auction_duration) {
      res.status(400);
      throw new Error('Auction duration must be specified for auction items.');
    }
    const now = new Date();
    switch (auction_duration) {
      case '2h':
        auction_end_time = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        break;
      case '1d':
        auction_end_time = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case '1.5d':
        auction_end_time = new Date(now.getTime() + 36 * 60 * 60 * 1000);
        break;
      default:
        res.status(400);
        throw new Error('Invalid auction duration. Allowed: 2h, 1d, 1.5d.');
    }
  }

  const newItem = await ItemsModel.createItem({
    seller_id: req.user.id,
    title,
    description,
    starting_price,
    is_auction: is_auction === 'true' || is_auction === true,
    auction_end_time,
    category,
    university,
    image_url: req.file ? `/uploads/${req.file.filename}` : null,
  });

  const itemWithSeller = await ItemsModel.getItemWithSeller(newItem.id); // <-- fetch with seller_username

  res.status(201).json(itemWithSeller);
});

/**
 * PATCH /api/items/:id
 * Edit existing item
 */
export const editItem = asyncHandler(async (req, res) => {
  if (!validateIdParam(req.params.id)) {
    res.status(400);
    throw new Error('Invalid item ID');
  }

  const item = await ItemsModel.getItemById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (item.seller_id !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to edit this item');
  }

  const { title, description, starting_price, is_auction, category, auction_duration } = req.body;

  if (!title || !starting_price || !description || !category) {
    res.status(400);
    throw new Error('Title, price, description, and category are required.');
  }

  const updateFields = {
    title,
    description,
    starting_price,
    is_auction: is_auction === 'true' || is_auction === true,
    category,
  };

  if (updateFields.is_auction && auction_duration) {
    const now = new Date();
    switch (auction_duration) {
      case '2h':
        updateFields.auction_end_time = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        break;
      case '1d':
        updateFields.auction_end_time = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case '1.5d':
        updateFields.auction_end_time = new Date(now.getTime() + 36 * 60 * 60 * 1000);
        break;
      default:
        res.status(400);
        throw new Error('Invalid auction duration. Allowed: 2h, 1d, 1.5d.');
    }
  }

  if (req.file) updateFields.image_url = `/uploads/${req.file.filename}`;

  const updatedItem = await ItemsModel.updateItem(req.params.id, updateFields);
  const itemWithSeller = await ItemsModel.getItemWithSeller(updatedItem.id); // fetch updated with seller_username

  res.json(itemWithSeller);
});

/**
 * DELETE /api/items/:id
 * Remove an item
 */
export const removeItem = asyncHandler(async (req, res) => {
  if (!validateIdParam(req.params.id)) {
    res.status(400);
    throw new Error('Invalid item ID');
  }

  const item = await ItemsModel.getItemById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }

  if (item.seller_id !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this item');
  }

  await ItemsModel.deleteItem(req.params.id);
  res.status(204).end();
});
