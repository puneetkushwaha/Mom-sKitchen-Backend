const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Read', 'Replied', 'Archived'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
