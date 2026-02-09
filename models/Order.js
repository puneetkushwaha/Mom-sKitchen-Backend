const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        default: () => `ORD-${Math.floor(100000 + Math.random() * 900000)}`
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        customizations: [String],
        priceAtSelection: Number // Snapshot of price
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    payableAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Verifying', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    paymentMode: {
        type: String,
        enum: ['COD', 'Online', 'UPI'],
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Preparing', 'Packed', 'Handed to Porter', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    deliveryAddress: {
        addressLine: String,
        landmark: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    deliveryNotes: String,
    scheduledTime: Date,
    isSelfPickup: {
        type: Boolean,
        default: false
    },
    couponApplied: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
