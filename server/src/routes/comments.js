const router = require('express').Router();
const commentCtrl = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

router.get('/', commentCtrl.getComments);
router.post('/', authenticate, commentCtrl.createComment);
router.delete('/:id', authenticate, commentCtrl.deleteComment);
router.post('/:id/like', authenticate, commentCtrl.likeComment);

module.exports = router;
