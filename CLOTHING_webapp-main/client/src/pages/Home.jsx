import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Row, Col, Layout, Typography, Divider, Spin } from 'antd';
import { ShieldCheck, Truck, RefreshCw, Sparkles } from 'lucide-react';

import Navbar from '../components/Navbar';
import AnnouncementBar from '../components/AnnouncementBar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { SettingsContext } from '../context/SettingsContext';
import { API_URL } from '../config/api';

import product1 from '../assets/images/product-1.jpg';
import product2 from '../assets/images/product-2.jpg';
import product3 from '../assets/images/product-3.jpg';
import product4 from '../assets/images/product-4.jpg';
import catMenswear from '../assets/images/cat-menswear.jpg';
import catWomenswear from '../assets/images/cat-womenswear.jpg';
import catAccessories from '../assets/images/cat-accessories.jpg';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const fallbackProducts = [
  { _id: '1', name: "Structured Wool Blazer", price: 45000, images: [product1], tag: "New", category: "Menswear" },
  { _id: '2', name: "Silk Drape Dress", price: 32000, images: [product2], category: "Womenswear" },
  { _id: '3', name: "Volume Trousers", price: 28000, images: [product3], category: "Menswear" },
  { _id: '4', name: "Cashmere Knit", price: 51000, images: [product4], tag: "Trending", category: "Womenswear" },
];

const categories = [
  { id: 1, title: 'Menswear', link: '/collections/menswear', img: catMenswear, span: 8 },
  { id: 2, title: 'Womenswear', link: '/collections/womenswear', img: catWomenswear, span: 8 },
  { id: 3, title: 'Accessories', link: '/collections/accessories', img: catAccessories, span: 8 }
];

