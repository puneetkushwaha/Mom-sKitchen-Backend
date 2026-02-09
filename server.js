const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const path = require('path');

const app = express();

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
if (process.env.MONGODB_URI) {
    const dbName = process.env.MONGODB_URI.includes('?')
        ? process.env.MONGODB_URI.split('/').pop().split('?')[0]
        : process.env.MONGODB_URI.split('/').pop();

    mongoose.connect(process.env.MONGODB_URI)
        .then(async () => {
            console.log(`MongoDB connected to: ${dbName}`);
            const BusinessSettings = require('./models/BusinessSettings');
            const settings = await BusinessSettings.findOne();
            console.log('--- SYSTEM STATUS ON STARTUP ---');
            console.log('Kitchen Name:', settings?.kitchenName);
            console.log('Holiday Mode:', settings?.isHolidayMode);
            console.log('-------------------------------');
        })
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.warn('WARNING: MONGODB_URI is not defined in .env file.');
}

// Routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const reviewRoutes = require('./routes/reviewRoutes'); // Added reviewRoutes import
const promoRoutes = require('./routes/promoRoutes');
const userRoutes = require('./routes/userRoutes'); // Added userRoutes import
const analyticsRoutes = require('./routes/analyticsRoutes'); // Added analyticsRoutes import

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/reviews', reviewRoutes); // Mounted reviewRoutes
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes); // Mounted analyticsRoutes
app.use('/api/promo', promoRoutes);

// Socket.io logic
app.set('io', io); // Attach io to app for use in routes
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinOrderRoom', (orderId) => {
        socket.join(orderId);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Default Route
app.get('/', (req, res) => {
    res.send('Cloud Kitchen API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`[Global Error] ${req.method} ${req.url}:`, err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
