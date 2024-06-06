const mongoose = require('mongoose');
const DailyLog = require('../models/DailyLog');
const path = require('path'); // Add path module

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/slz-app';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');
  await clearDailyLogs();
  mongoose.disconnect();
})
.catch(err => console.error('MongoDB connection error:', err));

const clearDailyLogs = async () => {
  try {
    await DailyLog.deleteMany({});
    console.log('Cleared all daily logs');
  } catch (error) {
    console.error(`Error clearing daily logs: ${error.message}`);
  }
};