const Home = () => {
  const { settings } = useContext(SettingsContext);
  const [reviews, setReviews] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // Sort by creation date descending to ensure latest products first, then take the last 4
            const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setLatestProducts(sorted.slice(0, 4));
          }
        }
      } catch (error) {
        console.error('Error fetching latest products for new arrivals:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.slice(0, 10)); // Get latest 10 approved reviews
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchLatestProducts();
    fetchReviews();
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333333%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>
      <AnnouncementBar />
      <Navbar />
      <Content>
        <Hero />

        {/* Features Strip */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} md={8} className="flex flex-col items-center text-center">
                <Truck size={28} strokeWidth={1} className="mb-4 text-gray-800" />
                <Title level={5} className="!mb-1 !font-semibold">Complimentary Shipping</Title>
                <Text type="secondary" className="text-sm">
                  On all orders over Rs. {(settings?.freeShippingThreshold || 15000).toLocaleString()}
                </Text>
              </Col>
              {settings?.enableFreeReturns !== false ? (
                <Col xs={24} md={8} className="flex flex-col items-center text-center">
                  <RefreshCw size={28} strokeWidth={1} className="mb-4 text-gray-800" />
                  <Title level={5} className="!mb-1 !font-semibold">{settings?.returnPolicyTitle || 'Free Returns'}</Title>
                  <Text type="secondary" className="text-sm">
                    {settings?.returnPolicyDescription || `Within ${settings?.returnPolicyDays || 14} days of purchase`}
                  </Text>
                </Col>
              ) : (
                <Col xs={24} md={8} className="flex flex-col items-center text-center">
                  <Sparkles size={28} strokeWidth={1} className="mb-4 text-gray-800" />
                  <Title level={5} className="!mb-1 !font-semibold">Boutique Craftsmanship</Title>
                  <Text type="secondary" className="text-sm">
                    Handpicked fabrics & exclusive modern luxury
                  </Text>
                </Col>
              )}
              <Col xs={24} md={8} className="flex flex-col items-center text-center">
                <ShieldCheck size={28} strokeWidth={1} className="mb-4 text-gray-800" />
                <Title level={5} className="!mb-1 !font-semibold">Secure Checkout</Title>
                <Text type="secondary" className="text-sm">100% encrypted payment</Text>
              </Col>
            </Row>
          </div>
        </div>

        {/* New Arrivals */}
        <section className="py-24 px-6 lg:px-16 max-w-[1400px] mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <Text className="text-gray-500 tracking-widest uppercase text-xs font-semibold mb-2 block">Latest Drops</Text>
              <Title level={2} className="!font-serif !m-0 !text-4xl">New Arrivals</Title>
            </div>
            <Link to="/collections" className="text-sm font-medium border-b border-black pb-0.5 hover:text-gray-600 transition-colors hidden md:block">
              View All Pieces
            </Link>
          </div>

          {loadingProducts ? (
            <div className="py-20 flex justify-center items-center">
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[32, 48]}>
              {(latestProducts.length > 0 ? latestProducts : fallbackProducts).map((product) => {
                const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 1;
                const isOutOfStock = totalStock === 0;
                const productImage = (product.images && product.images.length > 0) ? product.images[0] : (product.img || product1);
                const productLink = product._id && product._id !== '1' && product._id !== '2' && product._id !== '3' && product._id !== '4'
                  ? `/product/${product._id}`
                  : '/collections';

                return (
                  <Col xs={24} sm={12} lg={6} key={product._id || product.id}>
                    <Link to={productLink} className="group block cursor-pointer">
                      <div className="relative overflow-hidden aspect-[3/4] mb-4 bg-gray-100 rounded-sm">
                        {isOutOfStock ? (
                          <div className="absolute top-4 left-4 z-20 bg-rose-600 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 font-semibold rounded-xs shadow-sm">
                            Out of Stock
                          </div>
                        ) : product.hasDiscount ? (
                          <div className="absolute top-4 left-4 z-20 bg-rose-600 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 font-semibold rounded-xs shadow-sm">
                            -{product.discountPercentage}% OFF
                          </div>
                        ) : (
                          <div className="absolute top-4 left-4 z-20 bg-black text-white text-[10px] uppercase tracking-widest px-2.5 py-1 font-semibold rounded-xs shadow-sm">
                            New
                          </div>
                        )}
                        <img 
                          src={productImage} 
                          alt={product.name} 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                        />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                          <Button 
                            type="default" 
                            className="bg-white/90 backdrop-blur-sm border-none w-10/12 h-12 text-sm font-semibold tracking-wider hover:!bg-black hover:!text-white transition-colors duration-300 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 shadow-md"
                          >
                            VIEW PIECE
                          </Button>
                        </div>
                      </div>
                      <div className="text-center">
                        <Text className="text-gray-500 text-xs tracking-widest uppercase mb-1 block">{product.category || 'StyleHub'}</Text>
                        <Title level={5} className="!font-normal !mb-1 !text-base group-hover:text-gray-600 transition-colors line-clamp-1">{product.name}</Title>
                        {product.hasDiscount ? (
                          <div className="flex items-baseline justify-center gap-2 mt-1">
                            <span className="font-bold text-rose-700">LKR {product.discountedPrice.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 line-through">LKR {product.price.toLocaleString()}</span>
                          </div>
                        ) : (
                          <Text className="font-medium">LKR {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}</Text>
                        )}
                      </div>
                    </Link>
                  </Col>
                );
              })}
            </Row>
          )}
          <div className="mt-12 text-center md:hidden">
            <Link to="/collections">
              <Button type="default" className="w-full h-12 border-black text-black">View All Pieces</Button>
            </Link>
          </div>
        </section>

        {/* Curated Categories */}
        <section className="pb-24 px-6 lg:px-16 max-w-[1400px] mx-auto">
          <Title level={2} className="!font-serif !text-4xl text-center !mb-12">Curated For You</Title>
          <Row gutter={[24, 24]}>
            {categories.map((category) => (
              <Col xs={24} md={category.span} key={category.id}>
                <Link to={category.link} className="block relative overflow-hidden aspect-[4/5] group cursor-pointer">
                  <img 
                    src={category.img} 
                    alt={category.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <h3 className="text-white text-3xl font-serif mb-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      {category.title}
                    </h3>
                    <div className="overflow-hidden">
                      <span className="text-white text-sm font-medium tracking-widest uppercase border-b border-white/40 pb-1 inline-block transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                        Shop Collection
                      </span>
                    </div>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </section>

        {/* Reviews Marquee */}
        {reviews.length > 0 && (
          <section className="py-24 border-t border-gray-100 overflow-hidden bg-white">
            <div className="text-center mb-12">
              <Text className="text-gray-500 tracking-widest uppercase text-xs font-semibold mb-2 block">Customer Voices</Text>
              <Title level={2} className="!font-serif !text-4xl">Loved by Patrons</Title>
            </div>
            
            <div className="relative flex overflow-x-hidden">
              <div className="animate-marquee whitespace-nowrap flex w-max">
                {[...reviews, ...reviews, ...reviews].map((review, idx) => (
                  <div key={`${review._id}-${idx}`} className="w-80 md:w-96 mx-4 p-6 border border-gray-100 rounded-lg shadow-sm bg-[#fafafa] flex-shrink-0 whitespace-normal inline-block align-top cursor-pointer">
                    <div className="flex text-yellow-500 text-xs mb-3">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <p className="text-gray-700 italic mb-6 line-clamp-3">"{review.comment}"</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-serif text-sm">
                        {review.user?.name ? review.user.name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 block">{review.user?.name || 'Anonymous'}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{review.product?.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter Section */}
        <section className="bg-gray-100 py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <Title level={2} className="!font-serif !text-4xl !mb-4">Join the Club.</Title>
            <Paragraph className="text-gray-600 mb-8 text-lg">
              Subscribe to receive early access to new collections, exclusive events, and styling advice.
            </Paragraph>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="flex-1 bg-transparent border-b border-gray-400 focus:border-black outline-none px-2 py-3 text-base transition-colors"
              />
              <Button type="primary" size="large" className="rounded-none h-12 px-8 uppercase tracking-widest text-xs font-semibold">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </Content>

      <Footer />
    </>
  );
};

export default Home;
