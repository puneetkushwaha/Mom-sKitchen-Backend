const User = require('../models/User');

// @desc    Add new address
// @route   POST /api/users/address
// @access  Private
const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { label, addressLine, landmark, zipCode, coordinates } = req.body;

        // If this is the first address, make it default
        const isDefault = user.addresses.length === 0;

        user.addresses.push({ label, addressLine, landmark, zipCode, coordinates, isDefault });
        await user.save();

        res.status(201).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user addresses
// @route   GET /api/users/address
// @access  Private
const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Set default address
// @route   PUT /api/users/address/:id/default
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.addresses.forEach(addr => {
            addr.isDefault = addr._id.toString() === req.params.id;
        });
        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { addAddress, getAddresses, deleteAddress, setDefaultAddress };
