const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/auth',     require('./routes/auth'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000,  // 10 seconds to find server
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  // These options help bypass ISP/firewall issues
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  // Use direct SRV - helps with some DNS issues
  retryWrites: true,
  w: 'majority',
};

console.log('\n☕ Jay Café POS - Starting...');
console.log('📡 Connecting to MongoDB Atlas...');
console.log('   URI:', process.env.MONGODB_URI?.replace(/:([^@]+)@/, ':****@') || 'NOT SET ❌');

mongoose
  .connect(process.env.MONGODB_URI, MONGO_OPTIONS)
  .then(async () => {
    console.log('✅ MongoDB connected successfully!\n');

    // Seed default settings if none exist
    const Settings = require('./models/Settings');
    const existing = await Settings.findOne();
    if (!existing) {
      await Settings.create({
        cafeName: 'JAY CAFÉ',
        address: 'Near Main Square, City',
        phone: '+91 98765 43210',
        tagline: 'Sip. Smile. Repeat.',
        gstEnabled: true,
        gstRate: 5,
        paperWidth: '58mm',
        ownerPin: '1234',
      });
      console.log('✅ Default settings seeded');
    }

    // Seed default products if none exist
    const Product = require('./models/Product');
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany([
        { name: 'Masala Tea',     price: 20, category: 'Beverages', emoji: '🍵', active: true },
        { name: 'Black Coffee',   price: 30, category: 'Beverages', emoji: '☕', active: true },
        { name: 'Cold Coffee',    price: 60, category: 'Beverages', emoji: '🥤', active: true },
        { name: 'Lemon Soda',     price: 25, category: 'Beverages', emoji: '🍋', active: true },
        { name: 'Lassi',          price: 45, category: 'Beverages', emoji: '🥛', active: true },
        { name: 'Veg Sandwich',   price: 50, category: 'Snacks',    emoji: '🥪', active: true },
        { name: 'Veg Burger',     price: 70, category: 'Snacks',    emoji: '🍔', active: true },
        { name: 'French Fries',   price: 60, category: 'Snacks',    emoji: '🍟', active: true },
        { name: 'Samosa',         price: 15, category: 'Snacks',    emoji: '🥟', active: true },
        { name: 'Maggi',          price: 50, category: 'Snacks',    emoji: '🍜', active: true },
        { name: 'Veg Wrap',       price: 65, category: 'Snacks',    emoji: '🌯', active: true },
        { name: 'Poha',           price: 40, category: 'Breakfast', emoji: '🍚', active: true },
        { name: 'Upma',           price: 40, category: 'Breakfast', emoji: '🍛', active: true },
        { name: 'Bread Butter',   price: 25, category: 'Breakfast', emoji: '🍞', active: true },
        { name: 'Aloo Paratha',   price: 55, category: 'Breakfast', emoji: '🫓', active: true },
        { name: 'Chocolate Cake', price: 80, category: 'Desserts',  emoji: '🎂', active: true },
      ]);
      console.log('✅ Default products seeded (16 items)');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch((err) => {
    console.error('\n❌ MongoDB connection FAILED!');
    console.error('Error:', err.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Run: node debug-mongo.js  ← to find exact cause');
    console.error('2. Check Atlas cluster is not PAUSED (atlas.mongodb.com)');
    console.error('3. Check Network Access has 0.0.0.0/0 whitelisted');
    console.error('4. Try mobile hotspot instead of WiFi');
    console.error('5. Check .env has correct MONGODB_URI\n');
    process.exit(1);
  });
