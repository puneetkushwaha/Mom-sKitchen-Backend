const Review = require('../models/Review');
const Order = require('../models/Order');

// @desc    Submit a review
// @route   POST /api/reviews
// @access  Private
const submitReview = async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;

        // 1. Verify order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // 2. Verify order is delivered
        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({ message: 'You can only review delivered orders' });
        }

        // 3. Handle Images if uploaded
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/reviews/${file.filename}`);
        }

        // 4. Create review
        const review = await Review.create({
            user: req.user._id,
            order: orderId,
            rating: Number(rating),
            comment,
            images
        });

        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this order' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get review for a specific order
// @route   GET /api/reviews/order/:orderId
// @access  Private
const getReviewByOrder = async (req, res) => {
    try {
        const review = await Review.findOne({ order: req.params.orderId })
            .populate('user', 'name');

        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get public reviews
// @route   GET /api/reviews
// @access  Public
const getPublicReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ isApproved: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { submitReview, getPublicReviews, getReviewByOrder };
