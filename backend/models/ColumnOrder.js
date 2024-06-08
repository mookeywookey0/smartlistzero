// models/ColumnOrder.js
const mongoose = require('mongoose');

const columnOrderSchema = new mongoose.Schema({
  userId: String,
  order: [String],
});

module.exports = mongoose.model('ColumnOrder', columnOrderSchema);