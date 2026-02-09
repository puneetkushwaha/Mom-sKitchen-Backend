const DispatchRecord = require('../models/DispatchRecord');
const Order = require('../models/Order');
const { notifyOrderStatus } = require('../utils/notificationService');

// @desc    Create dispatch record
// @route   POST /api/dispatch
// @access  Private/Admin
const createDispatch = async (req, res) => {
    const { orderId, serviceName, bookingId, deliveryCharge, notes } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const dispatch = new DispatchRecord({
            order: orderId,
            serviceName,
            bookingId,
            deliveryCharge,
            notes
        });

        const createdDispatch = await dispatch.save();

        // Update order status
        order.orderStatus = 'Handed to Porter';
        await order.save();

        // Notify customer
        const populatedOrder = await Order.findById(orderId).populate('user', 'name phone email');
        notifyOrderStatus(populatedOrder, 'Dispatched');

        res.status(201).json(createdDispatch);
    } catch (error) {
        res.status(400).json({ message: 'Error creating dispatch record', error: error.message });
    }
};

// @desc    Get all dispatch records
// @route   GET /api/dispatch
// @access  Private/Admin
const getDispatches = async (req, res) => {
    try {
        const dispatches = await DispatchRecord.find({}).populate('order').sort({ createdAt: -1 });
        res.json(dispatches);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update dispatch completion
// @route   PUT /api/dispatch/:id/complete
// @access  Private/Admin
const completeDispatch = async (req, res) => {
    try {
        const dispatch = await DispatchRecord.findById(req.params.id);
        if (dispatch) {
            dispatch.completionTime = Date.now();
            await dispatch.save();

            // Also update order status to Delivered
            const order = await Order.findById(dispatch.order);
            if (order) {
                order.orderStatus = 'Delivered';
                await order.save();

                // Notify customer
                const populatedOrder = await Order.findById(order._id).populate('user', 'name phone email');
                notifyOrderStatus(populatedOrder, 'Delivered');
            }

            res.json(dispatch);
        } else {
            res.status(404).json({ message: 'Dispatch record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createDispatch, getDispatches, completeDispatch };
