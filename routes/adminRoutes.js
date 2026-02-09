const express = require('express');
const router = express.Router();
const { getAnalytics, getSettings, updateSettings, getUsers, getUserDetails, getReports } = require('../controllers/adminController');
const { getInquiries, updateInquiryStatus } = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/analytics', protect, admin, getAnalytics);
router.get('/reports', protect, admin, getReports);
router.get('/users', protect, admin, getUsers);
router.get('/users/:id', protect, admin, getUserDetails);
router.get('/inquiries', protect, admin, getInquiries);
router.patch('/inquiries/:id', protect, admin, updateInquiryStatus);

router.route('/settings')
    .get(protect, admin, getSettings)
    .put(protect, admin, updateSettings);

module.exports = router;
