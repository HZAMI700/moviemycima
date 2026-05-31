const router = require('express').Router();
const genreCtrl = require('../controllers/genreController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', genreCtrl.getGenres);
router.get('/slug/:slug', genreCtrl.getGenreBySlug);
router.get('/:id', genreCtrl.getGenre);
router.post('/', authenticate, authorize('admin'), genreCtrl.createGenre);
router.put('/:id', authenticate, authorize('admin'), genreCtrl.updateGenre);
router.delete('/:id', authenticate, authorize('admin'), genreCtrl.deleteGenre);

module.exports = router;
