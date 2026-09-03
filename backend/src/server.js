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

// ── API Router ────────────────────────────────────────────────────────────────
const apiRouter = express.Router();

apiRouter.get('/', (_req, res) =>
  res.status(200).send('GRAVOZ Backend API is running successfully.')
);

apiRouter.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

apiRouter.use('/api/cart',     require('./routes/cartRoutes'));
apiRouter.use('/api/wishlist', require('./routes/wishlistRoutes'));
apiRouter.use('/api/orders',   require('./routes/orderRoutes'));
apiRouter.use('/api/coupons',  require('./routes/couponRoutes'));
apiRouter.use('/api/reviews',  require('./routes/reviewRoutes'));

// Mount on root, /gravoz, and /api
app.use('/', apiRouter);
app.use('/gravoz', apiRouter);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀  GRAVOZ backend running on port ${PORT}`)
);
