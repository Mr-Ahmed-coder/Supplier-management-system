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
  amount: { type: Number }, // Deprecated legacy field
  totalAmount: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, required: true, default: 0 },
  balance: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue'], default: 'Unpaid' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean, default: null } // null indicates pending manager approval
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
