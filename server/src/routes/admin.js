const router = require('express').Router();
const adminCtrl = require('../controllers/adminController');
const userCtrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminCtrl.getDashboard);
router.get('/analytics', adminCtrl.getAnalytics);
router.get('/users', userCtrl.getUsers);
router.get('/users/:id', userCtrl.getUser);
router.put('/users/:id', userCtrl.updateUser);
router.delete('/users/:id', userCtrl.deleteUser);

module.exports = router;
