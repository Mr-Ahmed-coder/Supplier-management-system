const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  const customers = await Customer.find({});
  res.json(customers);
};

// @desc    Create new customer
// @route   POST /api/customers
const createCustomer = async (req, res) => {
  const { name, email, phone, company, balance } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const customer = await Customer.create({ name, email, phone, company, balance });
  res.status(201).json(customer);
};

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedCustomer);
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  await customer.deleteOne();
  res.json({ message: 'Customer removed' });
};

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer };
