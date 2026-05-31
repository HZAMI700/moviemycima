const router = require('express').Router();
const mock = require('../controllers/mockController');
const jwt = require('jsonwebtoken');
const config = require('../config');

const genres = mock.genres;
const actors = mock.actors;
const movies = mock.movies;
const series = mock.series;
const comments = mock.comments;
let users = [...mock.mockUsers];

const generateToken = (user) => jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpire });

router.get('/movies', (req, res) => {
  const { page = 1, limit = 20, genre, year, sort = '-createdAt', search } = req.query;
  let filtered = [...movies];
  if (genre) filtered = filtered.filter(m => m.genres.some(g => g._id === genre));
  if (year) filtered = filtered.filter(m => m.year === parseInt(year));
  if (search) filtered = filtered.filter(m => m.titleAr.includes(search) || m.title.toLowerCase().includes(search.toLowerCase()));

  if (sort === '-rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === '-views') filtered.sort((a, b) => b.views - a.views);
  else if (sort === '-year') filtered.sort((a, b) => b.year - a.year);
  else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  res.json({ movies: filtered.slice((p - 1) * l, p * l), total, page: p, pages: Math.ceil(total / l) });
});

router.get('/movies/featured', (req, res) => res.json(movies.filter(m => m.featured)));
router.get('/movies/trending', (req, res) => res.json([...movies].sort((a, b) => b.views - a.views).slice(0, 20)));
router.get('/movies/latest', (req, res) => res.json({ movies: [...movies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20) }));

router.get('/movies/search', (req, res) => {
  const { q, genre, year, rating, page = 1, limit = 20 } = req.query;
  let filtered = [...movies];
  if (q) filtered = filtered.filter(m => m.titleAr.includes(q) || m.title.toLowerCase().includes(q.toLowerCase()));
  if (genre) filtered = filtered.filter(m => m.genres.some(g => g._id === genre));
  if (year) filtered = filtered.filter(m => m.year === parseInt(year));
  if (rating) filtered = filtered.filter(m => m.rating >= parseFloat(rating));
  const total = filtered.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  res.json({ movies: filtered.slice((p - 1) * l, p * l), total, page: p, pages: Math.ceil(total / l) });
});

router.get('/movies/slug/:slug', (req, res) => {
  const movie = movies.find(m => m.slug === req.params.slug);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

router.get('/movies/:id', (req, res) => {
  const movie = movies.find(m => m._id === req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

router.get('/movies/:id/related', (req, res) => {
  const movie = movies.find(m => m._id === req.params.id);
  if (!movie) return res.json([]);
  const related = movies.filter(m => m._id !== movie._id && m.genres.some(g => movie.genres.some(mg => mg._id === g._id))).slice(0, 10);
  res.json(related);
});

router.get('/series', (req, res) => {
  const { page = 1, limit = 20, genre, sort = '-createdAt' } = req.query;
  let filtered = [...series];
  if (genre) filtered = filtered.filter(s => s.genres.some(g => g._id === genre));
  const total = filtered.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  res.json({ series: filtered.slice((p - 1) * l, p * l), total, page: p, pages: Math.ceil(total / l) });
});

router.get('/series/latest', (req, res) => res.json({ series: [...series].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20) }));
router.get('/series/trending', (req, res) => res.json([...series].sort((a, b) => b.views - a.views).slice(0, 20)));

router.get('/series/slug/:slug', (req, res) => {
  const s = series.find(s => s.slug === req.params.slug);
  if (!s) return res.status(404).json({ message: 'Series not found' });
  res.json(s);
});

router.get('/genres', (req, res) => res.json(genres));
router.get('/genres/slug/:slug', (req, res) => {
  const g = genres.find(g => g.slug === req.params.slug);
  if (!g) return res.status(404).json({ message: 'Genre not found' });
  res.json(g);
});

router.get('/actors', (req, res) => res.json(actors));
router.get('/actors/slug/:slug', (req, res) => {
  const a = actors.find(a => a.slug === req.params.slug);
  if (!a) return res.status(404).json({ message: 'Actor not found' });
  res.json(a);
});

router.get('/actors/:id/content', (req, res) => {
  const actorMovies = movies.filter(m => m.actors.some(a => a._id === req.params.id));
  const actorSeries = series.filter(s => s.actors.some(a => a._id === req.params.id));
  res.json({ movies: actorMovies, series: actorSeries });
});

router.get('/comments', (req, res) => {
  const { itemId, page = 1, limit = 20 } = req.query;
  const filtered = itemId ? comments : comments;
  res.json({ comments: filtered, total: filtered.length, page: parseInt(page), pages: 1 });
});

router.post('/comments', (req, res) => {
  const newComment = {
    _id: `c${Date.now()}`,
    user: { _id: req.user?._id || 'u1', name: req.user?.name || 'مستخدم', avatar: '' },
    text: req.body.text,
    likes: [],
    replies: [],
    createdAt: new Date().toISOString(),
  };
  comments.unshift(newComment);
  res.status(201).json(newComment);
});

router.post('/comments/:id/like', (req, res) => {
  const comment = comments.find(c => c._id === req.params.id);
  if (!comment) return res.status(404).json({ message: 'Not found' });
  res.json(comment);
});

router.delete('/comments/:id', (req, res) => {
  const idx = comments.findIndex(c => c._id === req.params.id);
  if (idx > -1) comments.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

router.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email === email)) return res.status(409).json({ message: 'Email already registered' });
  const user = { _id: `u${Date.now()}`, name, email, password, role: 'user', avatar: '', bookmarks: [], preferences: { language: 'ar', quality: 'auto' }, createdAt: new Date().toISOString() };
  users.push(user);
  const token = generateToken(user);
  res.status(201).json({ user: { ...user, password: undefined }, token });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || password !== 'password' && password !== 'Admin@123456') return res.status(401).json({ message: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ user: { ...user, password: undefined }, token });
});

router.get('/auth/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = users.find(u => u._id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ ...user, password: undefined });
  } catch { res.status(401).json({ message: 'Invalid token' }); }
});

router.get('/auth/bookmarks', (req, res) => res.json([]));
router.post('/auth/bookmarks', (req, res) => res.json([]));
router.delete('/auth/bookmarks', (req, res) => res.json([]));
router.get('/auth/history', (req, res) => res.json([]));
router.post('/auth/history', (req, res) => res.json({}));

router.get('/admin/dashboard', (req, res) => {
  res.json({
    stats: { totalMovies: movies.length, totalSeries: series.length, totalEpisodes: series.reduce((a, s) => a + (s.episodes?.length || 0), 0), totalUsers: users.length, totalComments: comments.length },
    recentMovies: movies.slice(0, 5).map(m => ({ _id: m._id, title: m.title, titleAr: m.titleAr, rating: m.rating, views: m.views })),
    recentUsers: users.slice(0, 5).map(u => ({ _id: u._id, name: u.name, email: u.email, createdAt: u.createdAt })),
  });
});

router.get('/admin/analytics', (req, res) => {
  res.json({
    dailyViews: [],
    genreDistribution: genres.map(g => ({
      _id: g._id,
      name: g.name,
      nameAr: g.nameAr,
      count: movies.filter(m => m.genres.some(mg => mg._id === g._id)).length,
    })),
  });
});

module.exports = router;
