const express = require('express');
const router = express.Router();
const {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require('../controllers/promoController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getAllBanners)
    .post(protect, admin, createBanner);

router.route('/:id')
    .put(protect, admin, updateBanner)
    .delete(protect, admin, deleteBanner);

module.exports = router;
