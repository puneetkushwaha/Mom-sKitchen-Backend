const express = require('express');
const router = express.Router();
const {
    getMenu,
    getMenuItemById,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
} = require('../controllers/menuController');
const { protect, admin } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(getMenu)
    .post(protect, admin, upload.array('images', 5), addMenuItem);

router.route('/:id')
    .get(getMenuItemById)
    .put(protect, admin, upload.array('images', 5), updateMenuItem)
    .delete(protect, admin, deleteMenuItem);

module.exports = router;
