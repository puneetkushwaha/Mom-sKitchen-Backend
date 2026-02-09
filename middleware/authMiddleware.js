const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const User = require('../models/User');
            req.user = await User.findById(decoded.id).select('-otp');

            if (!req.user) {
                console.log('[Auth] User not found in DB for ID:', decoded.id);
                return res.status(401).json({ message: 'User no longer exists' });
            }

            next();
        } catch (error) {
            console.error('[Auth Error]', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
        next();
    } else {
        console.log('[Admin Auth Fail] User:', req.user?.email, 'Role:', req.user?.role);
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { generateToken, protect, admin };
