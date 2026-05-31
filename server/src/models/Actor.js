const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: String,
  bio: String,
  bioAr: String,
  birthDate: Date,
  nationality: String,
  sourceUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Actor', actorSchema);
