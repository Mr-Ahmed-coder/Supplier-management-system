const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, exportProductsCSV } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/export/csv').get(protect, adminOnly, exportProductsCSV);
router.route('/').get(protect, adminOnly, getProducts).post(protect, adminOnly, createProduct);
router.route('/:id').put(protect, adminOnly, updateProduct).delete(protect, adminOnly, deleteProduct);

module.exports = router;
