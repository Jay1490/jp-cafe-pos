const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const settingsSchema = new mongoose.Schema(
  {
    cafeName:   { type: String, default: 'JAY CAFÉ' },
    address:    { type: String, default: '' },
    phone:      { type: String, default: '' },
    tagline:    { type: String, default: 'Sip. Smile. Repeat.' },
    gstEnabled: { type: Boolean, default: true },
    gstRate:    { type: Number, default: 5 },
    paperWidth: { type: String, enum: ['58mm', '80mm'], default: '58mm' },
    ownerPin:   { type: String, default: '1234' },  // stored as plain, hashed on verify
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
