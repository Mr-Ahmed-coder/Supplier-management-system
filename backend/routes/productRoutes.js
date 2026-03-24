const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/').get(protect, getProducts).post(protect, createProduct);
router.route('/:id').put(protect, adminOnly, updateProduct).delete(protect, adminOnly, deleteProduct);

module.exports = router;
