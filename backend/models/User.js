const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  timeZone: { type: String, default: 'UTC' }, // Store the user's time zone
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
