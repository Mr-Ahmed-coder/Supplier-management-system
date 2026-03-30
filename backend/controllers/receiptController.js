const Receipt = require('../models/Receipt');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getReceipts = catchAsync(async (req, res, next) => {
  const receipts = await Receipt.find({}).populate('customer', 'name').populate('invoice', 'number');
  res.json(receipts);
});

const createReceipt = catchAsync(async (req, res, next) => {
  const { number, invoice, customer, amount, date, method } = req.body;
  if (!number || !amount) {
    return next(new AppError('Number and amount are required', 400));
  }

  const receipt = await Receipt.create({
    number, invoice, customer, amount, date, method, createdBy: req.user._id
  });

  if (customer) {
    await Customer.findByIdAndUpdate(customer, { $inc: { balance: -amount } }, { runValidators: true });
  }

  res.status(201).json(receipt);
});

module.exports = { getReceipts, createReceipt };
