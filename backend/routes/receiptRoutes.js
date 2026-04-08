const express = require('express');
const router = express.Router();
const { getReceipts, createReceipt, deleteReceipt } = require('../controllers/receiptController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/').get(protect, getReceipts).post(protect, createReceipt);
router.route('/:id').delete(protect, adminOnly, deleteReceipt);

module.exports = router;
