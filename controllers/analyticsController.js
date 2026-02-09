const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');

// @desc    Get Frequently Bought Together items
// @route   GET /api/analytics/recommendations/:itemId
const getRecommendations = async (req, res) => {
    try {
        const { itemId } = req.params;

        // 1. Find orders containing this item
        const orders = await Order.find({ 'items.menuItem': itemId }).limit(50);

        if (orders.length === 0) return res.json([]);

        // 2. Map other items and count frequencies
        const itemCounts = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const id = item.menuItem.toString();
                if (id !== itemId) {
                    itemCounts[id] = (itemCounts[id] || 0) + 1;
                }
            });
        });

        // 3. Sort and pick top 3
        const topItemIds = Object.keys(itemCounts)
            .sort((a, b) => itemCounts[b] - itemCounts[a])
            .slice(0, 3);

        // 4. Fetch the full item details
        const recommendedItems = await MenuItem.find({ _id: { $in: topItemIds } });

        res.json(recommendedItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Peak Hours Heatmap (Admin Only)
const getPeakHours = async (req, res) => {
    try {
        const heatmap = await Order.aggregate([
            {
                $project: {
                    hour: { $hour: "$createdAt" }
                }
            },
            {
                $group: {
                    _id: "$hour",
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(heatmap);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Profit Analysis (Admin Only)
const getProfitAnalysis = async (req, res) => {
    try {
        // This is complex because costPrice is on MenuItem, but we need it per order item
        const profitStats = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "menuitems",
                    localField: "items.menuItem",
                    foreignField: "_id",
                    as: "itemDetails"
                }
            },
            { $unwind: "$itemDetails" },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$payableAmount" }, // Note: This might overcount if we sum per item. 
                    // Better to group by order first or calculate strictly item-margins.
                }
            }
        ]);

        // Let's do a cleaner aggregation for Profit
        const stats = await Order.find({}).populate('items.menuItem');
        let totalRevenue = 0;
        let totalCost = 0;

        stats.forEach(order => {
            totalRevenue += order.payableAmount;
            order.items.forEach(item => {
                const cost = item.menuItem?.costPrice || 0;
                totalCost += (cost * item.quantity);
            });
        });

        res.json({
            totalRevenue,
            totalCost,
            grossProfit: totalRevenue - totalCost,
            profitPercentage: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2) : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getRecommendations, getPeakHours, getProfitAnalysis };
