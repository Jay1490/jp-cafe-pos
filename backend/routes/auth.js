const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Settings = require('../models/Settings');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'PIN required' });

    const settings = await Settings.findOne();
    if (!settings) return res.status(500).json({ success: false, message: 'Settings not configured' });

    if (pin !== settings.ownerPin) {
      return res.status(401).json({ success: false, message: 'Wrong PIN' });
    }

    const token = jwt.sign(
      { role: 'owner', cafeId: settings._id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      expiresIn: 12 * 60 * 60 * 1000, // ms
      cafeName: settings.cafeName,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ valid: false });
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
