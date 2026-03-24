const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const getDashboardStats = async (req, res) => {
  const invoices = await Invoice.find({});
  const products = await Product.find({});
  const customers = await Customer.find({});
  
  let totalSales = 0;
  let paidTotal = 0;
  let pendingTotal = 0;
  let overdueTotal = 0;

  invoices.forEach(inv => {
    totalSales += inv.amount;
    if (inv.status === 'Paid') paidTotal += inv.amount;
    if (inv.status === 'Pending') pendingTotal += inv.amount;
    if (inv.status === 'Overdue') overdueTotal += inv.amount;
  });

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

  res.json({
    totalSales,
    paidTotal,
    pendingTotal,
    overdueTotal,
    lowStockAlerts: lowStock,
    outOfStockAlerts: outOfStock,
    outstandingDebts: totalOutstanding,
    invoiceCount: invoices.length,
    productCount: products.length,
    customerCount: customers.length
  });
};

module.exports = { getDashboardStats };
