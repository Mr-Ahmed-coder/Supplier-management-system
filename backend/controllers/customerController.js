const Customer = require('../models/Customer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { Parser } = require('json2csv');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = catchAsync(async (req, res, next) => {
  const customers = await Customer.find({});
  res.json(customers);
});

// @desc    Create new customer
// @route   POST /api/customers
const createCustomer = catchAsync(async (req, res, next) => {
  const { name, email, phone, company, balance } = req.body;
  if (!name || name.trim() === '') {
    return next(new AppError('Name is required', 400));
  }
  if (balance !== undefined && isNaN(Number(balance))) {
    return next(new AppError('Balance must be a valid number', 400));
  }
  const customer = await Customer.create({ name, email, phone, company, balance });
  res.status(201).json(customer);
});

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  // Safely intercept and ignore any manual balance modifiers explicitly
  if (req.body.balance !== undefined) {
    delete req.body.balance;
  }

  const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(updatedCustomer);
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
const deleteCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }
  await customer.deleteOne();
  res.json({ message: 'Customer removed' });
});

const exportCustomersCSV = catchAsync(async (req, res, next) => {
  const customers = await Customer.find({}).sort({ createdAt: -1 });
  
  if (!customers || customers.length === 0) {
    return next(new AppError('No customers available for export', 404));
  }

  const exportData = customers.map(c => ({
    'Customer Name': c.name,
    'Email': c.email || 'N/A',
    'Phone': c.phone || 'N/A',
    'Company': c.company || 'N/A',
    'Outstanding Balance': c.balance || 0,
    'Registration Date': new Date(c.createdAt).toLocaleDateString()
  }));

  const parser = new Parser();
  const csvFormat = parser.parse(exportData);

  res.header('Content-Type', 'text/csv');
  res.attachment('customers_export.csv');
  return res.send(csvFormat);
});

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer, exportCustomersCSV };
