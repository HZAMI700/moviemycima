const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
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
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  seasons: { type: Number, default: 1 },
  episodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Episode' }],
  status: { type: String, enum: ['ongoing', 'completed', 'canceled'], default: 'ongoing' },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  sourceUrl: String,
  sourceId: String,
}, { timestamps: true });

seriesSchema.index({ title: 'text', titleAr: 'text', description: 'text' });
seriesSchema.index({ rating: -1, views: -1 });

module.exports = mongoose.model('Series', seriesSchema);
