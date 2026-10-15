import React, { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import { Star, Quote } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';
import { API_URL } from '../config/api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        } else {
          message.error('Failed to load reviews');
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      
      <div className="bg-[#fafafa] min-h-screen pt-20 pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-5xl font-serif tracking-tight text-gray-900 mb-6">Customer Testimonials</h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              Discover what our community has to say about their StyleHub experiences. Real reviews from real patrons of Sri Lankan fashion.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-lg">
              <Star size={40} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-xl font-serif text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500">Be the first to share your StyleHub experience!</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {reviews.map((review) => (
                <div key={review._id} className="break-inside-avoid bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-6 border-b border-gray-50 pb-6">
                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-serif text-lg">
                      {getInitials(review.user?.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{review.user?.name || 'Anonymous'}</h3>
                      <div className="flex text-yellow-500 text-xs mt-1">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 text-gray-100 w-8 h-8 -z-10 transform -rotate-12" />
                    <p className="text-gray-700 leading-relaxed z-10 relative italic">"{review.comment}"</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-3">
                    {review.product?.image ? (
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={review.product.image} alt={review.product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        <Star size={14} />
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Purchased</p>
                      <p className="text-xs font-medium text-gray-900 truncate max-w-[200px]">{review.product?.name || 'StyleHub Product'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Reviews;
