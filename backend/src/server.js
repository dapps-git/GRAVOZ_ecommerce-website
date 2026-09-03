const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gravoz';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Database ──────────────────────────────────────────────────────────────────
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅  Connected to MongoDB (gravoz)'))
  .catch((err) => console.error('❌  MongoDB connection error:', err));

// ── Root & Health Check for cPanel Passenger ────────────────────────────────
app.get('/', (_req, res) =>
  res.status(200).send('GRAVOZ Backend API is running successfully.')
);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/coupons',  require('./routes/couponRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀  GRAVOZ backend running on port ${PORT}`)
);
