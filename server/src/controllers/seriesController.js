const { Series, Episode, Comment } = require('../models');
const cache = require('../services/cacheService');

exports.getSeriesList = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, genre, sort = '-createdAt' } = req.query;
    const query = {};
    if (genre) query.genres = genre;

    const cacheKey = `series:${JSON.stringify({ page, limit, genre, sort })}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const series = await Series.find(query)
      .populate('genres', 'name nameAr slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Series.countDocuments(query);
    const result = { series, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSeries = async (req, res, next) => {
  try {
    const series = await Series.findById(req.params.id)
      .populate('genres')
      .populate('actors');
    if (!series) return res.status(404).json({ message: 'Series not found' });

    const episodes = await Episode.find({ series: series._id }).sort('season episode');
    await Series.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ ...series.toObject(), episodes });
  } catch (error) {
    next(error);
  }
};

exports.getSeriesBySlug = async (req, res, next) => {
  try {
    const series = await Series.findOne({ slug: req.params.slug })
      .populate('genres')
      .populate('actors');
    if (!series) return res.status(404).json({ message: 'Series not found' });

    const episodes = await Episode.find({ series: series._id }).sort('season episode');
    await Series.findByIdAndUpdate(series._id, { $inc: { views: 1 } });
    res.json({ ...series.toObject(), episodes });
  } catch (error) {
    next(error);
  }
};

exports.getLatestSeries = async (req, res, next) => {
  try {
    const cacheKey = 'series:latest';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const series = await Series.find()
      .populate('genres', 'name nameAr')
      .sort('-createdAt')
      .limit(20);

    await cache.set(cacheKey, series, 300);
    res.json(series);
  } catch (error) {
    next(error);
  }
};

exports.getTrendingSeries = async (req, res, next) => {
  try {
    const cacheKey = 'series:trending';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const series = await Series.find().sort('-views').limit(20);
    await cache.set(cacheKey, series, 300);
    res.json(series);
  } catch (error) {
    next(error);
  }
};

exports.createSeries = async (req, res, next) => {
  try {
    const slug = req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const series = await Series.create({ ...req.body, slug });
    await cache.delByPattern('series:*');
    res.status(201).json(series);
  } catch (error) {
    next(error);
  }
};

exports.updateSeries = async (req, res, next) => {
  try {
    const series = await Series.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!series) return res.status(404).json({ message: 'Series not found' });
    await cache.delByPattern('series:*');
    res.json(series);
  } catch (error) {
    next(error);
  }
};

exports.deleteSeries = async (req, res, next) => {
  try {
    const series = await Series.findByIdAndDelete(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });
    await Episode.deleteMany({ series: req.params.id });
    await Comment.deleteMany({ itemId: req.params.id });
    await cache.delByPattern('series:*');
    res.json({ message: 'Series deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getEpisodes = async (req, res, next) => {
  try {
    const episodes = await Episode.find({ series: req.params.id }).sort('season episode');
    res.json(episodes);
  } catch (error) {
    next(error);
  }
};

exports.getEpisode = async (req, res, next) => {
  try {
    const episode = await Episode.findById(req.params.episodeId);
    if (!episode) return res.status(404).json({ message: 'Episode not found' });
    await Episode.findByIdAndUpdate(req.params.episodeId, { $inc: { views: 1 } });
    res.json(episode);
  } catch (error) {
    next(error);
  }
};
