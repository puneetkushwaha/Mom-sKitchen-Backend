const Coupon = require('../models/Coupon');

// @desc    Apply coupon
// @route   POST /api/coupons/apply
// @access  Private
const applyCoupon = async (req, res) => {
    const { code, orderAmount } = req.body;
    const normalizedCode = code.toUpperCase().trim();

    try {
        const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or inactive coupon' });
        }

        // Set expiry check to end of the day (23:59:59)
        if (coupon.expiryDate) {
            const now = new Date();
            const expiry = new Date(coupon.expiryDate);
            expiry.setHours(23, 59, 59, 999);

            if (now > expiry) {
                return res.status(400).json({ message: 'Coupon expired' });
            }
        }

        if (orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({ message: `Minimum order amount for this coupon is ${coupon.minOrderAmount}` });
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        let discount = 0;
        let isFreeDelivery = false;

        if (coupon.discountType === 'Percentage') {
            discount = (orderAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else if (coupon.discountType === 'Flat') {
            discount = coupon.discountValue;
        } else if (coupon.discountType === 'Free Delivery') {
            isFreeDelivery = true;
        }

        res.json({
            code: coupon.code,
            discountAmount: discount,
            discountType: coupon.discountType,
            isFreeDelivery,
            message: 'Coupon applied successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        const createdCoupon = await coupon.save();
        res.status(201).json(createdCoupon);
    } catch (error) {
        res.status(400).json({ message: 'Error creating coupon', error: error.message });
    }
};

const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const coupons = await Coupon.find({
            isActive: true,
            $or: [
                { expiryDate: { $gte: startOfDay } }, // Valid if expiry is today or future
                { expiryDate: { $exists: false } },
                { expiryDate: null }
            ]
        }).select('code discountType discountValue minOrderAmount maxDiscount expiryDate');
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { applyCoupon, getCoupons, createCoupon, getActiveCoupons };
