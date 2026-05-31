const { Movie, Genre, Actor, Comment } = require('../models');
const cache = require('../services/cacheService');

exports.getMovies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, genre, year, sort = '-createdAt', search } = req.query;
    const query = { status: 'active' };

    if (genre) query.genres = genre;
    if (year) query.year = parseInt(year);
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleAr: { $regex: search, $options: 'i' } },
      ];
    }

    const cacheKey = `movies:${JSON.stringify({ page, limit, genre, year, sort, search })}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const movies = await Movie.find(query)
      .populate('genres', 'name nameAr slug')
      .populate('actors', 'name nameAr image')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments(query);

    const result = { movies, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getMovie = async (req, res, next) => {
  try {
    const cacheKey = `movie:${req.params.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const movie = await Movie.findById(req.params.id)
      .populate('genres')
      .populate('actors');
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    await Movie.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    await cache.set(cacheKey, movie, 600);
    res.json(movie);
  } catch (error) {
    next(error);
  }
};

exports.getMovieBySlug = async (req, res, next) => {
  try {
    const movie = await Movie.findOne({ slug: req.params.slug })
      .populate('genres')
      .populate('actors');
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    await Movie.findByIdAndUpdate(movie._id, { $inc: { views: 1 } });
    res.json(movie);
  } catch (error) {
    next(error);
  }
};

exports.getFeaturedMovies = async (req, res, next) => {
  try {
    const cacheKey = 'movies:featured';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const movies = await Movie.find({ featured: true, status: 'active' })
      .populate('genres', 'name nameAr')
      .sort('-rating')
      .limit(10);

    await cache.set(cacheKey, movies, 600);
    res.json(movies);
  } catch (error) {
    next(error);
  }
};

exports.getTrendingMovies = async (req, res, next) => {
  try {
    const cacheKey = 'movies:trending';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const movies = await Movie.find({ status: 'active' })
      .populate('genres', 'name nameAr')
      .sort('-views')
      .limit(20);

    await cache.set(cacheKey, movies, 300);
    res.json(movies);
  } catch (error) {
    next(error);
  }
};

exports.getLatestMovies = async (req, res, next) => {
  try {
    const cacheKey = 'movies:latest';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const movies = await Movie.find({ status: 'active' })
      .populate('genres', 'name nameAr')
      .sort('-createdAt')
      .limit(20);

    await cache.set(cacheKey, movies, 300);
    res.json(movies);
  } catch (error) {
    next(error);
  }
};

exports.searchMovies = async (req, res, next) => {
  try {
    const { q, genre, year, rating, page = 1, limit = 20 } = req.query;
    const query = { status: 'active' };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { titleAr: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (genre) query.genres = genre;
    if (year) query.year = parseInt(year);
    if (rating) query.rating = { $gte: parseFloat(rating) };

    const movies = await Movie.find(query)
      .populate('genres', 'name nameAr slug')
      .sort('-rating')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Movie.countDocuments(query);
    res.json({ movies, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.createMovie = async (req, res, next) => {
  try {
    const slug = req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const movie = await Movie.create({ ...req.body, slug });
    await cache.delByPattern('movies:*');
    res.status(201).json(movie);
  } catch (error) {
    next(error);
  }
};

exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    await cache.del(`movie:${req.params.id}`);
    await cache.delByPattern('movies:*');
    res.json(movie);
  } catch (error) {
    next(error);
  }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    await Comment.deleteMany({ itemId: req.params.id });
    await cache.del(`movie:${req.params.id}`);
    await cache.delByPattern('movies:*');
    res.json({ message: 'Movie deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getRelatedMovies = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const related = await Movie.find({
      _id: { $ne: movie._id },
      genres: { $in: movie.genres },
      status: 'active',
    })
      .populate('genres', 'name nameAr')
      .limit(10)
      .sort('-rating');

    res.json(related);
  } catch (error) {
    next(error);
  }
};
