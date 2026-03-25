const Product = require('../models/Product');

const getProducts = async (req, res) => {
  const products = await Product.find({}).populate('supplier', 'name');
  res.json(products);
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, supplier } = req.body;
    if (!name || name.trim() === '') {
       res.status(400); throw new Error('Product name is required');
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
       res.status(400); throw new Error('Valid non-negative price is required');
    }
    if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
       res.status(400); throw new Error('Valid non-negative stock quantity is required');
    }

    const product = await Product.create({ name, description, price, stock, category, supplier });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
       res.status(404); throw new Error('Product not found');
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
       res.status(404); throw new Error('Product not found');
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
