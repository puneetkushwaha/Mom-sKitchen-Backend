const Order = require('../models/Order');
const BusinessSettings = require('../models/BusinessSettings');
const User = require('../models/User');

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.find({ createdAt: { $gte: today } });
        const totalTodayRevenue = todayOrders.reduce((sum, order) => sum + order.payableAmount, 0);
        const pendingOrdersCount = await Order.countDocuments({ orderStatus: 'Pending' });
        const codOrdersCount = todayOrders.filter(o => o.paymentMode === 'COD').length;
        const onlineOrdersCount = todayOrders.filter(o => o.paymentMode === 'Online').length;

        // Monthly stats (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } });

        // 7-day Trend Data
        const last7DaysData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayOrders = await Order.find({
                createdAt: { $gte: date, $lt: nextDate },
                orderStatus: { $ne: 'Cancelled' }
            });

            last7DaysData.push({
                name: date.toLocaleDateString('en-IN', { weekday: 'short' }),
                revenue: dayOrders.reduce((s, o) => s + o.payableAmount, 0),
                orders: dayOrders.length
            });
        }

        // Heatmap Data (Orders per hour)
        const heatmap = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, orderStatus: { $ne: 'Cancelled' } } },
            { $project: { hour: { $hour: "$createdAt" } } },
            { $group: { _id: "$hour", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Profit Analysis
        const allOrders = await Order.find({
            createdAt: { $gte: thirtyDaysAgo },
            orderStatus: 'Delivered'
        }).populate('items.menuItem');

        let totalRevenue30D = 0;
        let totalCost30D = 0;

        allOrders.forEach(order => {
            totalRevenue30D += order.payableAmount;
            order.items.forEach(item => {
                const cost = item.menuItem?.costPrice || 0;
                totalCost30D += (cost * item.quantity);
            });
        });

        res.json({
            today: {
                totalOrders: todayOrders.length,
                revenue: totalTodayRevenue,
                pending: pendingOrdersCount,
                cod: codOrdersCount,
                online: onlineOrdersCount
            },
            last30Days: {
                totalOrders: monthlyOrders.length,
                revenue: monthlyOrders.reduce((sum, order) => sum + order.payableAmount, 0),
                totalCost: totalCost30D,
                grossProfit: totalRevenue30D - totalCost30D
            },
            trend: last7DaysData,
            heatmap,
            profit: {
                revenue: totalRevenue30D,
                cost: totalCost30D,
                grossProfit: totalRevenue30D - totalCost30D,
                margin: totalRevenue30D > 0 ? ((totalRevenue30D - totalCost30D) / totalRevenue30D * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get business settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
    try {
        let settings = await BusinessSettings.findOne();
        if (!settings) {
            settings = await BusinessSettings.create({});
        }
        res.json(settings);
    } catch (error) {
        console.error('SERVER ERROR (getSettings):', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        console.log('--- SETTINGS UPDATE REQUEST ---');
        console.log('Payload:', JSON.stringify(req.body, null, 2));

        let settings = await BusinessSettings.findOne();
        if (!settings) {
            settings = new BusinessSettings();
        }

        // Explicitly update fields to ensure Mongoose detects changes
        const fields = [
            'kitchenName', 'deliveryRadius', 'baseDeliveryCharge',
            'freeDeliveryAbove', 'taxPercentage', 'contactPhone',
            'adminPhone', 'address', 'upiId', 'isHolidayMode'
        ];

        fields.forEach(f => {
            if (req.body[f] !== undefined) settings[f] = req.body[f];
        });

        if (req.body.timings) {
            settings.timings = {
                open: req.body.timings.open || settings.timings.open,
                close: req.body.timings.close || settings.timings.close
            };
        }

        await settings.save();
        console.log('Settings persisted successfully');
        res.json(settings);
    } catch (error) {
        console.error('SERVER ERROR (updateSettings):', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users (Customers) for CRM
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'customer' }).sort({ lifetimeValue: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user details + order history
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });

        res.json({ user, orders });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get detailed report for a specific date
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const orders = await Order.find({
            createdAt: { $gte: date, $lt: nextDate }
        }).populate('user', 'name phone');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAnalytics,
    getSettings,
    updateSettings,
    getUsers,
    getUserDetails,
    getReports
};
