import {
  findUserById,
  updateUserById,
  deleteUserById,
} from '../models/usersModel.js';

import {
  getItemsSoldCountByUserId,
  getBalanceByUserId,
} from '../models/itemsModel.js'; // ✅ FIX: Import from itemsModel!

/**
 * GET /api/users/me
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // AuthMiddleware attaches user info
    const user = await findUserById(userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const itemsSoldCount = await getItemsSoldCountByUserId(userId);
    const balance = await getBalanceByUserId(userId);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      institution: user.institution,
      created_at: user.created_at,
      itemsSold: itemsSoldCount,
      balance: balance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/me
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, institution } = req.body;

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400);
      throw new Error('Invalid email format');
    }

    const updatedUser = await updateUserById(userId, { username, email, institution });
    if (!updatedUser) {
      res.status(404);
      throw new Error('User not found or no changes made');
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me
 */
export const deleteMyAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deleted = await deleteUserById(userId);

    if (!deleted) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400);
      throw new Error('Invalid user ID');
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      institution: user.institution,
      created_at: user.created_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400);
      throw new Error('Invalid user ID');
    }

    const { username, email, institution } = req.body;

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400);
      throw new Error('Invalid email format');
    }

    const updatedUser = await updateUserById(userId, { username, email, institution });
    if (!updatedUser) {
      res.status(404);
      throw new Error('User not found or no changes made');
    }

    res.json({
      message: 'User profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 */
export const deleteUserAccount = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400);
      throw new Error('Invalid user ID');
    }

    const deleted = await deleteUserById(userId);
    if (!deleted) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/stats
 */
export const getMyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const itemsSoldCount = await getItemsSoldCountByUserId(userId);
    const balance = await getBalanceByUserId(userId);

    res.json({
      itemsSold: itemsSoldCount,
      balance: balance,
    });
  } catch (error) {
    next(error);
  }
};
