const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const { errorHandler } = require('./middleware/errorHandler');

// Catch-all route to serve the SPA or main page
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dashboard.html'));
  } else {
    res.status(404).json({ message: 'Route not found' });
  }
});

// Use error handler middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
