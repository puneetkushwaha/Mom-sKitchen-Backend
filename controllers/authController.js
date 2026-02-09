const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../middleware/authMiddleware');

// @desc    Generate OTP and Send (Mocked)
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    const { phone, name } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        let user = await User.findOne({ phone });

        // If new user, create profile (name is required for signup)
        if (!user) {
            if (!name) {
                return res.status(400).json({ message: 'Name is required for first-time signup' });
            }
            user = new User({ phone, name });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        user.otp = { code: otpCode, expiresAt };
        await user.save();

        // MOCK: Log OTP to console (In production, call WhatsApp/SMS API here)
        console.log(`[MOCK OTP] For ${phone}: ${otpCode}`);

        res.status(200).json({
            message: 'OTP sent successfully',
            debugOTP: process.env.NODE_ENV === 'development' ? otpCode : undefined
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Verify OTP and Login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    try {
        const user = await User.findOne({ phone });

        if (!user || !user.otp || user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Clear OTP after successful use
        user.otp = undefined;
        await user.save();

        res.status(200).json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isAdmin: user.role === 'admin',
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        if (!name || !phone || !password) {
            return res.status(400).json({ message: 'Name, phone, and password are required' });
        }

        const userExists = await User.findOne({
            $or: [{ phone }, { email: email || undefined }]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User with this phone or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Email/Password Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // 1. Check for Admin Login (Primary condition)
        if (email === 'puneetkushwaha88@gmail.com' && password === '123123') {
            let user = await User.findOne({ email });
            // Auto-create admin if not exists
            if (!user) {
                const hashedPassword = await bcrypt.hash(password, 10);
                user = await User.create({
                    name: 'Puneet Kushwaha',
                    email,
                    password: hashedPassword,
                    phone: '0000000000',
                    role: 'admin'
                });
            }
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: true,
                token: generateToken(user._id)
            });
        }

        // 2. Normal User Login
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isAdmin: user.role === 'admin',
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { sendOTP, verifyOTP, signup, login };
