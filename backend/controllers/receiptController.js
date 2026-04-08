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
  
  if (invoice) {
    await updateInvoicePaymentData(invoice);
  }

  res.status(201).json(receipt);
});

const deleteReceipt = catchAsync(async (req, res, next) => {
  const receipt = await Receipt.findById(req.params.id);
  if (!receipt) {
    return next(new AppError('Receipt not found', 404));
  }

  if (receipt.customer) {
    await Customer.findByIdAndUpdate(receipt.customer, { $inc: { balance: receipt.amount } }, { runValidators: true });
  }

  const invoiceId = receipt.invoice;
  await receipt.deleteOne();

  if (invoiceId) {
    await updateInvoicePaymentData(invoiceId);
  }

  res.json({ message: 'Receipt deleted successfully' });
});

async function updateInvoicePaymentData(invoiceId) {
  const inv = await Invoice.findById(invoiceId);
  if (!inv) return;

  const receipts = await Receipt.find({ invoice: invoiceId });
  const totalPaid = receipts.reduce((sum, r) => sum + r.amount, 0);
  
  inv.amountPaid = totalPaid;
  inv.balance = Math.max(0, inv.totalAmount - totalPaid);
  
  if (inv.balance <= 0) {
    inv.status = 'Paid';
  } else if (totalPaid > 0) {
    inv.status = 'Partial';
  } else {
    inv.status = 'Unpaid';
  }
  
  await inv.save();
}

module.exports = { getReceipts, createReceipt, deleteReceipt };
