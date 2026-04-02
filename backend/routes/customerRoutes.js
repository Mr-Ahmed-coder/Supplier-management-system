const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, updateCustomer, deleteCustomer, exportCustomersCSV } = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/export/csv').get(protect, adminOnly, exportCustomersCSV);
router.route('/').get(protect, adminOnly, getCustomers).post(protect, createCustomer);
router.route('/:id').put(protect, adminOnly, updateCustomer).delete(protect, adminOnly, deleteCustomer);

module.exports = router;
