import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Layout, Checkbox, Slider, Select, Spin, Empty, Typography } from 'antd';
import { Filter, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import AnnouncementBar from '../components/AnnouncementBar';
import { API_URL } from '../config/api';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const SUB_CATEGORIES = {
  Menswear: ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Shorts', 'Sarongs'],
  Womenswear: ['T-Shirts', 'Blouses & Tops', 'Dresses', 'Frocks', 'Skirts', 'Trousers/Jeans', 'Sarees'],
  Accessories: ['Ties', 'Belts', 'Vests', 'Socks'],
};

const Collections = () => {
  const { categoryId } = useParams(); // e.g. 'menswear', 'womenswear'
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [selectedMainCategory, setSelectedMainCategory] = useState(categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1).toLowerCase() : 'All');
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState('newest');

  // Handle URL category changes
  useEffect(() => {
    if (categoryId) {
      let mainCat = categoryId.charAt(0).toUpperCase() + categoryId.slice(1).toLowerCase();
      if (mainCat === 'Mens') mainCat = 'Menswear';
      if (mainCat === 'Womens') mainCat = 'Womenswear';
      setSelectedMainCategory(mainCat);
    } else {
      setSelectedMainCategory('All');
    }
    // Also parse sub-categories from query if any
    const sub = searchParams.get('sub');
    if (sub) {
      setSelectedSubCategories([sub]);
    } else {
      setSelectedSubCategories([]);
    }
  }, [categoryId, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  const filteredProducts = products.filter(product => {
    // 0. Search Query
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery)) {
      return false;
    }
    // 1. Main Category
    if (selectedMainCategory !== 'All' && product.category !== selectedMainCategory) {
      return false;
    }
    // 2. Sub Category
    if (selectedSubCategories.length > 0) {
      const prodSub = (product.subCategory || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const isSubMatch = selectedSubCategories.some(sub => 
        sub === product.subCategory || sub.toLowerCase().replace(/[^a-z0-9]/g, '') === prodSub
      );
      if (!isSubMatch) return false;
    }
    // 3. Price
    if (product.price < priceRange[0] || product.price > priceRange[1]) {
      return false;
    }
    return true;
  });

  // Sort Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const handleSubCategoryChange = (sub, checked) => {
    if (checked) {
      setSelectedSubCategories([...selectedSubCategories, sub]);
    } else {
      setSelectedSubCategories(selectedSubCategories.filter(item => item !== sub));
    }
  };

  return (
    <Layout className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navbar />
      
      <Content className="max-w-7xl mx-auto w-full px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b pb-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">
              <Link to="/" className="hover:text-black">Home</Link> / 
              <span className="text-black ml-1 font-medium">
                {searchQuery ? 'Search Results' : (selectedMainCategory === 'All' ? 'All Products' : selectedMainCategory)}
              </span>
            </div>
            <Title level={2} className="!mb-0 !font-serif">
              {searchQuery ? `Search results for "${searchParams.get('search')}"` : (selectedMainCategory === 'All' ? 'Our Collection' : `${selectedMainCategory} Collection`)}
            </Title>
            <p className="text-gray-500 mt-2">{sortedProducts.length} Products Found</p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">Sort by:</span>
            <Select 
              value={sortBy} 
              onChange={setSortBy} 
              style={{ width: 180 }}
              bordered={false}
              className="border-b border-gray-300"
            >
              <Option value="newest">Newest Arrivals</Option>
              <Option value="price-low">Price: Low to High</Option>
              <Option value="price-high">Price: High to Low</Option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 font-semibold text-sm tracking-wider uppercase">
                <Filter size={16} /> Filters
              </div>
              <button 
                onClick={() => {
                  setSelectedMainCategory('All');
                  setSelectedSubCategories([]);
                  setPriceRange([0, 50000]);
                  setSortBy('newest');
                  navigate('/collections');
                }}
                className="text-xs text-gray-400 hover:text-black uppercase tracking-widest underline underline-offset-4"
              >
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-8 border-b border-gray-100 pb-8">
              <h3 className="font-semibold text-xs tracking-widest uppercase mb-6">Category</h3>
              <div className="flex flex-col gap-4">
                {['All', 'Menswear', 'Womenswear', 'Accessories'].map(cat => {
                  // Calculate count
                  const count = cat === 'All' 
                    ? products.length 
                    : products.filter(p => p.category === cat).length;
                  const formattedCount = count.toString().padStart(2, '0');

                  return (
                    <div key={cat} className="flex flex-col gap-3">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${selectedMainCategory === cat ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black'}`}>
                            {selectedMainCategory === cat && <Check size={12} strokeWidth={4} className="text-white" />}
                          </div>
                          <span className={`text-sm ${selectedMainCategory === cat ? 'text-black' : 'text-gray-500 group-hover:text-black transition-colors'}`}>{cat}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formattedCount}</span>
                        <input 
                          type="radio" 
                          className="hidden" 
                          name="mainCat" 
                          checked={selectedMainCategory === cat}
                          onChange={() => {
                            if (cat === 'All') {
                              navigate('/collections');
                            } else {
                              navigate(`/collections/${cat.toLowerCase()}`);
                            }
                            setSelectedSubCategories([]);
                          }} 
                        />
                      </label>
                      
                      {/* Nested Sub-Categories */}
                      {selectedMainCategory === cat && SUB_CATEGORIES[cat] && (
                        <div className="ml-7 flex flex-col gap-3 mb-1">
                          {SUB_CATEGORIES[cat].map(sub => (
                            <Checkbox 
                              key={sub}
                              checked={selectedSubCategories.includes(sub)}
                              onChange={(e) => handleSubCategoryChange(sub, e.target.checked)}
                              className="text-sm text-gray-500 hover:text-black m-0"
                            >
                              {sub}
                            </Checkbox>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>



            {/* Price Filter */}
            <div className="mb-8 border-b border-gray-100 pb-8">
              <h3 className="font-semibold text-xs tracking-widest uppercase mb-6">Price (LKR)</h3>
              <Slider 
                range 
                min={0} 
                max={50000} 
                step={500} 
                value={priceRange} 
                onChange={setPriceRange}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-4">
                <span>LKR {priceRange[0].toLocaleString()}</span>
                <span>LKR {priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : sortedProducts.length === 0 ? (
              <Empty description="No products match your filters." className="mt-20" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedProducts.map(product => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                  const isOutOfStock = totalStock === 0;
                  return (
                  <Link to={`/product/${product._id}`} key={product._id} className={`group ${isOutOfStock ? 'opacity-60 hover:opacity-80' : 'cursor-pointer'}`}>
                    <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-sm">
                      {isOutOfStock && (
                        <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[10px] uppercase tracking-widest px-2 py-1 font-medium shadow-md">
                          Out of Stock
                        </div>
                      )}
                      {product.hasDiscount && (
                        <div className="absolute top-4 right-4 z-20 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-md">
                          -{product.discountPercentage}% OFF
                        </div>
                      )}
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className={`w-full h-full object-cover transition-transform duration-700 ${!isOutOfStock && 'group-hover:scale-105'}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                      
                      {/* Hover Overlay Button */}
                      {!isOutOfStock && (
                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <div className="w-full bg-black/90 text-white text-center py-3 text-sm font-medium backdrop-blur-sm shadow-xl">
                            View Details
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{product.category}</div>
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-1">{product.name}</h3>
                      {product.hasDiscount ? (
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-bold text-rose-700">LKR {product.discountedPrice.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 line-through">LKR {product.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-900 mt-1">LKR {product.price.toLocaleString()}</p>
                      )}
                    </div>
                  </Link>
                )})}
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Collections;
