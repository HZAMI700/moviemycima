const router = require('express').Router();
const authCtrl = require('../controllers/authController');
const userCtrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, authCtrl.register);
router.post('/login', authLimiter, authCtrl.login);
router.get('/profile', authenticate, authCtrl.getProfile);
router.put('/profile', authenticate, authCtrl.updateProfile);
router.put('/change-password', authenticate, authCtrl.changePassword);
router.get('/bookmarks', authenticate, userCtrl.getBookmarks);
router.post('/bookmarks', authenticate, userCtrl.addBookmark);
router.delete('/bookmarks', authenticate, userCtrl.removeBookmark);
router.get('/history', authenticate, userCtrl.getWatchHistory);
router.post('/history', authenticate, userCtrl.updateWatchHistory);

module.exports = router;
