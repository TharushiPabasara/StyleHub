const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');

const sampleProducts = [
  {
    name: 'Structured Wool Blazer',
    description: 'Expertly tailored blazer crafted from fine Australian merino wool. Designed with a modern relaxed silhouette, notched lapels, and horn buttons.',
    category: 'Menswear',
    subCategory: 'Shirts',
    fabric: 'Merino Wool',
    price: 45000,
    images: ['/images/product-1.jpg'],
    variants: [
      { size: 'S', stock: 6, threshold: 2 },
      { size: 'M', stock: 10, threshold: 2 },
      { size: 'L', stock: 8, threshold: 2 },
      { size: 'XL', stock: 4, threshold: 2 }
    ],
    isActive: true
  },
  {
    name: 'Silk Drape Dress',
    description: 'An elegant fluid silhouette cut from lustrous mulberry silk. Features asymmetric drape detailing and an effortless fit suitable for evening occasions.',
    category: 'Womenswear',
    subCategory: 'Dresses',
    fabric: 'Mulberry Silk',
    price: 32000,
    images: ['/images/product-2.jpg'],
    variants: [
      { size: 'XS', stock: 4, threshold: 2 },
      { size: 'S', stock: 8, threshold: 2 },
      { size: 'M', stock: 12, threshold: 2 },
      { size: 'L', stock: 6, threshold: 2 }
    ],
    isActive: true
  },
  {
    name: 'Volume Tailored Trousers',
    description: 'Wide-leg tailored trousers cut from crisp high-density cotton twill. Double front pleats, concealed hook-and-bar closure, and slant pockets.',
    category: 'Menswear',
    subCategory: 'Trousers',
    fabric: 'Italian Cotton Twill',
    price: 28000,
    images: ['/images/product-3.jpg'],
    variants: [
      { size: '30', stock: 6, threshold: 2 },
      { size: '32', stock: 12, threshold: 2 },
      { size: '34', stock: 8, threshold: 2 },
      { size: '36', stock: 4, threshold: 2 }
    ],
    isActive: true
  },
  {
    name: 'Cashmere Knit Sweater',
    description: 'Spun from pure grade-A Mongolian cashmere with a cloud-soft handle. Finished with refined ribbed trims and a relaxed crew neckline.',
    category: 'Womenswear',
    subCategory: 'Blouses & Tops',
    fabric: '100% Mongolian Cashmere',
    price: 51000,
    images: ['/images/product-4.jpg'],
    variants: [
      { size: 'S', stock: 5, threshold: 2 },
      { size: 'M', stock: 9, threshold: 2 },
      { size: 'L', stock: 4, threshold: 2 }
    ],
    isActive: true
  },
  {
    name: 'Classic Leather Dress Belt',
    description: 'Handcrafted full-grain leather belt featuring a polished palladium-finish buckle with subtle beveled edge detailing.',
    category: 'Accessories',
    subCategory: 'Belts',
    fabric: 'Full-Grain Calfskin Leather',
    price: 8500,
    images: ['/images/cat-accessories.jpg'],
    variants: [
      { size: 'Standard', stock: 25, threshold: 3 }
    ],
    isActive: true
  },
  {
    name: 'Woven Jacquard Silk Tie',
    description: 'Refined silk tie woven with a delicate micro-geometric pattern. Hand-stitched bar tacks and wool interlining ensure an impeccable drape and knot.',
    category: 'Accessories',
    subCategory: 'Ties',
    fabric: '100% Woven Silk',
    price: 6200,
    images: ['/images/cat-accessories.jpg'],
    variants: [
      { size: 'Standard', stock: 18, threshold: 3 }
    ],
    isActive: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding Products...');

    const existingCount = await Product.countDocuments();
    if (existingCount === 0) {
      await Product.insertMany(sampleProducts);
      console.log(`✅ Successfully seeded ${sampleProducts.length} sample products!`);
    } else {
      console.log(`ℹ️ Products already exist (${existingCount} products in DB). Skipping.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

seed();
