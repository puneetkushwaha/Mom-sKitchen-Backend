const mongoose = require('mongoose');

const dispatchRecordSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    serviceName: {
        type: String, // e.g., 'Porter', 'Dunzo'
        required: true,
        default: 'Porter'
    },
    bookingId: {
        type: String,
        required: true
    },
    deliveryCharge: {
        type: Number,
        required: true
    },
    dispatchTime: {
        type: Date,
        default: Date.now
    },
    completionTime: {
        type: Date
    },
    riderName: String,
    riderPhone: String,
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('DispatchRecord', dispatchRecordSchema);
