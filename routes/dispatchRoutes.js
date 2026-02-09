const express = require('express');
const router = express.Router();
const { createDispatch, getDispatches, completeDispatch } = require('../controllers/dispatchController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getDispatches)
    .post(protect, admin, createDispatch);

router.put('/:id/complete', protect, admin, completeDispatch);

module.exports = router;
