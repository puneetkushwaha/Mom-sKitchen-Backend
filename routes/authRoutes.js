const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, signup, login } = require('../controllers/authController');

router.post('/login', login);
router.post('/signup', signup);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;
