const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    costPrice: {
        type: Number,
        default: 0 // Used for profit calculation
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
        type: String
    }],
    isVeg: {
        type: Boolean,
        default: true
    },
    isTodaySpecial: {
        type: Boolean,
        default: false
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    isCombo: {
        type: Boolean,
        default: false
    },
    isOutOfStock: {
        type: Boolean,
        default: false
    },
    customizations: [{
        title: String,
        options: [{
            name: String,
            extraPrice: Number
        }],
        selectionType: {
            type: String,
            enum: ['single', 'multiple'],
            default: 'single'
        }
    }],
    addons: [{
        name: String,
        price: Number
    }]
}, { timestamps: true });

// Virtual getter for imageUrl (backwards compatibility)
menuItemSchema.virtual('imageUrl').get(function () {
    return this.images && this.images.length > 0 ? this.images[0] : '';
});

// Ensure virtuals are included in JSON
menuItemSchema.set('toJSON', { virtuals: true });
menuItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
