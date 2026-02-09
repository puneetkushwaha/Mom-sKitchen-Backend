const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const { createRazorpayOrder, verifyPayment } = require('../controllers/paymentController');

// Verify Manual UPI Payment
router.post('/verify-manual', protect, async (req, res) => {
    const { orderId, transactionId } = req.body;
    try {
        const order = await Order.findById(orderId);
        if (order) {
            order.paymentStatus = 'Verifying'; // Status for manual verification submitted
            await order.save();

            // Log the manual payment attempt
            const Payment = require('../models/Payment');
            const payment = new Payment({
                order: orderId,
                user: req.user._id,
                method: 'UPI-Manual',
                transactionId: transactionId,
                amount: order.payableAmount,
                status: 'Success'
            });
            await payment.save();

            // Send response immediately to avoid waiting for notifications
            res.json({ message: 'Payment details submitted for verification' });

            // 3. Send Notifications now that UTR is submitted
            const BusinessSettings = require('../models/BusinessSettings');
            const { notifyOrderStatus, notifyAdminNewOrder } = require('../utils/notificationService');

            const settings = await BusinessSettings.findOne();
            const populatedOrder = await Order.findById(orderId).populate('user', 'name phone email');

            // Notify Customer
            await notifyOrderStatus(populatedOrder, 'Placed');

            // Notify Admin
            if (settings?.adminPhone) {
                await notifyAdminNewOrder(populatedOrder, settings.adminPhone);
            }

        } else {
            if (!res.headersSent) res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Payment Verification Error:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
});

// Razorpay Routes
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
