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
    let { number, customer, customerName, date, items, status } = req.body;
    
    if (!number || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Invoice number and at least one cart item are required', 400);
    }

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

    const newInvoice = new Invoice({
      number, 
      customer, 
      customerName, 
      date, 
      items: validatedItems,
      amount: calculatedAmount, 
      status, 
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

    if (customer && (status === 'Pending' || status === 'Overdue')) {
      await Customer.findByIdAndUpdate(customer, { $inc: { balance: calculatedAmount } }, { session, new: true });
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

  const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(updatedInvoice);
});

const deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('Invoice not found', 404));

  await invoice.deleteOne();
  res.json({ message: 'Invoice removed' });
});

module.exports = { getInvoices, createInvoice, updateInvoice, deleteInvoice };
