const express = require('express');
const router = express.Router();
const {
    submitReview,
    getPublicReviews,
    getReviewByOrder
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(getPublicReviews)
    .post(protect, upload.array('images', 3), submitReview);

router.get('/order/:orderId', protect, getReviewByOrder);

module.exports = router;
