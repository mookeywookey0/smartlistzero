// routes/columnOrder.js
const express = require('express');
const router = express.Router();
const ColumnOrder = require('../models/ColumnOrder');

router.post('/save-column-order', async (req, res) => {
  const { userId, order } = req.body;
  try {
    await ColumnOrder.findOneAndUpdate({ userId }, { order }, { upsert: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/get-column-order/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const columnOrder = await ColumnOrder.findOne({ userId });
    res.json(columnOrder ? columnOrder.order : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;