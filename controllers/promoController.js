const PromoBanner = require('../models/PromoBanner');

// @desc    Get active banners
// @route   GET /api/public/banners
// @access  Public
const getActiveBanners = async (req, res) => {
    try {
        const banners = await PromoBanner.find({ isActive: true }).sort({ order: 1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all banners (Admin)
// @route   GET /api/admin/banners
// @access  Private/Admin
const getAllBanners = async (req, res) => {
    try {
        const banners = await PromoBanner.find({}).sort({ order: 1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create banner
// @route   POST /api/admin/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
    try {
        const { title, subtitle, imageUrl, link, order } = req.body;
        const banner = new PromoBanner({
            title,
            subtitle,
            imageUrl,
            link,
            order: Number(order) || 0
        });
        const createdBanner = await banner.save();
        res.status(201).json(createdBanner);
    } catch (error) {
        res.status(400).json({ message: 'Error creating banner', error: error.message });
    }
};

// @desc    Update banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
    try {
        const banner = await PromoBanner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        const { title, subtitle, imageUrl, link, order, isActive } = req.body;
        banner.title = title || banner.title;
        banner.subtitle = subtitle || banner.subtitle;
        banner.imageUrl = imageUrl || banner.imageUrl;
        banner.link = link || banner.link;
        banner.order = order !== undefined ? Number(order) : banner.order;
        banner.isActive = isActive !== undefined ? isActive : banner.isActive;

        const updatedBanner = await banner.save();
        res.json(updatedBanner);
    } catch (error) {
        res.status(400).json({ message: 'Error updating banner', error: error.message });
    }
};

// @desc    Delete banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
    try {
        const banner = await PromoBanner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }
        await banner.deleteOne();
        res.json({ message: 'Banner removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
};
