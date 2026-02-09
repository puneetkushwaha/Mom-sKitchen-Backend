const mongoose = require('mongoose');

const promoBannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: '/menu'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('PromoBanner', promoBannerSchema);
