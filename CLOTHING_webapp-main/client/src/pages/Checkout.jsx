import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Form, Input, Button, Typography, Divider, Radio, message, Space } from 'antd';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import AnnouncementBar from '../components/AnnouncementBar';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { API_URL } from '../config/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const Checkout = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Check for stock validation upon entering checkout
    const invalidItems = cartItems.filter(item => item.quantity > item.variant.stock);
    if (invalidItems.length > 0) {
      message.error('Some items in your cart exceed available stock. Please review your cart.');
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.token) {
        try {
          const res = await fetch(`${API_URL}/api/users/profile`, {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          });
          const data = await res.json();
          if (res.ok && data) {
            form.setFieldsValue({
              firstName: data.address?.recipientName ? data.address.recipientName.split(' ')[0] : (data.name ? data.name.split(' ')[0] : ''),
              lastName: data.address?.recipientName ? data.address.recipientName.split(' ').slice(1).join(' ') : (data.name ? data.name.split(' ').slice(1).join(' ') : ''),
              phone: data.phone || '',
              address: data.address?.streetAddress ? `${data.address.streetAddress}${data.address.addressLine2 ? ', ' + data.address.addressLine2 : ''}` : '',
              city: data.address?.city || '',
              postalCode: data.address?.postalCode || '',
            });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };
    fetchUserProfile();
  }, [user, form]);

  const getItemPrice = (item) => item.product.discountedPrice || item.product.price;
  const subtotal = cartItems.reduce((acc, item) => acc + (getItemPrice(item) * item.quantity), 0);

  const shippingFee = settings?.shippingFee !== undefined ? Number(settings.shippingFee) : 400;
  const freeThreshold = settings?.freeShippingThreshold !== undefined ? Number(settings.freeShippingThreshold) : 15000;
  const isFreeShipping = subtotal >= freeThreshold;
  const shipping = isFreeShipping ? 0 : shippingFee;
  const total = subtotal + shipping;

  const onFinish = async (values) => {
    // Check for stock validation
    const invalidItems = cartItems.filter(item => item.quantity > item.variant.stock);
    if (invalidItems.length > 0) {
      message.error('Some items in your cart exceed available stock. Please review your cart.');
      navigate('/cart');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          image: item.variant.image || (item.product.images && item.product.images[0]),
          price: getItemPrice(item),
          product: item.product._id,
          variant: {
            size: item.variant.size
          }
        })),
        shippingDetails: {
          firstName: values.firstName,
          lastName: values.lastName,
          address: values.address,
          city: values.city,
          postalCode: values.postalCode,
          phone: values.phone,
          email: values.email
        },
        shippingPrice: shipping,
        paymentMethod: values.paymentMethod,
        user: user ? user._id : undefined,
      };

      if (values.paymentMethod === 'Card Payment') {
        setLoading(false);
        navigate('/payment', { state: { orderData, shippingPrice: shipping, subtotal, total } });
        return;
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      message.success('Order placed successfully!');
      clearCart();
      navigate('/checkout-success', { state: { orderId: data._id } });

    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <Layout className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navbar />

      <Content className="max-w-7xl mx-auto w-full px-6 py-12">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Bag
        </Link>

        <Title level={2} className="!mb-8 !font-serif">Checkout</Title>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Form */}
          <div className="w-full lg:w-2/3">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                paymentMethod: user ? 'Cash on Delivery' : 'Card Payment',
                email: user ? user.email : '',
                firstName: user ? user.name.split(' ')[0] : '',
                lastName: user ? user.name.split(' ').slice(1).join(' ') : '',
              }}
              className="space-y-8"
            >
              {/* Contact Info */}
              <div>
                <Title level={4} className="!font-serif !mb-4">Contact Information</Title>
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input size="large" placeholder="Email address" className="rounded-none border-gray-300" />
                </Form.Item>
              </div>

              {/* Shipping Details */}
              <div>
                <Title level={4} className="!font-serif !mb-4">Shipping Address</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <Form.Item
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input size="large" placeholder="First name" className="rounded-none border-gray-300" />
                  </Form.Item>
                  <Form.Item
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input size="large" placeholder="Last name" className="rounded-none border-gray-300" />
                  </Form.Item>
                </div>

                <Form.Item
                  name="address"
                  rules={[{ required: true, message: 'Please enter your address' }]}
                >
                  <Input size="large" placeholder="Address" className="rounded-none border-gray-300" />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <Form.Item
                    name="city"
                    rules={[{ required: true, message: 'Please enter your city' }]}
                  >
                    <Input size="large" placeholder="City" className="rounded-none border-gray-300" />
                  </Form.Item>
                  <Form.Item
                    name="postalCode"
                    rules={[{ required: true, message: 'Please enter postal code' }]}
                  >
                    <Input size="large" placeholder="Postal code" className="rounded-none border-gray-300" />
                  </Form.Item>
                </div>

                <Form.Item
                  name="phone"
                  rules={[{ required: true, message: 'Please enter your phone number' }]}
                >
                  <Input size="large" placeholder="Phone" className="rounded-none border-gray-300" />
                </Form.Item>
              </div>

              {/* Payment Method */}
              <div>
                <Title level={4} className="!font-serif !mb-4">Payment Method</Title>
                <Form.Item name="paymentMethod">
                  <Radio.Group className="w-full flex flex-col gap-3">
                    <Radio value="Cash on Delivery" disabled={!user} className={`border border-gray-200 p-4 w-full flex items-center ${!user ? 'text-gray-400 bg-gray-50' : ''}`}>
                      <span className="font-medium">Cash on Delivery (COD) {!user && <span className="text-xs ml-2 font-normal">(Login required)</span>}</span>
                    </Radio>
                    <Radio value="Card Payment" className="border border-gray-200 p-4 w-full flex items-center">
                      <span className="font-medium">Credit/Debit Card</span>
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-black w-full h-14 text-sm tracking-widest uppercase font-semibold"
              >
                Place Order
              </Button>
            </Form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-gray-50 p-6 md:p-8 rounded-sm sticky top-24 border border-gray-100">
              <Title level={4} className="!font-serif !mb-6">Order Summary</Title>

              <div className="flex flex-col gap-4 mb-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="relative w-16 h-20 bg-gray-100 flex-shrink-0">
                      <img
                        src={item.variant.image || (item.product.images && item.product.images[0])}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-2 -right-2 bg-gray-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="font-medium text-sm line-clamp-1">{item.product.name}</span>
                      <span className="text-xs text-gray-500">Size: {item.variant.size}</span>
                    </div>
                    <span className="font-medium text-sm">LKR {(getItemPrice(item) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Divider className="my-4 border-gray-200" />

              <div className="flex justify-between mb-3 text-sm">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="font-medium">LKR {subtotal.toLocaleString()}</Text>
              </div>

              <div className="flex justify-between items-start mb-3 text-sm">
                <div>
                  <Text className="text-gray-600 block">Island-wide Shipping</Text>
                  <span className="text-[11px] text-gray-400 block">Est. Delivery: {settings?.estimatedDeliveryTime || '2 to 4 Business Days'}</span>
                </div>
                <Text className={shipping === 0 ? "text-emerald-600 font-semibold" : "font-medium text-gray-900"}>
                  {shipping === 0 ? 'Free' : `LKR ${shipping.toLocaleString()}`}
                </Text>
              </div>

              <Divider className="my-4 border-gray-200" />

              <div className="flex justify-between items-end">
                <Text className="font-bold text-base">Total</Text>
                <div className="text-right">
                  <span className="text-xs text-gray-400 mr-2">LKR</span>
                  <Text className="font-bold text-xl">{total.toLocaleString()}</Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Checkout;
