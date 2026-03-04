const express = require('express');
const router = express.Router();
const dailyRecordController = require('../controllers/dailyRecordController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Student routes - create, view and delete their own records
router.post('/', checkRole('student'), dailyRecordController.create);
router.get('/student/:studentId', dailyRecordController.getByStudent);
router.get('/student/:studentId/total', dailyRecordController.getTotalHours);
router.delete('/:id', checkRole('student'), dailyRecordController.delete);
router.put('/:id', checkRole('student'), dailyRecordController.update);

// Supervisor/Admin routes
router.get('/all', checkRole('supervisor', 'admin'), dailyRecordController.getAll);
router.get('/pending', checkRole('supervisor', 'admin'), dailyRecordController.getPendingApprovals);
router.put('/:id/approve', checkRole('supervisor', 'admin'), dailyRecordController.approve);

module.exports = router;
