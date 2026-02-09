const express = require('express');
const router = express.Router();
const { addAddress, getAddresses, deleteAddress, setDefaultAddress } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/address')
    .post(addAddress)
    .get(getAddresses);

router.route('/address/:id')
    .delete(deleteAddress);

router.put('/address/:id/default', setDefaultAddress);

module.exports = router;
