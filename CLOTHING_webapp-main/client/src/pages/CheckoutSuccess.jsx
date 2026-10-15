import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Button, Typography } from 'antd';
import { CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const CheckoutSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Navbar />
      
      <Content className="max-w-3xl mx-auto w-full px-6 py-20 flex flex-col items-center text-center">
        <CheckCircle size={80} className="text-green-500 mb-6" />
        
        <Title level={2} className="!font-serif !mb-4">Order Successful!</Title>
        
        <Paragraph className="text-gray-600 text-lg mb-2">
          Thank you for your purchase. Your order has been placed successfully.
        </Paragraph>
        
        <div className="bg-white px-6 py-4 border border-gray-200 rounded my-8 inline-block">
          <Text className="text-gray-500 block mb-1">Order Reference Number</Text>
          <Text className="font-bold text-lg">{orderId}</Text>
        </div>
        
        <Paragraph className="text-gray-600 mb-10 max-w-md">
          We'll send you a shipping confirmation email as soon as your order ships.
        </Paragraph>
        
        <Button 
          type="primary" 
          className="bg-black h-12 px-10 text-sm tracking-widest uppercase font-semibold"
          onClick={() => window.location.href = '/collections'}
        >
          Continue Shopping
        </Button>
      </Content>
    </Layout>
  );
};

export default CheckoutSuccess;
