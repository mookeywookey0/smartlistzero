const mongoose = require('mongoose');

const selectionSchema = new mongoose.Schema({
  agentIds: [String],
  smartListIds: [String],
});

module.exports = mongoose.model('Selection', selectionSchema);