const router = require('express').Router();
const movieCtrl = require('../controllers/movieController');
const commentCtrl = require('../controllers/commentController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.get('/', movieCtrl.getMovies);
router.get('/featured', movieCtrl.getFeaturedMovies);
router.get('/trending', movieCtrl.getTrendingMovies);
router.get('/latest', movieCtrl.getLatestMovies);
router.get('/search', movieCtrl.searchMovies);
router.get('/slug/:slug', movieCtrl.getMovieBySlug);
router.get('/:id', validateObjectId(), movieCtrl.getMovie);
router.get('/:id/related', validateObjectId(), movieCtrl.getRelatedMovies);
router.get('/:id/comments', validateObjectId(), commentCtrl.getComments);

router.post('/', authenticate, authorize('admin'), movieCtrl.createMovie);
router.put('/:id', authenticate, authorize('admin'), validateObjectId(), movieCtrl.updateMovie);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId(), movieCtrl.deleteMovie);

module.exports = router;
