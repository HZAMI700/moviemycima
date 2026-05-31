const { Actor, Movie, Series } = require('../models');

exports.getActors = async (req, res, next) => {
  try {
    const actors = await Actor.find().sort('name').limit(50);
    res.json(actors);
  } catch (error) {
    next(error);
  }
};

exports.getActor = async (req, res, next) => {
  try {
    const actor = await Actor.findById(req.params.id);
    if (!actor) return res.status(404).json({ message: 'Actor not found' });
    res.json(actor);
  } catch (error) {
    next(error);
  }
};

exports.getActorBySlug = async (req, res, next) => {
  try {
    const actor = await Actor.findOne({ slug: req.params.slug });
    if (!actor) return res.status(404).json({ message: 'Actor not found' });
    res.json(actor);
  } catch (error) {
    next(error);
  }
};

exports.getActorContent = async (req, res, next) => {
  try {
    const [movies, series] = await Promise.all([
      Movie.find({ actors: req.params.id, status: 'active' }).populate('genres', 'name nameAr').limit(20),
      Series.find({ actors: req.params.id }).populate('genres', 'name nameAr').limit(20),
    ]);
    res.json({ movies, series });
  } catch (error) {
    next(error);
  }
};

exports.createActor = async (req, res, next) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const actor = await Actor.create({ ...req.body, slug });
    res.status(201).json(actor);
  } catch (error) {
    next(error);
  }
};

exports.updateActor = async (req, res, next) => {
  try {
    const actor = await Actor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actor) return res.status(404).json({ message: 'Actor not found' });
    res.json(actor);
  } catch (error) {
    next(error);
  }
};

exports.deleteActor = async (req, res, next) => {
  try {
    const actor = await Actor.findByIdAndDelete(req.params.id);
    if (!actor) return res.status(404).json({ message: 'Actor not found' });
    res.json({ message: 'Actor deleted' });
  } catch (error) {
    next(error);
  }
};
