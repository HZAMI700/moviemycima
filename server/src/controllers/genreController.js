const { Genre } = require('../models');
const cache = require('../services/cacheService');

exports.getGenres = async (req, res, next) => {
  try {
    const cacheKey = 'genres:all';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const genres = await Genre.find().sort('name');
    await cache.set(cacheKey, genres, 3600);
    res.json(genres);
  } catch (error) {
    next(error);
  }
};

exports.getGenre = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).json({ message: 'Genre not found' });
    res.json(genre);
  } catch (error) {
    next(error);
  }
};

exports.getGenreBySlug = async (req, res, next) => {
  try {
    const genre = await Genre.findOne({ slug: req.params.slug });
    if (!genre) return res.status(404).json({ message: 'Genre not found' });
    res.json(genre);
  } catch (error) {
    next(error);
  }
};

exports.createGenre = async (req, res, next) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const genre = await Genre.create({ ...req.body, slug });
    await cache.del('genres:all');
    res.status(201).json(genre);
  } catch (error) {
    next(error);
  }
};

exports.updateGenre = async (req, res, next) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!genre) return res.status(404).json({ message: 'Genre not found' });
    await cache.del('genres:all');
    res.json(genre);
  } catch (error) {
    next(error);
  }
};

exports.deleteGenre = async (req, res, next) => {
  try {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) return res.status(404).json({ message: 'Genre not found' });
    await cache.del('genres:all');
    res.json({ message: 'Genre deleted' });
  } catch (error) {
    next(error);
  }
};
