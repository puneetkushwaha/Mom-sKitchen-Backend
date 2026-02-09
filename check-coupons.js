const mongoose = require('mongoose');
require('dotenv').config();

const checkCoupons = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Coupon = require('./models/Coupon');
        const coupons = await Coupon.find({});
        const now = new Date();

        console.log('Current Time (UTC):', now.toISOString());
        console.log('Current Time (Local):', now.toLocaleString());

        console.log('\n--- COUPON AUDIT ---');
        coupons.forEach(c => {
            const isMatching = c.isActive && (!c.expiryDate || c.expiryDate > now);
            console.log(`Code: ${c.code}`);
            console.log(`- Active: ${c.isActive}`);
            console.log(`- Expiry: ${c.expiryDate ? c.expiryDate.toISOString() : 'None'}`);
            console.log(`- Usage: ${c.usageCount} / ${c.usageLimit || 'Unlimited'}`);
            console.log(`- Visible to Customer: ${isMatching ? 'YES' : 'NO'}`);
            console.log('------------------');
        });

        process.exit();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkCoupons();
