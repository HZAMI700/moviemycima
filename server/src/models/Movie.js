const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  titleAr: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  descriptionAr: String,
  poster: String,
  thumbnail: String,
  trailer: String,
  rating: { type: Number, default: 0, min: 0, max: 10 },
  year: { type: Number, index: true },
  duration: String,
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  embedLinks: [String],
  quality: String,
  language: String,
  country: String,
  imdbId: String,
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  sourceUrl: String,
  sourceId: String,
}, { timestamps: true });

movieSchema.index({ title: 'text', titleAr: 'text', description: 'text' });
movieSchema.index({ rating: -1, views: -1 });

module.exports = mongoose.model('Movie', movieSchema);
