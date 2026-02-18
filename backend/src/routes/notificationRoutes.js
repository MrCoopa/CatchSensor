const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, notificationController.subscribe);
router.post('/test', protect, notificationController.testNotification);

module.exports = router;

