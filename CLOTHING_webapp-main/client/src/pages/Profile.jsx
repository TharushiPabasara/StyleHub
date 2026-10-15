import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Form, Input, Button, message, Spin, Modal, Rate, Select } from 'antd';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Check, Package, Calendar, CreditCard, Hash, Star, XCircle, AlertCircle, Truck, Clock, CheckCircle2 } from 'lucide-react';
import AnnouncementBar from '../components/AnnouncementBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_URL } from '../config/api';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayLocation, setDisplayLocation] = useState('Add your location');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cancel Order Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [customReason, setCustomReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo?.token) return;
      const response = await fetch(`${API_URL}/api/orders/myorders`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          form.setFieldsValue({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address || {},
          });

          if (data.address?.city || data.address?.country) {
            setDisplayLocation(`${data.address.city || ''}${data.address.city && data.address.country ? ', ' : ''}${data.address.country || ''}`);
          }
        } else {
          message.error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('An error occurred while fetching your profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
      fetchOrders();
    }
  }, [user, form, fetchOrders]);

  const openReviewModal = (product, orderId) => {
    setReviewingProduct(product);
    setReviewingOrder(orderId);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewComment.trim()) {
      return message.warning('Please provide both a rating and a comment.');
    }

    setSubmittingReview(true);
    const prodId = reviewingProduct?._id || reviewingProduct;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({
          productId: prodId,
          orderId: reviewingOrder,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Review submitted successfully! It is pending approval.');
        setReviewModalVisible(false);
        // Optimistically update order item review status
        setOrders(prevOrders => prevOrders.map(order => {
          if (order._id === reviewingOrder) {
            return {
              ...order,
              orderItems: order.orderItems.map(item => {
                const currentProdId = item.product?._id ? item.product._id.toString() : (item.product ? item.product.toString() : '');
                const targetProdId = prodId ? prodId.toString() : '';
                if (currentProdId === targetProdId) {
                  return { ...item, isReviewed: true };
                }
                return item;
              })
            };
          }
          return order;
        }));
        fetchOrders();
      } else {
        if (data.message && data.message.toLowerCase().includes('already reviewed')) {
          setOrders(prevOrders => prevOrders.map(order => {
            if (order._id === reviewingOrder) {
              return {
                ...order,
                orderItems: order.orderItems.map(item => {
                  const currentProdId = item.product?._id ? item.product._id.toString() : (item.product ? item.product.toString() : '');
                  const targetProdId = prodId ? prodId.toString() : '';
                  if (currentProdId === targetProdId) {
                    return { ...item, isReviewed: true };
                  }
                  return item;
                })
              };
            }
            return order;
          }));
        }
        message.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      message.error('An error occurred. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openCancelModal = (order) => {
    setCancellingOrder(order);
    setCancelReason('Changed my mind');
    setCustomReason('');
    setCancelModalVisible(true);
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    if (cancelReason === 'Other' && !customReason.trim()) {
      return message.warning('Please provide a reason for cancellation.');
    }

    setSubmittingCancel(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const finalReason = cancelReason === 'Other'
        ? (customReason.trim() || 'Other')
        : (customReason.trim() ? `${cancelReason} - ${customReason.trim()}` : cancelReason);

      const response = await fetch(`${API_URL}/api/orders/${cancellingOrder._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify({ reason: finalReason })
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Order cancelled successfully.');
        setCancelModalVisible(false);
        setCancellingOrder(null);
        fetchOrders();
      } else {
        message.error(data.message || 'Failed to cancel order.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      message.error('An error occurred while cancelling the order.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const isOrderCancellable = (status) => {
    return status === 'Pending';
  };

  const getOrderStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Shipped':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Profile updated successfully');
        const updatedUserInfo = { ...userInfo, name: data.name, email: data.email };
        login(updatedUserInfo);

        if (values.address?.city || values.address?.country) {
          setDisplayLocation(`${values.address.city || ''}${values.address.city && values.address.country ? ', ' : ''}${values.address.country || ''}`);
        }
      } else {
        message.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('An error occurred while updating your profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#fafafa]">
        <Spin size="large" />
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <div className="min-h-screen bg-[#fafafa] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#111]">
      <div className="max-w-3xl mx-auto">

        {/* Header Section */}
        <div className="flex justify-between items-end mb-12 border-b border-gray-100 pb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Account Sanctuary</p>
            <h1 className="text-5xl font-serif tracking-tight text-gray-900">Personal Profile</h1>
          </div>
          <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600 hover:text-black flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>

        {/* User Overview Section */}
        <div className="flex items-center gap-6 mb-16">
          <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-xl font-serif tracking-wider shadow-sm">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-xl font-serif text-gray-900 mb-1">{user?.name}</h2>
            <p className="text-sm text-gray-500 mb-1">{user?.email}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={12} /> {displayLocation}
            </p>
          </div>
        </div>

        {/* Form Section */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-12"
        >
          {/* Personal Details */}
          <div>
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-serif text-gray-900 mb-1">Personal Details</h3>
              <p className="text-xs text-gray-500">Manage your personal identity and direct contact information.</p>
            </div>

            <div className="space-y-6">
              <Form.Item
                label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">Full Name</span>}
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
                className="mb-0"
              >
                <Input
                  size="large"
                  className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                />
              </Form.Item>



              <Form.Item
                label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">Phone Number</span>}
                className="mb-0"
              >
                <div className="flex">
                  <div className="bg-[#f4f4f4] px-4 py-3 border-r border-white flex items-center justify-center rounded-l-sm min-w-[80px]">
                    <span className="text-xs font-bold text-gray-900">LK<br />(+94)</span>
                  </div>
                  <Form.Item name="phone" noStyle>
                    <Input
                      size="large"
                      placeholder="77 123 4567"
                      className="rounded-none rounded-r-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium w-full"
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-serif text-gray-900 mb-1">Shipping Address</h3>
              <p className="text-xs text-gray-500">Your default sanctuary address for bespoke hand-couriered releases.</p>
            </div>

            <div className="space-y-6">
              <Form.Item
                label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">Recipient Name</span>}
                name={['address', 'recipientName']}
                className="mb-0"
              >
                <Input
                  size="large"
                  className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">Street Address / Address Line 01</span>}
                name={['address', 'streetAddress']}
                className="mb-0"
              >
                <Input
                  size="large"
                  className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">Address Line 02 (Locality / Landmark)</span>}
                name={['address', 'addressLine2']}
                className="mb-0"
              >
                <Input
                  size="large"
                  className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">City</span>}
                  name={['address', 'city']}
                  className="mb-0"
                >
                  <Input
                    size="large"
                    className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">Postal Code</span>}
                  name={['address', 'postalCode']}
                  className="mb-0"
                >
                  <Input
                    size="large"
                    className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">District</span>}
                  name={['address', 'district']}
                  className="mb-0"
                >
                  <Input
                    size="large"
                    className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900">Country / Sovereign State</span>}
                  name={['address', 'country']}
                  className="mb-0"
                >
                  <Input
                    size="large"
                    className="rounded-sm border-0 bg-[#f4f4f4] hover:bg-[#eaeaea] focus:bg-[#eaeaea] shadow-none px-4 py-3 text-sm transition-colors text-gray-900 font-medium"
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-12 mb-16">
            <button
              type="button"
              onClick={() => form.resetFields()}
              className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 hover:text-black transition-colors"
            >
              Discard Changes
            </button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              className="bg-black hover:bg-gray-900 focus:bg-black text-white rounded-sm px-8 h-12 text-[11px] font-bold tracking-[0.1em] uppercase border-0 flex items-center justify-center gap-2"
            >
              <Check size={14} strokeWidth={3} /> Save Changes
            </Button>
          </div>
        </Form>

        {/* My Orders Section */}
        <div className="mt-20">
          <div className="mb-8 border-b border-gray-200 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-serif text-gray-900 mb-1">Order History</h3>
              <p className="text-sm text-gray-500">Track and view your recent purchases.</p>
            </div>
            <Package size={24} className="text-gray-300" strokeWidth={1.5} />
          </div>

          {loadingOrders ? (
            <div className="py-12 flex justify-center"><Spin /></div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 text-center border border-gray-100 rounded shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={24} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-serif text-gray-900 mb-2">No Orders Yet</h4>
              <p className="text-gray-500 mb-6 text-sm">Looks like you haven't made your first purchase.</p>
              <Link to="/collections" className="inline-block bg-black text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                Explore Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order._id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 group">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-gray-400" />
                        <p className="text-sm font-bold text-gray-900">{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        <p>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                        <p className="text-sm font-bold text-gray-900">LKR {order.totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Order:</span>
                          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOrderStatusStyle(order.orderStatus)}`}>
                            {order.orderStatus}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Payment:</span>
                          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                            {order.paymentStatus}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.orderItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center p-3 rounded-md hover:bg-gray-50 transition-colors">
                          <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <p className="text-sm font-medium text-gray-900 mb-1">{item.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {item.variant?.size && <span>Size: {item.variant.size}</span>}
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-sm font-medium text-gray-900">LKR {(item.price * item.quantity).toLocaleString()}</p>
                            {order.orderStatus === 'Delivered' && (
                              item.isReviewed ? (
                                <button 
                                  disabled
                                  className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded flex items-center gap-1 cursor-not-allowed select-none"
                                >
                                  <Check size={11} strokeWidth={2.5} /> Reviewed
                                </button>
                              ) : (
                                <button 
                                  onClick={() => openReviewModal(item.product, order._id)}
                                  className="text-[10px] font-bold uppercase tracking-wider text-white bg-black px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                  <Star size={10} fill="currentColor" /> Review Product
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Order Footer */}
                  <div className="bg-gray-50/70 px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CreditCard size={13} className="text-gray-400" /> {order.paymentMethod}
                      </span>
                      {order.orderStatus === 'Cancelled' && (
                        <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <XCircle size={12} /> {order.cancelReason ? `Cancelled: ${order.cancelReason}` : 'Cancelled'}
                        </span>
                      )}
                      {order.orderStatus === 'Processing' && (
                        <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <Clock size={12} /> Processing (Cannot be cancelled)
                        </span>
                      )}
                      {order.orderStatus === 'Shipped' && (
                        <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <Truck size={12} /> Dispatched (Cannot be cancelled)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isOrderCancellable(order.orderStatus) && (
                        <button
                          type="button"
                          onClick={() => openCancelModal(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-white bg-white hover:bg-rose-600 border border-rose-300 hover:border-rose-600 rounded transition-all duration-200 shadow-sm cursor-pointer"
                          title="Cancel this order before it is dispatched"
                        >
                          <XCircle size={14} />
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Review Modal */}
    <Modal
      title={<span className="font-serif text-xl">Leave a Review</span>}
      open={reviewModalVisible}
      onCancel={() => setReviewModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setReviewModalVisible(false)} className="rounded-sm">Cancel</Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={submittingReview} 
          onClick={submitReview}
          className="bg-black hover:bg-gray-800 text-white rounded-sm"
        >
          Submit Review
        </Button>
      ]}
    >
      <div className="py-4">
        <p className="text-sm text-gray-600 mb-4">How was your experience with <strong>{reviewingProduct?.name || 'this product'}</strong>?</p>
        
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Your Rating</p>
          <Rate value={reviewRating} onChange={setReviewRating} className="text-yellow-500" />
        </div>
        
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Your Comment</p>
          <Input.TextArea 
            rows={4} 
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Tell us what you think about the quality, fit, and style..."
            className="rounded-sm"
          />
        </div>
      </div>
    </Modal>

    {/* Cancel Order Modal */}
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <AlertCircle size={20} />
          <span className="font-serif text-xl text-gray-900">Cancel Order</span>
        </div>
      }
      open={cancelModalVisible}
      onCancel={() => !submittingCancel && setCancelModalVisible(false)}
      footer={[
        <Button 
          key="cancel" 
          onClick={() => setCancelModalVisible(false)} 
          disabled={submittingCancel}
          className="rounded-sm"
        >
          Keep Order
        </Button>,
        <Button 
          key="confirm-cancel" 
          danger 
          type="primary" 
          loading={submittingCancel} 
          onClick={handleCancelOrder}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-sm border-0 font-medium"
        >
          Confirm Cancellation
        </Button>
      ]}
      centered
    >
      {cancellingOrder && (
        <div className="py-4 space-y-4">
          <div className="bg-gray-50 p-4 rounded border border-gray-100 text-xs text-gray-600 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">Order ID:</span>
              <span className="font-bold text-gray-900">#{cancellingOrder._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">Current Status:</span>
              <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                Pending
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">Total Price:</span>
              <span className="font-bold text-gray-900">LKR {cancellingOrder.totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">Items:</span>
              <span className="text-gray-900 font-medium">
                {cancellingOrder.orderItems.reduce((acc, item) => acc + item.quantity, 0)} item(s)
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <Clock size={13} /> Cancellation Policy Notice
            </p>
            <p>
              Orders can only be cancelled while in <strong>Pending</strong> status. Once an order moves to Processing or Shipped, it can no longer be cancelled. Once cancelled, reserved product inventory is restored immediately.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Reason for Cancellation
            </label>
            <Select
              value={cancelReason}
              onChange={(val) => setCancelReason(val)}
              className="w-full"
              options={[
                { value: 'Changed my mind', label: 'Changed my mind' },
                { value: 'Found a cheaper / better alternative', label: 'Found a cheaper / better alternative' },
                { value: 'Ordered wrong item or size', label: 'Ordered wrong item or size' },
                { value: 'Need to change shipping address', label: 'Need to change shipping address' },
                { value: 'Delivery takes too long', label: 'Delivery takes too long' },
                { value: 'Accidental order placed', label: 'Accidental order placed' },
                { value: 'Other', label: 'Other (specify below)' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Additional Details {cancelReason === 'Other' ? <span className="text-rose-500">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
            </label>
            <Input.TextArea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={cancelReason === 'Other' ? 'Please explain why you want to cancel...' : 'Any additional feedback for our team (optional)...'}
              className="rounded-sm"
            />
          </div>
        </div>
      )}
    </Modal>
    
    <Footer />
    </>
  );
};

export default Profile;
