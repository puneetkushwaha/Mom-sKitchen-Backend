const MenuItem = require('../models/MenuItem');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getMenu = async (req, res) => {
    try {
        const menu = await MenuItem.find({});
        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get menu item by ID
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add new menu item
// @route   POST /api/menu
// @access  Private/Admin
const addMenuItem = async (req, res) => {
    try {
        const { name, description, price, category, isVeg, isBestSeller, isTodaySpecial } = req.body;
        console.log('[Menu Add Attempt]', { name, price, category });

        const itemData = {
            name,
            description,
            price: Number(price),
            category,
            isVeg: isVeg === true || isVeg === 'true',
            isBestSeller: isBestSeller === true || isBestSeller === 'true',
            isTodaySpecial: isTodaySpecial === true || isTodaySpecial === 'true'
        };

        if (req.files && req.files.length > 0) {
            itemData.images = req.files.map(file => `/uploads/menu/${file.filename}`);
        }

        const item = new MenuItem(itemData);
        const createdItem = await item.save();
        res.status(201).json(createdItem);
    } catch (error) {
        console.error('[Menu Add Error]', error);
        res.status(400).json({ message: 'Error adding item', error: error.message });
    }
};

const updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);

        if (item) {
            const { name, description, price, category, isVeg, isBestSeller, isTodaySpecial } = req.body;

            const updateData = {};
            if (name) updateData.name = name;
            if (description) updateData.description = description;
            if (price) updateData.price = Number(price);
            if (category) updateData.category = category;
            if (isVeg !== undefined) updateData.isVeg = isVeg === true || isVeg === 'true';
            if (isBestSeller !== undefined) updateData.isBestSeller = isBestSeller === true || isBestSeller === 'true';
            if (isTodaySpecial !== undefined) updateData.isTodaySpecial = isTodaySpecial === true || isTodaySpecial === 'true';

            if (req.files && req.files.length > 0) {
                updateData.images = req.files.map(file => `/uploads/menu/${file.filename}`);
            }

            Object.assign(item, updateData);
            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        console.error('[Menu Update Error]', error);
        res.status(400).json({ message: 'Error updating item', error: error.message });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
const deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);

        if (item) {
            await item.deleteOne();
            res.json({ message: 'Item removed' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getMenu,
    getMenuItemById,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
};
