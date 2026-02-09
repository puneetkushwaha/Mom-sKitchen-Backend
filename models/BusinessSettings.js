const mongoose = require('mongoose');

const businessSettingsSchema = new mongoose.Schema({
    kitchenName: {
        type: String,
        default: 'My Cloud Kitchen'
    },
    timings: {
        open: String, // e.g., '09:00 AM'
        close: String // e.g., '11:00 PM'
    },
    isHolidayMode: {
        type: Boolean,
        default: false
    },
    deliveryRadius: {
        type: Number, // in KM
        default: 5
    },
    baseDeliveryCharge: {
        type: Number,
        default: 40
    },
    freeDeliveryAbove: {
        type: Number,
        default: 500
    },
    taxPercentage: {
        type: Number,
        default: 5
    },
    contactPhone: {
        type: String,
        default: '7380663685'
    },
    adminPhone: {
        type: String,
        default: '7380663685'
    }, // For Admin Notifications (WhatsApp/SMS)
    address: {
        type: String,
        default: 'Lucknow, Uttar Pradesh, India'
    },
    upiId: {
        type: String,
        default: '7380663685@airtel'
    }
}, { timestamps: true });

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);
