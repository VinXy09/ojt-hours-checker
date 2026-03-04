const express = require('express');
const router = express.Router();
const multer = require('multer');
const excelController = require('../controllers/excelController');
const { auth, checkRole } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All routes require authentication
router.use(auth);

// Student routes
router.post('/upload', checkRole('student'), upload.single('file'), excelController.uploadTemplate);
router.get('/template/:studentId', checkRole('student', 'supervisor', 'admin'), excelController.getTemplate);
router.post('/parse', checkRole('student'), upload.single('file'), excelController.parseExcel);
router.post('/import', checkRole('student'), excelController.importRecords);
router.get('/preview/:studentId', checkRole('student'), excelController.getPreview);
router.get('/export/:studentId', checkRole('student'), excelController.exportTimesheet);

module.exports = router;

