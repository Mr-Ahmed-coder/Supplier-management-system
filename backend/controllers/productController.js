const Product = require('../models/Product');

const getProducts = async (req, res) => {
  const products = await Product.find({}).populate('supplier', 'name');
  res.json(products);
};

const createProduct = async (req, res) => {
  const { name, description, price, stock, category, supplier } = req.body;
  if (!name || price === undefined) return res.status(400).json({ message: 'Name and price are required' });

  const product = await Product.create({ name, description, price, stock, category, supplier });
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedProduct);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  await product.deleteOne();
  res.json({ message: 'Product removed' });
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
