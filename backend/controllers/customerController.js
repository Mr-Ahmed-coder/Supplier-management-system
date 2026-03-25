const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  const customers = await Customer.find({});
  res.json(customers);
};

// @desc    Create new customer
// @route   POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, company, balance } = req.body;
    if (!name || name.trim() === '') {
      res.status(400);
      throw new Error('Name is required');
    }
    if (balance !== undefined && isNaN(Number(balance))) {
      res.status(400);
      throw new Error('Balance must be a valid number');
    }
    const customer = await Customer.create({ name, email, phone, company, balance });
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCustomer);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer };
