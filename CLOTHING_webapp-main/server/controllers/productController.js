const Product = require('../models/Product');
const CategoryDiscount = require('../models/CategoryDiscount');
const { checkAndNotifyLowStock } = require('../utils/stockNotification');

// Helper to decorate product with applicable category discount
const attachDiscount = (productDoc, discounts) => {
  const p = productDoc.toObject ? productDoc.toObject() : { ...productDoc };
  const applicableDiscount = discounts.find(d => 
    d.category === 'All' || (p.category && d.category.toLowerCase() === p.category.toLowerCase())
  );

  if (applicableDiscount) {
    const discountAmount = Math.round((p.price * applicableDiscount.discountPercentage) / 100);
    p.discountedPrice = Math.max(0, p.price - discountAmount);
    p.discountPercentage = applicableDiscount.discountPercentage;
    p.discountTitle = applicableDiscount.title;
    p.discountEndDate = applicableDiscount.endDate;
    p.hasDiscount = true;
  } else {
    p.discountedPrice = p.price;
    p.discountPercentage = 0;
    p.hasDiscount = false;
  }
  return p;
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    let filter = {};
    if (includeInactive !== 'true') {
      // By default for customer storefront: hide deactivated / discontinued products
      filter = { isActive: { $ne: false } };
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });

    // Fetch active discounts to attach pricing metadata
    const now = new Date();
    const activeDiscounts = await CategoryDiscount.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ discountPercentage: -1 });

    const decorated = products.map(p => attachDiscount(p, activeDiscounts));
    res.json(decorated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const now = new Date();
      const activeDiscounts = await CategoryDiscount.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).sort({ discountPercentage: -1 });

      res.json(attachDiscount(product, activeDiscounts));
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products with low stock variants
// @route   GET /api/products/low-stock
// @access  Private/Admin
const getLowStockProducts = async (req, res) => {
  try {
    // Only check active (non-discontinued) products for low stock alerts
    const products = await Product.find({ isActive: { $ne: false } });
    const lowStockItems = [];

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        const threshold = typeof variant.threshold === 'number' ? variant.threshold : 2;
        if (variant.stock < threshold) {
          lowStockItems.push({
            productId: product._id,
            productName: product.name,
            category: product.category,
            image: (product.images && product.images[0]) || '',
            size: variant.size,
            stock: variant.stock,
            threshold: threshold,
          });
        }
      });
    });

    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, category, subCategory, fabric, price, variants, isActive } = req.body;
    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    const images = req.files ? req.files.filter(f => f.fieldname === 'images').map(file => file.path) : [];

    // Ensure variants threshold default
    parsedVariants = parsedVariants.map((v) => ({
      size: v.size || '',
      stock: Number(v.stock) || 0,
      threshold: v.threshold !== undefined && v.threshold !== null ? Number(v.threshold) : 2,
    }));

    const product = new Product({
      name,
      description,
      category,
      subCategory,
      fabric,
      price: Number(price),
      variants: parsedVariants,
      images,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
    });

    const createdProduct = await product.save();

    // Respond immediately to the client for lightning-fast publishing
    res.status(201).json(createdProduct);

    // Asynchronously check and notify low stock in background without holding HTTP response
    setImmediate(async () => {
      try {
        for (const v of createdProduct.variants) {
          const threshold = typeof v.threshold === 'number' ? v.threshold : 2;
          if (v.stock < threshold) {
            await checkAndNotifyLowStock(createdProduct, v);
          }
        }
      } catch (notifyErr) {
        console.error('Background low stock check error:', notifyErr);
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, description, category, subCategory, fabric, price, variants, existingImages, isActive } = req.body;
    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.description = description !== undefined ? description : product.description;
      product.category = category || product.category;
      product.subCategory = subCategory !== undefined ? subCategory : product.subCategory;
      product.fabric = fabric || product.fabric;
      if (price) product.price = Number(price);
      if (variants) product.variants = parsedVariants;
      if (isActive !== undefined) {
        product.isActive = isActive === 'true' || isActive === true;
      }

      let parsedExistingImages = [];
      if (existingImages) {
          parsedExistingImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      }

      let newImages = req.files ? req.files.filter(f => f.fieldname === 'images').map(file => file.path) : [];
      
      // Combine kept existing images with newly uploaded images
      product.images = [...parsedExistingImages, ...newImages];

      // Ensure variants threshold default
      parsedVariants = parsedVariants.map((v) => ({
        size: v.size || '',
        stock: Number(v.stock) || 0,
        threshold: v.threshold !== undefined && v.threshold !== null ? Number(v.threshold) : 2,
      }));
      if (variants) product.variants = parsedVariants;

      const updatedProduct = await product.save();

      // Respond immediately to the client
      res.json(updatedProduct);

      // Asynchronously check and notify low stock in background without holding HTTP response
      setImmediate(async () => {
        try {
          for (const v of updatedProduct.variants) {
            const threshold = typeof v.threshold === 'number' ? v.threshold : 2;
            if (v.stock < threshold) {
              await checkAndNotifyLowStock(updatedProduct, v);
            }
          }
        } catch (notifyErr) {
          console.error('Background low stock check error:', notifyErr);
        }
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle product active / discontinued status
// @route   PATCH /api/products/:id/status
// @access  Private/Admin
const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.body.isActive !== undefined) {
      product.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    } else {
      product.isActive = product.isActive === false ? true : false;
    }

    await product.save();
    res.json({
      message: `Product ${product.isActive ? 'activated for storefront' : 'deactivated and hidden from storefront'} successfully`,
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getLowStockProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
};
