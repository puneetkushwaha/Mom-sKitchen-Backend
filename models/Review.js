const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    images: [{
        type: String // URLs to images
    }],
    isApproved: {
        type: Boolean,
        default: true // Auto-approve for now, can be manual later
    }
}, { timestamps: true });

// Prevent multiple reviews for the same order
reviewSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
