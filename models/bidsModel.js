import pool from '../utils/db.js';

export const getBidsByItemId = async (itemId) => {
  const { rows } = await pool.query(
    `SELECT bids.*, users.username FROM bids 
     JOIN users ON bids.bidder_id = users.id
     WHERE item_id = $1 ORDER BY bid_time DESC`,
    [itemId]
  );
  return rows;
};

export const createBid = async ({ item_id, bidder_id, amount }) => {
  const query = `
    INSERT INTO bids (item_id, bidder_id, amount)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const values = [item_id, bidder_id, amount];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getHighestBidForItem = async (itemId) => {
  const { rows } = await pool.query(
    `SELECT MAX(amount) as max_amount FROM bids WHERE item_id = $1`,
    [itemId]
  );
  return rows[0].max_amount;
};

export const getUserBidCount = async (bidder_id) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM bids WHERE bidder_id = $1`,
    [bidder_id]
  );
  return parseInt(rows[0].count, 10);
};