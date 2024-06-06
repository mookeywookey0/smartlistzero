const mongoose = require('mongoose');

const dailySnapshotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  agentId: { type: String, required: true },
  agentName: { type: String, required: true },
  // Dynamically adding smart lists fields
}, { strict: false });

module.exports = mongoose.model('DailySnapshot', dailySnapshotSchema);
