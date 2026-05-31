const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  title: String,
  titleAr: String,
  season: { type: Number, required: true },
  episode: { type: Number, required: true },
  embedLinks: [String],
  thumbnail: String,
  duration: String,
  views: { type: Number, default: 0 },
  sourceUrl: String,
}, { timestamps: true });

episodeSchema.index({ series: 1, season: 1, episode: 1 }, { unique: true });

module.exports = mongoose.model('Episode', episodeSchema);
