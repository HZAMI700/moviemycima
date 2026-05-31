const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  avatar: String,
  watchHistory: [{ movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }, watchedAt: Date }],
  bookmarks: [{
    item: { type: mongoose.Schema.Types.ObjectId, refPath: 'bookmarks.itemType' },
    itemType: { type: String, enum: ['Movie', 'Series'] },
  }],
  preferences: {
    language: { type: String, default: 'ar' },
    quality: { type: String, default: 'auto' },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
