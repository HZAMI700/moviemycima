const router = require('express').Router();

router.use('/movies', require('./movies'));
router.use('/series', require('./series'));
router.use('/auth', require('./auth'));
router.use('/genres', require('./genres'));
router.use('/actors', require('./actors'));
router.use('/comments', require('./comments'));
router.use('/admin', require('./admin'));

module.exports = router;
