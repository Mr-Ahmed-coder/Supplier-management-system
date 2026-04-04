const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { Parser } = require('json2csv');
const xlsx = require('xlsx-js-style');

const getInvoices = catchAsync(async (req, res, next) => {
  let queryObj = {};

  if (req.query.date) {
    const targetDate = new Date(req.query.date);
    if (!isNaN(targetDate)) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      queryObj.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
  }

  const invoices = await Invoice.find(queryObj)
    .populate('customer', 'name email')
    .populate('createdBy', 'username')
    .populate('items.product', 'name category')
    .sort({ createdAt: -1 });

  res.json(invoices);
});

const createInvoice = catchAsync(async (req, res, next) => {
  const session = await Invoice.startSession();
  session.startTransaction();

  try {
    let { number, customer, customerName, customerPhone, location, date, dueDate, items, amountPaid } = req.body;
    
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
        let newCustomer = new Customer({ name: customerName, phone: customerPhone, balance: 0 });
        existingCustomer = await newCustomer.save({ session });
      }
      customer = existingCustomer._id;
    }

    if (amountPaid > calculatedAmount) {
      throw new AppError('Amount paid cannot exceed the grand total.', 400);
    }

    const calculatedBalance = calculatedAmount - amountPaid;
    
    let calculatedStatus = 'Partial'; // Default
    if (calculatedBalance === 0) {
      calculatedStatus = 'Paid';
    } else {
      const isOverdue = dueDate && new Date() > new Date(dueDate);
      if (isOverdue) calculatedStatus = 'Overdue';
    }

    const newInvoice = new Invoice({
      number, 
      customer, 
      customerName, 
      customerPhone,
      location,
      date, 
      dueDate,
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

  // Determine standard total mapping natively shielding UI structure modifications. Fallback to older schemas dynamically.
  const currentTotalAmount = req.body.totalAmount !== undefined ? Number(req.body.totalAmount) : (invoice.totalAmount !== undefined ? invoice.totalAmount : invoice.amount);

  let customerBalanceAdjustment = 0;

  const rawPaid = req.body.amountPaid !== undefined ? req.body.amountPaid : invoice.amountPaid;
  const newAmountPaid = Number(rawPaid);

  if (newAmountPaid > currentTotalAmount) {
     return next(new AppError('Amount paid cannot exceed the grand total.', 400));
  }
  
  // Calculate specific customer account balance impact directly based off exact prior accounting records
  const oldBalance = invoice.balance !== undefined ? invoice.balance : (invoice.status === 'Paid' ? 0 : currentTotalAmount);
  const newBalance = currentTotalAmount - newAmountPaid;
  
  customerBalanceAdjustment = newBalance - oldBalance; 
  
  let newStatus = 'Partial';
  if (newBalance === 0) { 
    newStatus = 'Paid'; 
  } else {
    const targetDueDate = req.body.dueDate !== undefined ? req.body.dueDate : invoice.dueDate;
    const isOverdue = targetDueDate && new Date() > new Date(targetDueDate);
    if (isOverdue) newStatus = 'Overdue';
  }

  req.body.totalAmount = currentTotalAmount;
  req.body.amountPaid = newAmountPaid;
  req.body.balance = newBalance;
  req.body.status = newStatus;

  // WARNING: Pure array manipulation bypassing atomic stock increments. Safe for accounting fixes.
  const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  
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

const exportInvoicesCSV = catchAsync(async (req, res, next) => {
  const { filter, status } = req.query;
  let queryObj = {};

  if (filter === 'today') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    queryObj.createdAt = { $gte: startOfDay };
  }

  if (status === 'Paid') {
    queryObj.status = 'Paid';
  } else if (status === 'Partial') {
    queryObj.status = { $in: ['Partial', 'Overdue', 'Unpaid', 'Pending'] };
  }

  const invoices = await Invoice.find(queryObj)
    .populate('customer', 'name email phone')
    .sort({ createdAt: -1 });

  if (!invoices || invoices.length === 0) {
    return next(new AppError('No invoices available for export', 404));
  }

  const exportData = invoices.map(inv => {
    const totalAmount = inv.totalAmount !== undefined ? inv.totalAmount : (inv.amount || 0);
    const amountPaid = inv.amountPaid !== undefined ? inv.amountPaid : (inv.status === 'Paid' ? totalAmount : 0);
    const balance = inv.balance !== undefined ? inv.balance : Math.max(0, totalAmount - amountPaid);
    
    let dateStr = 'Unknown';
    if (inv.date) dateStr = new Date(inv.date).toISOString().split('T')[0];
    else if (inv.createdAt) dateStr = new Date(inv.createdAt).toISOString().split('T')[0];

    let expectedStr = 'N/A';
    if (inv.dueDate) expectedStr = new Date(inv.dueDate).toISOString().split('T')[0];

    return {
      'Invoice Number': inv.number,
      'Customer Name': inv.customerName || (inv.customer ? inv.customer.name : 'Unknown'),
      'Total Amount': Number(totalAmount),
      'Amount Paid': Number(amountPaid),
      'Balance': Number(balance),
      'Status': inv.status,
      'Expected Payment Date': expectedStr,
      'Date Issued': dateStr,
      'Customer Phone': inv.customerPhone || (inv.customer ? inv.customer.phone : 'N/A'),
      'Location': inv.location || 'N/A'
    };
  });

  const ws = xlsx.utils.json_to_sheet(exportData);

  // Set professional column widths to prevent cutoffs and adjust visual spacing scaling
  ws['!cols'] = [
    { wch: 20 }, // Invoice Number
    { wch: 35 }, // Customer Name
    { wch: 18 }, // Total Amount
    { wch: 18 }, // Amount Paid
    { wch: 18 }, // Balance
    { wch: 15 }, // Status
    { wch: 25 }, // Expected Payment Date
    { wch: 15 }, // Date Issued
    { wch: 20 }, // Customer Phone
    { wch: 25 }  // Invoice Location
  ];

  // Apply visual styling (Borders, Headers, Alignments)
  const range = xlsx.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = xlsx.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell) continue;

      const border = {
        top: { style: "thin", color: { rgb: "E2E8F0" } },
        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      };

      if (R === 0) {
        // Header Row Styling
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E293B" } }, // Dark gray/blue professional header
          alignment: { horizontal: "center", vertical: "center" },
          border
        };
      } else {
        // Data Rows Styling
        let alignment = { vertical: "center" };
        if (typeof cell.v === "number") {
          alignment.horizontal = "right";
        } else if (typeof cell.v === "string" && cell.v.match(/^\d{4}-\d{2}-\d{2}$/)) {
          alignment.horizontal = "center";
        } else {
          alignment.horizontal = "left";
        }

        cell.s = {
          font: { color: { rgb: "333333" } },
          alignment,
          border,
          fill: (R % 2 === 0) ? { fgColor: { rgb: "F8FAFC" } } : { fgColor: { rgb: "FFFFFF" } } // Alternating rows
        };
      }
    }
  }

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Invoices");

  const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const filename = `Invoices_Export.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(excelBuffer);
});

// Advanced Feature Stub: Direct Google Sheets Server-To-Server Synchronization
const syncWithGoogleSheetsAPI = catchAsync(async (req, res, next) => {
   // TODO: Future Implementation
   // 1. Setup GoogleAuth Service Account logic (credentials.json)
   // 2. Bind google.sheets({ version: 'v4', auth })
   // 3. sheets.spreadsheets.values.update({ target_spreadsheetId, range: "Sheet1!A1", valueInputOption: 'USER_ENTERED', requestBody: ... })
   res.status(501).json({ status: 'fail', message: 'Automated API Sync pending architecture review snippet. Please utilize Manual Export CSV feature.' });
});

module.exports = { getInvoices, createInvoice, updateInvoice, deleteInvoice, exportInvoicesCSV, syncWithGoogleSheetsAPI };
