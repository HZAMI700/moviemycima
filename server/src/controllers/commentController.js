const { Comment } = require('../models');

exports.getComments = async (req, res, next) => {
  try {
    const { itemId, itemType, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (itemId) query.itemId = itemId;
    if (itemType) query.itemType = itemType;

    const comments = await Comment.find(query)
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);
    res.json({ comments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({ ...req.body, user: req.user._id });
    const populated = await comment.populate('user', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const idx = comment.likes.indexOf(req.user._id);
    if (idx > -1) comment.likes.splice(idx, 1);
    else comment.likes.push(req.user._id);
    await comment.save();
    res.json(comment);
  } catch (error) {
    next(error);
  }
};
