const express = require('express');
const router = express.Router();
const { getActiveBanners } = require('../controllers/promoController');
const { submitInquiry } = require('../controllers/contactController');
const BusinessSettings = require('../models/BusinessSettings');

router.get('/settings', async (req, res) => {
    try {
        const settings = await BusinessSettings.findOne();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/contact', submitInquiry);
router.get('/banners', getActiveBanners);

module.exports = router;
