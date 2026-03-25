const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find({});
  res.json(suppliers);
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, email, phone, company, balance } = req.body;
    if (!name || name.trim() === '') {
      res.status(400);
      throw new Error('Name is required');
    }
    const supplier = await Supplier.create({ name, email, phone, company, balance });
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    const updatedSupplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedSupplier);
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    await supplier.deleteOne();
    res.json({ message: 'Supplier removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
