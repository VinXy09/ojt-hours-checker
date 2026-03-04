const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Student routes
router.get('/', checkRole('admin', 'supervisor'), studentController.getAll);
router.get('/user/:userId', studentController.getByUserId);
router.get('/progress/:studentId', studentController.getProgress);
router.put('/:studentId', checkRole('student', 'admin'), studentController.update);
router.get('/:studentId/records', studentController.getDailyRecords);

module.exports = router;
