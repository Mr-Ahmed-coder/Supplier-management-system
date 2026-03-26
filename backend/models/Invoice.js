const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String }, // To hold historical name easily without full populate sometimes
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  date: { type: String }, 
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean, default: null } // null indicates pending manager approval
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
