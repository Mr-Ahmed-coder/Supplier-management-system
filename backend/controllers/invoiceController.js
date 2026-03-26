const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

const getInvoices = async (req, res) => {
  const invoices = await Invoice.find({})
    .populate('customer', 'name email')
    .populate('createdBy', 'username')
    .populate('items.product', 'name category');
  res.json(invoices);
};

const createInvoice = async (req, res, next) => {
  const session = await Invoice.startSession();
  session.startTransaction();

  try {
    let { number, customer, customerName, date, items, status } = req.body;
    
    if (!number || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Invoice number and at least one item are required');
    }

    let calculatedAmount = 0;
    const validatedItems = [];

    // Validate stock and build items payload
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.productName || item.product}`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
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
