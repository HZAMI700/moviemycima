const { User, WatchHistory, Movie, Series } = require('../models');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find().sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments();
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

exports.addBookmark = async (req, res, next) => {
  try {
    const { itemId, itemType } = req.body;
    const user = await User.findById(req.user._id);
    const exists = user.bookmarks.find(b => b.item.toString() === itemId && b.itemType === itemType);
    if (exists) return res.status(409).json({ message: 'Already bookmarked' });
    user.bookmarks.push({ item: itemId, itemType });
    await user.save();
    res.json(user.bookmarks);
  } catch (error) {
    next(error);
  }
};

exports.removeBookmark = async (req, res, next) => {
  try {
    const { itemId, itemType } = req.body;
    const user = await User.findById(req.user._id);
    user.bookmarks = user.bookmarks.filter(b => !(b.item.toString() === itemId && b.itemType === itemType));
    await user.save();
    res.json(user.bookmarks);
  } catch (error) {
    next(error);
  }
};

exports.getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks.item',
      select: 'title titleAr poster slug rating year',
    });
    res.json(user.bookmarks);
  } catch (error) {
    next(error);
  }
};

exports.getWatchHistory = async (req, res, next) => {
  try {
    const history = await WatchHistory.find({ user: req.user._id })
      .sort('-lastWatched')
      .limit(30)
      .populate('itemId', 'title titleAr poster slug');
    res.json(history);
  } catch (error) {
    next(error);
  }
};

exports.updateWatchHistory = async (req, res, next) => {
  try {
    const { itemId, itemType, progress } = req.body;
    const entry = await WatchHistory.findOneAndUpdate(
      { user: req.user._id, itemId, itemType },
      { progress, lastWatched: new Date(), completed: progress >= 95 },
      { upsert: true, new: true },
    );
    res.json(entry);
  } catch (error) {
    next(error);
  }
};
