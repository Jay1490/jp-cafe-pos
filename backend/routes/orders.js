const router = require('express').Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// POST /api/orders — place new order
router.post('/', auth, async (req, res) => {
  try {
    const { items, subtotal, gstEnabled, gstRate, gst, total, note } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    // Recalculate totals server-side for integrity
    const calcSubtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const calcGst = gstEnabled ? Math.round(calcSubtotal * gstRate) / 100 : 0;
    const calcTotal = calcSubtotal + calcGst;

    const order = await Order.create({
      items: items.map(i => ({
        productId: i.productId || i._id,
        name: i.name,
        emoji: i.emoji,
        price: i.price,
        qty: i.qty,
        total: i.price * i.qty,
      })),
      subtotal: calcSubtotal,
      gstEnabled: !!gstEnabled,
      gstRate: gstRate || 0,
      gst: calcGst,
      total: calcTotal,
      note: note || '',
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/orders — list orders with filters
router.get('/', auth, async (req, res) => {
  try {
    const { date, from, to, page = 1, limit = 50 } = req.query;
    const filter = { status: { $ne: 'cancelled' } };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/summary — daily revenue grouped by date
router.get('/summary', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    const sinceDate = since.toISOString().split('T')[0];

    const summary = await Order.aggregate([
      { $match: { date: { $gte: sinceDate }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$date',
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.qty' } },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/today — today's stats
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const orders = await Order.find({ date: today, status: { $ne: 'cancelled' } });
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const items = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
    res.json({ success: true, data: { date: today, orders: orders.length, revenue, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
