const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
    });
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    const { amount, orderId } = req.body;

    try {
        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${orderId}`,
        };

        const razorpay = getRazorpayInstance();
        const rzpOrder = await razorpay.orders.create(options);
        res.json({
            id: rzpOrder.id,
            currency: rzpOrder.currency,
            amount: rzpOrder.amount,
            key: process.env.RAZORPAY_KEY_ID // Send public key for frontend modal
        });
    } catch (error) {
        res.status(500).json({ message: 'Razorpay order creation failed', error: error.message });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        db_order_id
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        try {
            // Update Order Payment Status
            const order = await Order.findById(db_order_id);
            if (order) {
                order.paymentStatus = 'Paid';
                await order.save();

                // Log Payment
                const payment = new Payment({
                    order: db_order_id,
                    user: req.user._id,
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    amount: order.payableAmount,
                    status: 'Captured'
                });
                await payment.save();

                // 4. Send Notifications (Online Success)
                const BusinessSettings = require('../models/BusinessSettings');
                const { notifyOrderStatus, notifyAdminNewOrder } = require('../utils/notificationService');

                const settings = await BusinessSettings.findOne();
                const populatedOrder = await Order.findById(db_order_id).populate('user', 'name phone email');

                await notifyOrderStatus(populatedOrder, 'Placed');
                if (settings?.adminPhone) {
                    await notifyAdminNewOrder(populatedOrder, settings.adminPhone);
                }

                res.json({ message: "Payment verified successfully", success: true });
            } else {
                res.status(404).json({ message: "Order not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Error updating order", error: error.message });
        }
    } else {
        res.status(400).json({ message: "Invalid signature", success: false });
    }
};

module.exports = { createRazorpayOrder, verifyPayment };
