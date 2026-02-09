const express = require('express');
const router = express.Router();
const { applyCoupon, getCoupons, createCoupon, getActiveCoupons } = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getCoupons)
    .post(protect, admin, createCoupon);

router.post('/apply', protect, applyCoupon);
router.get('/active', getActiveCoupons);

module.exports = router;
