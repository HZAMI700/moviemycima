const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ['Movie', 'Series', 'Episode'], required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  lastWatched: { type: Date, default: Date.now },
}, { timestamps: true });

watchHistorySchema.index({ user: 1, lastWatched: -1 });
watchHistorySchema.index({ user: 1, itemId: 1, itemType: 1 }, { unique: true });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
