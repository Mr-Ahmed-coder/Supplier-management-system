const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/').get(protect, getSuppliers).post(protect, createSupplier);
// supplierRoutes.js
// router.route('/').get(protect, getSuppliers).post(protect, adminOnly, createSupplier); // ✅ add adminOnly
router.route('/:id').put(protect, adminOnly, updateSupplier).delete(protect, adminOnly, deleteSupplier);

module.exports = router;
