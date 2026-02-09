const mongoose = require('mongoose');
require('dotenv').config();

const checkCouponsDetailed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Coupon = require('./models/Coupon');
        const coupons = await Coupon.find({});
        const now = new Date();

        console.log('--- DETAILED COUPON AUDIT ---');
        console.log('Current UTC Time:', now.toISOString());

        coupons.forEach(c => {
            console.log(`\nCOUPON: [${c.code}]`);
            console.log(`- isActive: ${c.isActive}`);
            console.log(`- expiryDate: ${c.expiryDate ? c.expiryDate.toISOString() : 'NONE'}`);
            console.log(`- minOrderAmount: ${c.minOrderAmount}`);
            console.log(`- discountType: ${c.discountType}`);
            console.log(`- usageCount: ${c.usageCount}`);
            console.log(`- usageLimit: ${c.usageLimit || 'NONE'}`);

            // Simulation of getActiveCoupons query logic
            const isQueryMatch = c.isActive && (!c.expiryDate || c.expiryDate > now);
            console.log(`- Matches getActiveCoupons query: ${isQueryMatch}`);

            if (!isQueryMatch) {
                if (!c.isActive) console.log('  ! FAIL: isActive is false');
                if (c.expiryDate && c.expiryDate <= now) console.log('  ! FAIL: Expired');
            }
        });

        process.exit();
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
};

checkCouponsDetailed();
