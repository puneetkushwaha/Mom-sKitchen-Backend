const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const BusinessSettings = require('../models/BusinessSettings');
const { isStoreOpen } = require('../utils/timeHelper');
const { notifyOrderStatus, notifyAdminNewOrder } = require('../utils/notificationService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const {
        orderItems,
        deliveryAddress,
        paymentMode,
        totalAmount,
        deliveryCharge,
        taxAmount,
        payableAmount,
        deliveryNotes,
        scheduledTime,
        isSelfPickup
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    try {
        // 1. Check if Kitchen is Open
        const settings = await BusinessSettings.findOne();
        console.log('[DEBUG] Checking KITCHEN STATUS for order...');
        console.log('Settings:', JSON.stringify({
            holiday: settings?.isHolidayMode,
            timings: settings?.timings
        }));

        if (!isStoreOpen(settings)) {
            console.log('[REJECTED] Kitchen is closed. Blocking order.');
            return res.status(400).json({
                message: 'Kitchen is currently closed. Please order during business hours.',
                timings: settings?.timings
            });
        }
        console.log('[ACCEPTED] Kitchen is open. Processing...');

        // Validate items and prices
        const itemsWithSnapshots = await Promise.all(orderItems.map(async (item) => {
            const menuProduct = await MenuItem.findById(item.menuItem);
            if (!menuProduct) throw new Error(`Item ${item.menuItem} not found`);

            return {
                menuItem: item.menuItem,
                quantity: item.quantity,
                customizations: item.customizations,
                priceAtSelection: menuProduct.price // Backend-validated price
            };
        }));

        const order = new Order({
            user: req.user._id,
            items: itemsWithSnapshots,
            deliveryAddress,
            paymentMode,
            totalAmount,
            deliveryCharge,
            taxAmount,
            payableAmount,
            deliveryNotes,
            scheduledTime,
            isSelfPickup,
            paymentStatus: paymentMode === 'COD' ? 'Pending' : 'Pending',
            couponApplied: req.body.couponCode // Track which coupon was used
        });

        const createdOrder = await order.save();

        // 2. Increment Coupon Usage Count
        if (req.body.couponCode) {
            const Coupon = require('../models/Coupon');
            await Coupon.findOneAndUpdate(
                { code: req.body.couponCode },
                { $inc: { usageCount: 1 } }
            );
        }

        // 3. Update User CRM Stats
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalOrders: 1, lifetimeValue: payableAmount },
            $set: { lastOrderDate: new Date() }
        });

        // 4. Send Notifications (ONLY for COD immediately)
        const populatedOrder = await Order.findById(createdOrder._id).populate('user', 'name phone email');

        console.log(`[DEBUG] Finalizing order notifications. Mode: "${paymentMode}", Order Mode: "${populatedOrder.paymentMode}"`);

        if (paymentMode === 'COD') {
            console.log('[DEBUG] Mode matches COD. Sending immediate notifications.');
            // Notify Customer (Email Invoice, WhatsApp, SMS for COD)
            await notifyOrderStatus(populatedOrder, 'Placed');

            // Notify Admin (WhatsApp)
            if (settings?.adminPhone) {
                await notifyAdminNewOrder(populatedOrder, settings.adminPhone);
            }
        } else {
            console.log(`[INFO] Deferring notifications for ${paymentMode} order until payment verification.`);
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('[Order Error]', error);
        res.status(400).json({ message: 'Error creating order', error: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name phone email').populate('items.menuItem');

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update order status (By Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    const { orderStatus } = req.body;

    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.orderStatus = orderStatus;
            const updatedOrder = await order.save();

            // Notify customer via Socket.io in their specific room
            req.app.get('io').to(order._id.toString()).emit('orderUpdate', updatedOrder);

            // Notify via Email/WA
            const populatedOrder = await Order.findById(updatedOrder._id).populate('user', 'name phone email');
            notifyOrderStatus(populatedOrder, orderStatus);

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.menuItem');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        let query = {};

        if (req.query.date) {
            const date = new Date(req.query.date);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            query.createdAt = {
                $gte: date,
                $lt: nextDate
            };
        }

        // FILTER: Hide unverified non-COD orders from Admin
        // Only show COD, Verifying (UTR Submitted), or Paid orders
        query.$or = [
            { paymentMode: 'COD' },
            { paymentStatus: { $in: ['Verifying', 'Paid'] } }
        ];

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate('user', 'name phone email')
            .populate('items.menuItem');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Cancel order (By Customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify ownership
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to cancel this order' });
        }

        // Check status - only 'Pending' orders can be cancelled
        if (order.orderStatus !== 'Pending') {
            return res.status(400).json({ message: `Order cannot be cancelled as it is already ${order.orderStatus}` });
        }

        order.orderStatus = 'Cancelled';
        const updatedOrder = await order.save();

        // Notify admin via Socket.io
        req.app.get('io').emit('orderUpdate', updatedOrder);
        // Also notify client in their room
        req.app.get('io').to(order._id.toString()).emit('orderUpdate', updatedOrder);

        res.json({ message: 'Order cancelled successfully', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderStatus,
    getMyOrders,
    getOrders,
    cancelOrder
};
