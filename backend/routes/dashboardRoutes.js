const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/').get(protect, getDashboardStats);

module.exports = router;
