const express = require('express');
const router = express.Router();
const weeklyReportController = require('../controllers/weeklyReportController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Student routes
router.post('/', checkRole('student'), weeklyReportController.create);
router.get('/student/:studentId', weeklyReportController.getByStudent);

// Supervisor/Admin routes
router.get('/all', checkRole('supervisor', 'admin'), weeklyReportController.getAll);
router.get('/generate', weeklyReportController.generate);
router.get('/print', weeklyReportController.getForPrint);
router.get('/:id', weeklyReportController.getById);
router.put('/:id/submit', checkRole('student'), weeklyReportController.submit);
router.put('/:id/approve', checkRole('supervisor', 'admin'), weeklyReportController.approve);

module.exports = router;
