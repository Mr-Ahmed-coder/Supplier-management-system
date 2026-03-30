const Supplier = require('../models/Supplier');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getSuppliers = catchAsync(async (req, res, next) => {
  const suppliers = await Supplier.find({});
  res.json(suppliers);
});

const createSupplier = catchAsync(async (req, res, next) => {
  const { name, email, phone, company, balance } = req.body;
  if (!name || name.trim() === '') {
    return next(new AppError('Name is required', 400));
  }
  const supplier = await Supplier.create({ name, email, phone, company, balance });
  res.status(201).json(supplier);
});

const updateSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    return next(new AppError('Supplier not found', 404));
  }
  const updatedSupplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(updatedSupplier);
});

const deleteSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    return next(new AppError('Supplier not found', 404));
  }
  await supplier.deleteOne();
  res.json({ message: 'Supplier removed' });
});

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
