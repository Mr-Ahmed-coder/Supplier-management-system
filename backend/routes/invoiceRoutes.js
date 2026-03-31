const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, updateInvoice, deleteInvoice, exportInvoicesCSV, syncWithGoogleSheetsAPI } = require('../controllers/invoiceController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/export/csv').get(protect, exportInvoicesCSV);
router.route('/export/sync-sheets-stub').post(protect, adminOnly, syncWithGoogleSheetsAPI);

router.route('/').get(protect, getInvoices).post(protect, createInvoice);
router.route('/:id').put(protect, adminOnly, updateInvoice).delete(protect, adminOnly, deleteInvoice);

module.exports = router;
