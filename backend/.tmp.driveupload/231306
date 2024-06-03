const mongoose = require('mongoose');

// Check if the model is already compiled
const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', new mongoose.Schema({
  date: { type: Date, required: true },
  agentId: { type: String, required: true },
  agentName: { type: String, required: true },
  smartListCounts: { type: Map, of: Number, required: true },
  total: { type: Number, required: true },
}));

module.exports = DailyLog;
