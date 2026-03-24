const Receipt = require('../models/Receipt');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

const getReceipts = async (req, res) => {
  const receipts = await Receipt.find({}).populate('customer', 'name').populate('invoice', 'number');
  res.json(receipts);
};

const createReceipt = async (req, res) => {
  const { number, invoice, customer, amount, date, method } = req.body;
  if (!number || !amount) return res.status(400).json({ message: 'Number and amount are required' });

  const receipt = await Receipt.create({
    number, invoice, customer, amount, date, method, createdBy: req.user._id
  });

  if (customer) {
    await Customer.findByIdAndUpdate(customer, { $inc: { balance: -amount } });
  }

  res.status(201).json(receipt);
};

module.exports = { getReceipts, createReceipt };
