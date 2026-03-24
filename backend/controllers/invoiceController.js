const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

const getInvoices = async (req, res) => {
  const invoices = await Invoice.find({}).populate('customer', 'name email').populate('createdBy', 'username');
  res.json(invoices);
};

const createInvoice = async (req, res, next) => {
  try {
    let { number, customer, customerName, date, amount, status } = req.body;
    if (!number || !amount) {
      res.status(400);
      throw new Error('Number and amount are required');
    }

    if (!customer && customerName) {
      let existingCustomer = await Customer.findOne({ name: customerName });
      if (!existingCustomer) {
        existingCustomer = await Customer.create({ name: customerName, balance: 0 });
      }
      customer = existingCustomer._id;
    }

    const invoice = await Invoice.create({
      number, customer, customerName, date, amount, status, createdBy: req.user._id
    });

    if (customer && (status === 'Pending' || status === 'Overdue')) {
      await Customer.findByIdAndUpdate(customer, { $inc: { balance: amount } });
    }

    res.status(201).json(invoice);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error('Invoice number already exists. Please try again.'));
    }
    next(err);
  }
};

const updateInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedInvoice);
};

const deleteInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  await invoice.deleteOne();
  res.json({ message: 'Invoice removed' });
};

module.exports = { getInvoices, createInvoice, updateInvoice, deleteInvoice };
