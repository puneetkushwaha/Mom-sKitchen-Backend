const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    amount: Number,
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['Created', 'Authorized', 'Captured', 'Refunded', 'Failed', 'Success'],
        default: 'Created'
    },
    method: String, // card, upi, etc.
    transactionId: String, // For Manual UPI
    error_code: String,
    error_description: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
