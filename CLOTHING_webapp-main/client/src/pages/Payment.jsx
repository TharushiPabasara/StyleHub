import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Layout, Form, Input, Button, Typography, message } from 'antd';
import { CreditCard, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import AnnouncementBar from '../components/AnnouncementBar';
import { CartContext } from '../context/CartContext';
import { API_URL } from '../config/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  const orderData = location.state?.orderData;

  if (!orderData) {
    return <Navigate to="/cart" replace />;
  }

  const subtotal = orderData.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = orderData.shippingPrice !== undefined 
    ? Number(orderData.shippingPrice) 
    : (location.state?.shippingPrice !== undefined ? Number(location.state.shippingPrice) : (subtotal >= 15000 ? 0 : 400));
  const total = location.state?.total !== undefined ? Number(location.state.total) : (subtotal + shipping);

  const onFinish = async (values) => {
    setLoading(true);
    
    // Simulate a payment gateway processing time
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to place order after payment');
        }

        message.success('Payment successful! Order placed.');
        clearCart();
        navigate('/checkout-success', { state: { orderId: data._id } });

      } catch (error) {
        message.error(error.message);
        setLoading(false);
      }
    }, 2000); // 2 second delay to simulate payment processing
  };

  return (
    <Layout className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navbar />
      
      <Content className="max-w-2xl mx-auto w-full px-6 py-16">
        <div className="text-center mb-10">
          <CreditCard size={48} className="mx-auto text-gray-800 mb-4" />
          <Title level={2} className="!font-serif !mb-2">Secure Payment</Title>
          <Text className="text-gray-500">Please enter your card details below to complete your order.</Text>
        </div>

        <div className="bg-gray-50 p-8 rounded border border-gray-200">
          <div className="space-y-2 mb-6 pb-6 border-b border-gray-200 text-sm">
            <div className="flex justify-between items-center text-gray-600">
              <span>Subtotal ({orderData.orderItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
              <span className="font-medium text-gray-900">LKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Island-wide Shipping</span>
              <span className={shipping === 0 ? "text-emerald-600 font-semibold" : "font-medium text-gray-900"}>
                {shipping === 0 ? 'Free' : `LKR ${shipping.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <Text className="font-bold text-base text-gray-900">Total Amount</Text>
              <div className="text-right">
                <span className="text-xs text-gray-400 mr-1.5">LKR</span>
                <Text className="font-bold text-xl text-gray-900">{total.toLocaleString()}</Text>
              </div>
            </div>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            className="space-y-4"
          >
            <Form.Item
              name="cardNumber"
              label="Card Number"
              rules={[{ required: true, message: 'Please enter card number' }]}
            >
              <Input size="large" placeholder="0000 0000 0000 0000" maxLength={19} className="rounded-none border-gray-300" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="expiry"
                label="Expiry Date"
                rules={[{ required: true, message: 'MM/YY' }]}
              >
                <Input size="large" placeholder="MM/YY" maxLength={5} className="rounded-none border-gray-300" />
              </Form.Item>

              <Form.Item
                name="cvv"
                label="CVV"
                rules={[{ required: true, message: 'CVV' }]}
              >
                <Input size="large" placeholder="123" maxLength={4} type="password" className="rounded-none border-gray-300" />
              </Form.Item>
            </div>

            <Form.Item
              name="nameOnCard"
              label="Name on Card"
              rules={[{ required: true, message: 'Please enter name as on card' }]}
            >
              <Input size="large" placeholder="John Doe" className="rounded-none border-gray-300" />
            </Form.Item>

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="bg-black w-full h-14 text-sm tracking-widest uppercase font-semibold mt-4 flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Pay Now
            </Button>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default Payment;
