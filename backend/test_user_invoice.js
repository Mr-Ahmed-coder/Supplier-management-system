const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

const User = require('./models/User');
const Product = require('./models/Product');
const Invoice = require('./models/Invoice');
const invoiceController = require('./controllers/invoiceController');

async function test() {
  try {
    const user = await User.findOne({ role: 'User' }) || await User.findOne({ role: 'user' });
    if (!user) return console.log("No normal user found");
    
    const product = await Product.findOne({ stock: { $gt: 5 } });
    if (!product) return console.log("No product found with stock > 5");
    
    // mimic req
    const req = {
      user: user,
      body: {
        number: `TEST-${Date.now()}`,
        customerName: "Test Fake Customer",
        customerPhone: "1234567",
        date: new Date(),
        amountPaid: 0,
        items: [{
          product: product._id,
          quantity: 1,
          price: product.price
        }]
      }
    };
    
    const res = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { console.log("JSON RESPONSE:", data); return this; }
    };
    
    const next = function(err) { console.log("NEXT ERROR:", err); };
    
    console.log("Calling createInvoice...");
    await invoiceController.createInvoice(req, res, next);
    
  } catch(e) {
    console.error("FATAL:", e);
  } finally {
    mongoose.disconnect();
  }
}
test();
