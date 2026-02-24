const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    price:    { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Beverages', 'Snacks', 'Breakfast', 'Desserts', 'Meals', 'Other'],
      default: 'Other',
    },
    emoji:    { type: String, default: '🍽️' },
    active:   { type: Boolean, default: true },
    sortOrder:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('Product', productSchema);
