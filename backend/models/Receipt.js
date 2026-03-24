const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  amount: { type: Number, required: true },
  date: { type: String },
  method: { type: String, enum: ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque'], default: 'Cash' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean, default: null } // null indicates pending manager approval
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);
