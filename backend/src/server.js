const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required.');
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:3000',
  'http://localhost:3006',
  'https://www.gravoz.com',
  'https://admin.gravoz.com',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── Database ──────────────────────────────────────────────────────────────────
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅  Connected to MongoDB (gravoz)'))
  .catch((err) => console.error('❌  MongoDB connection error:', err));

// ── API Router ────────────────────────────────────────────────────────────────
const apiRouter = express.Router();

apiRouter.get('/', (_req, res) =>
  res.status(200).send('GRAVOZ Backend API is running successfully.')
);

apiRouter.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

apiRouter.use('/api/cart', require('./routes/cartRoutes'));
apiRouter.use('/api/wishlist', require('./routes/wishlistRoutes'));
apiRouter.use('/api/orders', require('./routes/orderRoutes'));
apiRouter.use('/api/coupons', require('./routes/couponRoutes'));
apiRouter.use('/api/reviews', require('./routes/reviewRoutes'));

// Mount on root, /gravoz, and /api
app.use('/', apiRouter);
app.use('/gravoz', apiRouter);

// ── Centralized Error Handling ────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ [Backend Error]:', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀  GRAVOZ backend running on port ${PORT}`)
);
