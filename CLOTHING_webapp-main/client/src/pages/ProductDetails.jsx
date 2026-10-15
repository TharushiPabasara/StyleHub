import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout, Spin, message, Modal } from 'antd';
import { ShoppingBag, Check, Minus, Plus, Ruler, Truck, RotateCcw } from 'lucide-react';
import Navbar from '../components/Navbar';
import AnnouncementBar from '../components/AnnouncementBar';
import { CartContext } from '../context/CartContext';
import { SettingsContext } from '../context/SettingsContext';
import { API_URL } from '../config/api';

const { Content } = Layout;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { settings } = useContext(SettingsContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  
  // Selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products/${id}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const data = await response.json();
      setProduct(data);
      if (data.images && data.images.length > 0) {
        setMainImage(data.images[0]);
      }
      
      // Auto-select size from first available variant with stock
      const inStockVar = data.variants?.find(v => v.stock > 0);
      if (inStockVar) {
        if (inStockVar.size) setSelectedSize(inStockVar.size);
      } else if (data.variants && data.variants.length > 0) {
        if (data.variants[0].size) setSelectedSize(data.variants[0].size);
      } else {
        setSelectedSize(null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      message.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout className="min-h-screen bg-white">
        <Navbar />
        <Content className="flex justify-center items-center h-[60vh]">
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout className="min-h-screen bg-white">
        <Navbar />
        <Content className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-serif mb-4 text-neutral-800">Product Not Found</h2>
          <button 
            onClick={() => navigate('/collections')}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
          >
            Back to Collections
          </button>
        </Content>
      </Layout>
    );
  }

  if (product.isActive === false) {
    return (
      <Layout className="min-h-screen bg-white">
        <Navbar />
        <Content className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-16">
          <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-2">
            CATALOG NOTICE
          </span>
          <h2 className="text-3xl md:text-4xl font-serif mb-3 text-neutral-900">
            This Product Has Been Discontinued
          </h2>
          <p className="text-sm text-neutral-500 max-w-md mb-8 leading-relaxed">
            The item you are looking for ({product.name}) has been discontinued and is no longer available for purchase on StyleHub.
          </p>
          <button 
            onClick={() => navigate('/collections')}
            className="px-8 py-3 bg-neutral-900 text-white rounded-lg hover:bg-black transition-all text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
          >
            Explore Active Collections
          </button>
        </Content>
      </Layout>
    );
  }

  // Derive sizes that were ACTUALLY added to this product
  const displaySizes = [...new Set(product.variants?.map(v => v.size?.trim()).filter(Boolean) || [])];

  // Current variant based on user selection
  const currentVariant = product.variants?.find(v => {
    return selectedSize ? v.size?.toLowerCase() === selectedSize.toLowerCase() : true;
  }) || (product.variants && product.variants.length > 0 ? product.variants[0] : null);

  const currentVariantStock = currentVariant ? currentVariant.stock : 0;
  const isCurrentSizeInStock = currentVariant ? currentVariant.stock > 0 : false;
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

  const handleAddToCart = () => {
    if (displaySizes.length > 0 && !selectedSize) {
      message.warning('Please select a size');
      return;
    }

    if (!currentVariant || currentVariant.stock < 1) {
      message.error('This variant is currently out of stock');
      return;
    }

    addToCart(product, currentVariant, quantity);
    navigate('/cart');
  };

  return (
    <Layout className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navbar />
      
      <Content className="max-w-7xl mx-auto w-full px-6 py-8 md:py-10">
        {/* Subtle Minimal Breadcrumbs */}
        <div className="mb-8 flex items-center gap-2 text-xs text-neutral-400 font-sans tracking-wide">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/collections/${product.category?.toLowerCase()}`} className="hover:text-neutral-900 transition-colors capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-neutral-500 capitalize">{product.subCategory}</span>
          <span>/</span>
          <span className="text-neutral-900 font-medium capitalize truncate max-w-xs">{product.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Images Section (Left) */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-20 md:max-h-[640px] no-scrollbar py-1">
              {product.images?.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`w-20 h-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    mainImage === img ? 'border-neutral-900 shadow-sm' : 'border-neutral-200/80 opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}

            </div>
            
            {/* Main Display */}
            <div className="flex-1 bg-[#faf9f6] h-[450px] md:h-[640px] rounded-2xl overflow-hidden border border-neutral-100 flex items-center justify-center shadow-sm">
              {mainImage ? (
                <img 
                  src={mainImage} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-all duration-300 hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Details Section (Right) */}
          <div className="w-full lg:w-1/2 flex flex-col justify-start">
            
            {/* Category Breadcrumb & In-Stock Status Badge */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                {(product.category || 'WOMENSWEAR').toUpperCase()} • {(product.subCategory || 'ATELIER ARCHIVE').toUpperCase()}
              </div>
              <div>
                {totalStock > 0 ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 border border-emerald-100/90">
                    IN STOCK
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-50 text-rose-600 border border-rose-100">
                    OUT OF STOCK
                  </span>
                )}
              </div>
            </div>

            {/* Product Title (Elegant Serif Typography) */}
            <h1 className="font-serif text-3xl md:text-[40px] text-neutral-900 tracking-tight font-normal leading-[1.15] mt-1 mb-2 capitalize">
              {product.name}
            </h1>

            {/* Price & Taxes Note */}
            <div className="flex items-baseline gap-3 mb-3">
              {product.hasDiscount ? (
                <div className="flex items-baseline gap-2.5">
                  <span className="font-serif text-3xl text-rose-700 font-bold tracking-tight">
                    LKR {product.discountedPrice?.toLocaleString()}
                  </span>
                  <span className="line-through text-neutral-400 text-base font-normal">
                    LKR {product.price?.toLocaleString()}
                  </span>
                  <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                    -{product.discountPercentage}% OFF
                  </span>
                </div>
              ) : (
                <span className="font-serif text-2xl text-neutral-900 font-medium tracking-tight">
                  LKR {product.price?.toLocaleString()}
                </span>
              )}
              <span className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                INCLUSIVE OF ALL TAXES
              </span>
            </div>

            {/* Active Category Discount Banner if present */}
            {product.hasDiscount && (
              <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔥</span>
                  <span>
                    <strong>{product.discountTitle || 'Special Category Promotion'}:</strong> Limited-time {product.discountPercentage}% discount applied!
                  </span>
                </div>
                {product.discountEndDate && (
                  <span className="text-[11px] font-semibold text-rose-600 whitespace-nowrap ml-2">
                    Valid until {new Date(product.discountEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            )}

            {/* Thin Horizontal Divider */}
            <div className="w-full h-px bg-neutral-200/70 mb-6" />

            {/* Product Description */}
            {product.description && (
              <p className="text-[13px] text-neutral-600 leading-relaxed font-sans mb-6 whitespace-pre-wrap">
                {product.description}
              </p>
            )}

            {/* Material Information Box */}
            {product.fabric && (
              <div className="bg-[#fcfbf9] border border-stone-200/70 rounded-xl p-4 mb-6">
                <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1">
                  MATERIAL COMPOSITION
                </div>
                <div className="text-xs font-semibold text-neutral-900 leading-snug">
                  {product.fabric}
                </div>
              </div>
            )}

            {/* SELECT SIZE Section (ONLY added variations are shown) */}
            {displaySizes.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold tracking-wider text-neutral-900 uppercase">
                    SELECT SIZE: {selectedSize ? selectedSize.toUpperCase() : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-4 cursor-pointer font-medium transition-colors"
                  >
                    Size Guide & Measurements
                  </button>
                </div>

                {/* Size Buttons Grid - ONLY added variations */}
                <div className="flex flex-wrap gap-2.5">
                  {displaySizes.map(sizeOption => {
                    const isSelected = selectedSize?.toLowerCase() === sizeOption.toLowerCase();

                    // Find variant stock for this specific size
                    const variantForSize = product.variants?.find(v => v.size?.toLowerCase() === sizeOption.toLowerCase());
                    const isOutOfStock = variantForSize ? variantForSize.stock <= 0 : false;

                    return (
                      <button
                        key={sizeOption}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedSize(sizeOption);
                          setQuantity(1);
                        }}
                        className={`min-w-[62px] h-11 px-4 rounded border text-xs font-bold uppercase transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                            : isOutOfStock
                            ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed line-through'
                            : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-900'
                        }`}
                      >
                        {sizeOption}
                      </button>
                    );
                  })}
                </div>

                {/* Stock & Dispatch Status Line */}
                {isCurrentSizeInStock ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 mt-4 mb-2">
                    <Check size={14} className="stroke-[2.5] text-emerald-600" />
                    <span>{currentVariantStock} items in stock • Ready for islandwide dispatch</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-600 mt-4 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>Currently out of stock for this size • Restocking soon</span>
                  </div>
                )}
              </div>
            )}

            {/* If product has no sizes, show general stock indicator */}
            {displaySizes.length === 0 && (
              <div className="mb-6">
                {totalStock > 0 ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <Check size={14} className="stroke-[2.5] text-emerald-600" />
                    <span>{totalStock} items in stock • Ready for islandwide dispatch</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>Currently out of stock</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Row: Quantity Stepper + Add To Bag Button */}
            <div className="flex items-center gap-3 mt-4 mb-8">
              {/* Stepper */}
              <div className="flex items-center justify-between border border-neutral-200 rounded-lg px-2 w-28 h-12 bg-white flex-shrink-0 shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || (!isCurrentSizeInStock && displaySizes.length > 0) || totalStock <= 0}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors cursor-pointer text-sm font-semibold select-none"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold text-neutral-900 select-none">
                  {(isCurrentSizeInStock || (displaySizes.length === 0 && totalStock > 0)) ? quantity : 0}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(displaySizes.length > 0 ? currentVariantStock : totalStock, q + 1))}
                  disabled={quantity >= (displaySizes.length > 0 ? currentVariantStock : totalStock) || (!isCurrentSizeInStock && displaySizes.length > 0) || totalStock <= 0}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors cursor-pointer text-sm font-semibold select-none"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={displaySizes.length > 0 ? !isCurrentSizeInStock : totalStock <= 0}
                className={`flex-1 h-12 rounded-lg flex items-center justify-center gap-2.5 text-xs md:text-sm font-bold tracking-wider uppercase transition-all shadow-sm ${
                  (displaySizes.length > 0 ? isCurrentSizeInStock : totalStock > 0)
                    ? 'bg-neutral-900 hover:bg-black text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-none'
                }`}
              >
                <ShoppingBag size={16} />
                <span>
                  {!(displaySizes.length > 0 ? isCurrentSizeInStock : totalStock > 0)
                    ? 'OUT OF STOCK' 
                    : `ADD TO BAG • LKR ${((product.discountedPrice || product.price) * (quantity || 1)).toLocaleString()}`}
                </span>
              </button>
            </div>

            {/* Delivery & Returns Value Props */}
            <div className={`grid ${settings?.enableFreeReturns !== false ? 'grid-cols-2' : 'grid-cols-1'} gap-4 text-xs text-neutral-500 border-t border-neutral-100 pt-6`}>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                  <Truck size={14} /> Islandwide Delivery
                </span>
                <span>
                  LKR {(settings?.shippingFee ?? 400).toLocaleString()} standard delivery • Free over LKR {(settings?.freeShippingThreshold ?? 15000).toLocaleString()}. Delivered in {settings?.estimatedDeliveryTime || '2 to 4 Business Days'}.
                </span>
              </div>
              {settings?.enableFreeReturns !== false && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                    <RotateCcw size={14} /> {settings?.returnPolicyTitle || 'Hassle-Free Returns'}
                  </span>
                  <span>
                    {settings?.returnPolicyDescription || `${settings?.returnPolicyDays || 14}-day return and exchange policy for unworn items with original tags.`}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </Content>

      {/* Size Guide Modal */}
      <Modal
        open={isSizeGuideOpen}
        onCancel={() => setIsSizeGuideOpen(false)}
        footer={null}
        title={
          <div className="font-serif text-lg text-neutral-900">
            Size Guide & Body Measurements
          </div>
        }
        centered
        width={580}
      >
        <div className="py-2">
          <p className="text-xs text-neutral-500 mb-4">
            All garment measurements are approximate and specified in inches. Fits true to standard international sizing.
          </p>
          <div className="overflow-x-auto rounded-lg border border-neutral-100">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Bust / Chest</th>
                  <th className="py-2.5 px-3">Waist</th>
                  <th className="py-2.5 px-3">Hips</th>
                  <th className="py-2.5 px-3">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                <tr><td className="py-2.5 px-3 font-bold text-neutral-900">XS</td><td className="py-2.5 px-3">32 - 34"</td><td className="py-2.5 px-3">24 - 26"</td><td className="py-2.5 px-3">34 - 36"</td><td className="py-2.5 px-3">48"</td></tr>
                <tr><td className="py-2.5 px-3 font-bold text-neutral-900">S</td><td className="py-2.5 px-3">34 - 36"</td><td className="py-2.5 px-3">26 - 28"</td><td className="py-2.5 px-3">36 - 38"</td><td className="py-2.5 px-3">48.5"</td></tr>
                <tr className="bg-neutral-50/70"><td className="py-2.5 px-3 font-bold text-neutral-900">M</td><td className="py-2.5 px-3">36 - 38"</td><td className="py-2.5 px-3">28 - 30"</td><td className="py-2.5 px-3">38 - 40"</td><td className="py-2.5 px-3">49"</td></tr>
                <tr><td className="py-2.5 px-3 font-bold text-neutral-900">L</td><td className="py-2.5 px-3">38 - 40"</td><td className="py-2.5 px-3">30 - 32"</td><td className="py-2.5 px-3">40 - 42"</td><td className="py-2.5 px-3">49.5"</td></tr>
                <tr><td className="py-2.5 px-3 font-bold text-neutral-900">XL</td><td className="py-2.5 px-3">40 - 42"</td><td className="py-2.5 px-3">32 - 34"</td><td className="py-2.5 px-3">42 - 44"</td><td className="py-2.5 px-3">50"</td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-[11px] text-neutral-600 flex items-center gap-2">
            <Ruler size={16} className="text-neutral-400 flex-shrink-0" />
            <span>Need personalized fit assistance? Our team is always here to assist with garment tailoring advice.</span>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ProductDetails;
