const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: String,
  email: String,
  leadSource: String,
  picture: {
    original: String,
    "162x162": String,
    "60x60": String,
    "40x40": String,
    "30x30": String,
    "26x26": String
  }
});

const Person = mongoose.model('Person', personSchema);

module.exports = Person;
