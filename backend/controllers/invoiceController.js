const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getInvoices = catchAsync(async (req, res, next) => {
  const invoices = await Invoice.find({})
    .populate('customer', 'name email')
    .populate('createdBy', 'username')
    .populate('items.product', 'name category');
  res.json(invoices);
});

const createInvoice = catchAsync(async (req, res, next) => {
  const session = await Invoice.startSession();
  session.startTransaction();

  try {
    let { number, customer, customerName, date, items, amountPaid } = req.body;
    
    if (!number || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Invoice number and at least one cart item are required', 400);
    }
    
    amountPaid = Number(amountPaid) || 0;

    let calculatedAmount = 0;
    const validatedItems = [];

    // Validate stock and build items payload
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        throw new AppError(`Product not found: ${item.productName || item.product}`, 404);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`, 400);
      }

      const itemSubtotal = item.quantity * item.price;
      calculatedAmount += itemSubtotal;

      validatedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal
      });
    }

    if (!customer && customerName) {
      let existingCustomer = await Customer.findOne({ name: customerName }).session(session);
      if (!existingCustomer) {
        let newCustomer = new Customer({ name: customerName, balance: 0 });
        existingCustomer = await newCustomer.save({ session });
      }
      customer = existingCustomer._id;
    }

    if (amountPaid > calculatedAmount) {
      throw new AppError('Amount paid cannot exceed the grand total.', 400);
    }

    const calculatedBalance = calculatedAmount - amountPaid;
    
    let calculatedStatus = 'Unpaid';
    if (calculatedBalance === 0) {
      calculatedStatus = 'Paid';
    } else if (amountPaid > 0 && calculatedBalance > 0) {
      calculatedStatus = 'Partial';
    }

    const newInvoice = new Invoice({
      number, 
      customer, 
      customerName, 
      date, 
      items: validatedItems,
      totalAmount: calculatedAmount, 
      amountPaid: amountPaid,
      balance: calculatedBalance,
      status: calculatedStatus, 
      createdBy: req.user._id
    });
    
    const invoice = await newInvoice.save({ session });

    // Deduct stock for all validated items
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product, 
        { $inc: { stock: -item.quantity } }, 
        { session, new: true }
      );
    }

    if (customer && calculatedBalance > 0) {
      await Customer.findByIdAndUpdate(customer, { $inc: { balance: calculatedBalance } }, { session, new: true });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(invoice);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    
    // In Express 5 err is caught implicitly, but with catchAsync we naturally bounce it backward
    return next(err);
  }
});


const updateInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('Invoice not found', 404));

  let customerBalanceAdjustment = 0;

  if (req.body.amountPaid !== undefined) {
    const newAmountPaid = Number(req.body.amountPaid);
    if (newAmountPaid > invoice.totalAmount) {
       return next(new AppError('Amount paid cannot exceed the grand total.', 400));
    }
    
    // Difference between new payment total and old payment total
    const paymentDifference = newAmountPaid - invoice.amountPaid;
    // That means the customer owes LESS now, so their balance DECREASES
    customerBalanceAdjustment = -paymentDifference;

    const newBalance = invoice.totalAmount - newAmountPaid;
    
    let newStatus = 'Unpaid';
    if (newBalance === 0) newStatus = 'Paid';
    else if (newAmountPaid > 0 && newBalance > 0) newStatus = 'Partial';

    req.body.balance = newBalance;
    req.body.status = newStatus;
  }

  const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  
  // Safely persist to Customer table outside the primary document save
  if (customerBalanceAdjustment !== 0 && invoice.customer) {
      await Customer.findByIdAndUpdate(invoice.customer, { $inc: { balance: customerBalanceAdjustment } });
  }

  res.json(updatedInvoice);
});

const deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('Invoice not found', 404));

  await invoice.deleteOne();
  res.json({ message: 'Invoice removed' });
});

module.exports = { getInvoices, createInvoice, updateInvoice, deleteInvoice };
