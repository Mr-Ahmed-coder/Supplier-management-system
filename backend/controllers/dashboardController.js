const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const catchAsync = require('../utils/catchAsync');

const getDashboardStats = catchAsync(async (req, res, next) => {
  const isAdmin = req.user && req.user.role === 'Admin';
  
  let invoiceQuery = {};
  if (!isAdmin) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    invoiceQuery = { createdAt: { $gte: startOfDay } };
  }

  const invoices = await Invoice.find(invoiceQuery);
  const products = await Product.find({});
  const customers = await Customer.find({});
  
  let totalSales = 0;
  let paidTotal = 0;
  let partialTotal = 0;
  let overdueTotal = 0;

  invoices.forEach(inv => {
    const amt = inv.totalAmount !== undefined ? inv.totalAmount : (inv.amount || 0);
    totalSales += amt;

    // Modern POS tracking format
    if (inv.amountPaid !== undefined && inv.balance !== undefined) {
      paidTotal += inv.amountPaid;
      partialTotal += inv.balance;
    } else {
      // Ancient legacy format fallback
      if (inv.status === 'Paid') paidTotal += amt;
      if (inv.status === 'Pending' || inv.status === 'Partial') partialTotal += amt;
    }

    if (inv.status === 'Overdue') overdueTotal += amt;
  });

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

  res.json({
    totalSales,
    paidTotal,
    partialTotal,
    overdueTotal,
    lowStockAlerts: lowStock,
    outOfStockAlerts: outOfStock,
    outstandingDebts: totalOutstanding,
    invoiceCount: invoices.length,
    productCount: products.length,
    customerCount: customers.length
  });
});

module.exports = { getDashboardStats };
