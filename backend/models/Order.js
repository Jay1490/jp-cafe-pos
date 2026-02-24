const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:      { type: String, required: true },
    emoji:     { type: String, default: '🍽️' },
    price:     { type: Number, required: true },
    qty:       { type: Number, required: true, min: 1 },
    total:     { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    billNo:     { type: String, unique: true },
    items:      [orderItemSchema],
    subtotal:   { type: Number, required: true },
    gstEnabled: { type: Boolean, default: false },
    gstRate:    { type: Number, default: 0 },
    gst:        { type: Number, default: 0 },
    total:      { type: Number, required: true },
    note:       { type: String, default: '' },
    status:     { type: String, enum: ['completed', 'cancelled', 'refunded'], default: 'completed' },
    date:       { type: String },  // YYYY-MM-DD for easy date filtering
  },
  { timestamps: true }
);

// Auto-generate bill number before saving
orderSchema.pre('save', async function (next) {
  if (!this.billNo) {
    const count = await mongoose.model('Order').countDocuments();
    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    this.billNo = `JC${yymmdd}${String(count + 1).padStart(4, '0')}`;
  }
  if (!this.date) {
    this.date = new Date().toISOString().split('T')[0];
  }
  next();
});

orderSchema.index({ date: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
