const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({}).populate('supplier', 'name');
  res.json(products);
});

const createProduct = catchAsync(async (req, res, next) => {
  const { name, description, price, stock, category, supplier } = req.body;
  if (!name || name.trim() === '') {
    return next(new AppError('Product name is required', 400));
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    return next(new AppError('Valid non-negative price is required', 400));
  }
  if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
    return next(new AppError('Valid non-negative stock quantity is required', 400));
  }

  const product = await Product.create({ name, description, price, stock, category, supplier });
  res.status(201).json(product);
});

const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(updatedProduct);
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  await product.deleteOne();
  res.json({ message: 'Product removed' });
});

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
