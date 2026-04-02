const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/').get(protect, adminOnly, getSuppliers).post(protect, adminOnly, createSupplier);
router.route('/:id').put(protect, adminOnly, updateSupplier).delete(protect, adminOnly, deleteSupplier);

module.exports = router;
