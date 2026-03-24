const express = require('express');
const router = express.Router();
const { getReceipts, createReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getReceipts).post(protect, createReceipt);

module.exports = router;
