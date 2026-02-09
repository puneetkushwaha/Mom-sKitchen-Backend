const ContactInquiry = require('../models/ContactInquiry');

// @desc    Submit a new contact inquiry
// @route   POST /api/public/contact
// @access  Public
const submitInquiry = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const inquiry = await ContactInquiry.create({
            name,
            email,
            phone,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully',
            data: inquiry
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all inquiries (Admin)
// @route   GET /api/admin/inquiries
// @access  Private/Admin
const getInquiries = async (req, res) => {
    try {
        const inquiries = await ContactInquiry.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update inquiry status
// @route   PATCH /api/admin/inquiries/:id
// @access  Private/Admin
const updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const inquiry = await ContactInquiry.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        res.json(inquiry);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    submitInquiry,
    getInquiries,
    updateInquiryStatus
};
