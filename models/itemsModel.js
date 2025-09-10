import pool from '../utils/db.js';

/**
 * Fetch all items (for admin or open marketplace).
 */
export const getAllItems = async () => {
  const { rows } = await pool.query(
    `SELECT items.*, users.username AS seller_username
     FROM items
     LEFT JOIN users ON items.seller_id = users.id
     ORDER BY items.created_at DESC`
  );
  return rows;
};

/**
 * Fetch all items listed by a specific seller.
 */
export const getItemsBySeller = async (sellerId) => {
  const { rows } = await pool.query(
    `SELECT items.*, users.username AS seller_username
     FROM items
     LEFT JOIN users ON items.seller_id = users.id
     WHERE items.seller_id = $1
     ORDER BY items.created_at DESC`,
    [sellerId]
  );
  return rows;
};

/**
 * Fetch a single item by ID, with seller username and institution.
 */
export const getItemById = async (id) => {
  const { rows } = await pool.query(
    `SELECT items.*, users.username AS seller_username, users.institution AS seller_institution
     FROM items
     LEFT JOIN users ON items.seller_id = users.id
     WHERE items.id = $1`,
    [id]
  );
  return rows[0];
};

/**
 * Search items with filters:
 * - is_auction: boolean string ('true'/'false')
 * - university: seller's institution (partial, case-insensitive)
 * - category: item category (partial, case-insensitive)
 * - search: keyword in title or description (partial, case-insensitive)
 */
export const searchItems = async ({ is_auction, university, category, search }) => {
  const queryConditions = [];
  const params = [];
  let idx = 1;

  if (is_auction !== undefined) {
    queryConditions.push(`items.is_auction = $${idx++}`);
    params.push(is_auction.toString().toLowerCase() === 'true');
  }

  if (university) {
    queryConditions.push(`items.university ILIKE $${idx++}`);
    params.push(`%${university.trim()}%`);
  }

  if (category) {
    queryConditions.push(`items.category ILIKE $${idx++}`);
    params.push(`%${category.trim()}%`);
  }

  if (search) {
    queryConditions.push(`(items.title ILIKE $${idx} OR items.description ILIKE $${idx})`);
    params.push(`%${search.trim()}%`);
    idx++;
  }

  let query = `
    SELECT items.*, users.username AS seller_username
    FROM items
    LEFT JOIN users ON items.seller_id = users.id
  `;

  if (queryConditions.length > 0) {
    query += ' WHERE ' + queryConditions.join(' AND ');
  }

  query += ' ORDER BY items.created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * Create a new item. Automatically fetches the seller's university from users table.
 */
export const createItem = async ({
  seller_id,
  title,
  description,
  starting_price,
  is_auction,
  auction_end_time,
  category,
  image_url,
}) => {
  // Fetch seller's institution from users table
  const { rows: sellerRows } = await pool.query(
    'SELECT institution FROM users WHERE id = $1',
    [seller_id]
  );
  const sellerUniversity = sellerRows[0]?.institution || null;

  const query = `
    INSERT INTO items (
      seller_id, title, description, starting_price,
      is_auction, auction_end_time, category, image_url, sold, final_price, university
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NULL, $9)
    RETURNING *
  `;
  const values = [
    seller_id,
    title,
    description,
    starting_price,
    is_auction,
    auction_end_time,
    category,
    image_url,
    sellerUniversity,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Update item fields dynamically by ID.
 */
export const updateItem = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx++}`);
    values.push(data[key]);
  }

  values.push(id);
  const query = `UPDATE items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Delete an item by ID.
 */
export const deleteItem = async (id) => {
  await pool.query('DELETE FROM items WHERE id = $1', [id]);
};

/**
 * Count items sold by a seller.
 */
export const getItemsSoldCountByUserId = async (sellerId) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS sold_count FROM items WHERE seller_id = $1 AND sold = TRUE',
    [sellerId]
  );
  return parseInt(rows[0].sold_count, 10) || 0;
};

/**
 * Sum total earnings from sold items by seller.
 */
export const getBalanceByUserId = async (sellerId) => {
  const { rows } = await pool.query(
    'SELECT COALESCE(SUM(final_price), 0) AS total_earnings FROM items WHERE seller_id = $1 AND sold = TRUE',
    [sellerId]
  );
  return parseFloat(rows[0].total_earnings) || 0;
};

export const getItemWithSeller = async (id) => {
  const { rows } = await pool.query(`
    SELECT items.*, users.username AS seller_username
    FROM items
    LEFT JOIN users ON items.seller_id = users.id
    WHERE items.id = $1
  `, [id]);
  return rows[0];
};

export const getItemsBySellerWithUsername = async (sellerId) => {
  const { rows } = await pool.query(`
    SELECT items.*, users.username AS seller_username
    FROM items
    LEFT JOIN users ON items.seller_id = users.id
    WHERE items.seller_id = $1
    ORDER BY items.created_at DESC
  `, [sellerId]);
  return rows;
};