const router = require('express').Router();
const seriesCtrl = require('../controllers/seriesController');
const commentCtrl = require('../controllers/commentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

router.get('/', seriesCtrl.getSeriesList);
router.get('/latest', seriesCtrl.getLatestSeries);
router.get('/trending', seriesCtrl.getTrendingSeries);
router.get('/slug/:slug', seriesCtrl.getSeriesBySlug);
router.get('/:id', validateObjectId(), seriesCtrl.getSeries);
router.get('/:id/episodes', validateObjectId(), seriesCtrl.getEpisodes);
router.get('/:id/episodes/:episodeId', validateObjectId('id'), validateObjectId('episodeId'), seriesCtrl.getEpisode);
router.get('/:id/comments', validateObjectId(), commentCtrl.getComments);

router.post('/', authenticate, authorize('admin'), seriesCtrl.createSeries);
router.put('/:id', authenticate, authorize('admin'), validateObjectId(), seriesCtrl.updateSeries);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId(), seriesCtrl.deleteSeries);

module.exports = router;
