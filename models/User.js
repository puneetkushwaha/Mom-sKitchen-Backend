const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    addresses: [{
        label: String, // e.g., 'Home', 'Office'
        addressLine: String,
        landmark: String,
        zipCode: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    otp: {
        code: String,
        expiresAt: Date
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    lifetimeValue: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Hash password/OTP if needed (OTP usually handled separately but hooks can go here)

module.exports = mongoose.model('User', userSchema);
