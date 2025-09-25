import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import itemsRoutes from './routes/items.js';
import bidsRoutes from './routes/bids.js';
import paymentsRoutes from './routes/payments.js';

dotenv.config();

const app = express();

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Allowed frontend origins (adjust as needed)
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://bid-bit.netlify.app',
  'https://bid-it-frontend-t5wk-mj54qaeu1-jaydbrowns-projects.vercel.app'
];

// Helmet with relaxed CSP for images + frontend communication
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://127.0.0.1:5500", "http://localhost:5500"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "http://127.0.0.1:5500", "http://localhost:5500"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Global CORS config for API
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// Serve /uploads statically with CORS
app.use('/uploads', 
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Blocked image request from origin: ${origin}`));
    },
    credentials: true,
  }),
  (req, res, next) => {
    // Override helmet's resource policy headers just for image responses
    res.removeHeader('Cross-Origin-Resource-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
    next();
  },
  express.static(join(__dirname, 'uploads'))
);

app.get('/', (req, res) => {
  res.json({ message: 'API is running ' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/bids', bidsRoutes);
app.use('/api/payments', paymentsRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack || err.message);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} on port ${PORT}`)
);





