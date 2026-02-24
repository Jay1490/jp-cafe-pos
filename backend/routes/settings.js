const router = require('express').Router();
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');

// GET /api/settings — public fields only (for bill header etc.)
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne().select('-ownerPin -__v');
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/settings/full — all fields (auth required)
router.get('/full', auth, async (req, res) => {
  try {
    const settings = await Settings.findOne().select('-__v');
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/settings — update settings
router.put('/', auth, async (req, res) => {
  try {
    const allowed = ['cafeName', 'address', 'phone', 'tagline', 'gstEnabled', 'gstRate', 'paperWidth', 'ownerPin'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    ).select('-__v');

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
