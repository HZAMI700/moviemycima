const router = require('express').Router();
const actorCtrl = require('../controllers/actorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', actorCtrl.getActors);
router.get('/slug/:slug', actorCtrl.getActorBySlug);
router.get('/:id', actorCtrl.getActor);
router.get('/:id/content', actorCtrl.getActorContent);
router.post('/', authenticate, authorize('admin'), actorCtrl.createActor);
router.put('/:id', authenticate, authorize('admin'), actorCtrl.updateActor);
router.delete('/:id', authenticate, authorize('admin'), actorCtrl.deleteActor);

module.exports = router;
