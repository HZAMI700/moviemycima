const { Movie, Series, Episode, User, Comment, Genre, Actor } = require('../models');

exports.getDashboard = async (req, res, next) => {
  try {
    const [totalMovies, totalSeries, totalEpisodes, totalUsers, totalComments, recentMovies, recentUsers] = await Promise.all([
      Movie.countDocuments(),
      Series.countDocuments(),
      Episode.countDocuments(),
      User.countDocuments(),
      Comment.countDocuments(),
      Movie.find().sort('-createdAt').limit(5).select('title titleAr views rating'),
      User.find().sort('-createdAt').limit(5).select('name email createdAt'),
    ]);

    res.json({
      stats: { totalMovies, totalSeries, totalEpisodes, totalUsers, totalComments },
      recentMovies,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const dailyViews = await Movie.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: '$views' } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    const genreDistribution = await Genre.aggregate([
      { $lookup: { from: 'movies', localField: '_id', foreignField: 'genres', as: 'movies' } },
      { $project: { name: 1, nameAr: 1, count: { $size: '$movies' } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ dailyViews, genreDistribution });
  } catch (error) {
    next(error);
  }
};
