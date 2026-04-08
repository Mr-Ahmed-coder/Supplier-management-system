const express = require('express');
const router = express.Router();
const { getReceipts, createReceipt, deleteReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getReceipts).post(protect, createReceipt);
router.route('/:id').delete(protect, deleteReceipt);

module.exports = router;
