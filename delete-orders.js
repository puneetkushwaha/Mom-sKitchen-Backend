const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

const clearOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const result = await Order.deleteMany({});
        console.log(`SUCCESS: ${result.deletedCount} orders deleted.`);

        process.exit(0);
    } catch (error) {
        console.error('Error clearing orders:', error);
        process.exit(1);
    }
};

clearOrders();
