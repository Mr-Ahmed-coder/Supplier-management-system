const Supplier = require('../models/Supplier');

const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find({});
  res.json(suppliers);
};

const createSupplier = async (req, res) => {
  const { name, email, phone, company, balance } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const supplier = await Supplier.create({ name, email, phone, company, balance });
  res.status(201).json(supplier);
};

const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

  const updatedSupplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedSupplier);
};

const deleteSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

  await supplier.deleteOne();
  res.json({ message: 'Supplier removed' });
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
