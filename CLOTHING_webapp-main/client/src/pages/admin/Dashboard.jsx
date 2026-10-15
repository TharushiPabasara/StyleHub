import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Table, Spin, message, Tag, Tabs } from 'antd';
import { ShoppingBag, Package, DollarSign, Users, Eye } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  const [overviewData, setOverviewData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    recentOrders: [],
    staffList: [],
    customerList: []
  });

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const fetchDashboardOverview = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || user;
      const headers = { 'Authorization': `Bearer ${userInfo?.token}` };

      const res = await fetch(`${API_URL}/api/dashboard/overview`, { headers });
      const data = await res.json();

      if (res.ok) {
        setOverviewData({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          totalUsers: data.totalUsers || 0,
          recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
          staffList: Array.isArray(data.staffList) ? data.staffList : [],
          customerList: Array.isArray(data.customerList) ? data.customerList : []
        });
      } else {
        message.error(data.message || 'Failed to load dashboard overview');
      }
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      message.error('Failed to load dashboard overview');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    if (status === 'Delivered' || status === 'Shipped') {
      return (
        <span className="badge-green">
          <span className="w-1.5 h-1.5 rounded-full bg-[#048b56] inline-block mr-1.5"></span>
          {status}
        </span>
      );
    }
    if (status === 'Processing') {
      return (
        <span className="badge-yellow">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b7790b] inline-block mr-1.5"></span>
          Processing
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="badge-gray">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8c8c8c] inline-block mr-1.5"></span>
          Pending
        </span>
      );
    }
    if (status === 'Cancelled') {
      return (
        <span className="badge-red" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c] inline-block mr-1.5"></span>
          Cancelled
        </span>
      );
    }
    return <span>{status}</span>;
  };

  // Purely read-only order columns (NO actions)
  const orderColumns = [
    { 
      title: 'Order ID', 
      dataIndex: '_id', 
      key: '_id',
      render: text => <span className="font-bold text-xs">#{text ? text.slice(-8).toUpperCase() : '-'}</span>
    },
    { 
      title: 'Customer', 
      key: 'customer',
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {record.shippingDetails?.firstName} {record.shippingDetails?.lastName}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{record.shippingDetails?.city}</div>
        </div>
      )
    },
    { 
      title: 'Order Status', 
      dataIndex: 'orderStatus', 
      key: 'orderStatus',
      render: status => renderStatus(status)
    },
    { 
      title: 'Amount (LKR)', 
      dataIndex: 'totalPrice', 
      key: 'totalPrice',
      render: amount => <span className="text-xs font-mono font-medium">Rs. {Number(amount).toLocaleString()}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => <span className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</span>
    }
  ];

  // Purely read-only staff columns (NO actions)
  const staffColumns = [
    { 
      title: 'Staff Name', 
      dataIndex: 'name', 
      key: 'name',
      render: text => <span className="font-medium text-gray-900">{text}</span>
    },
    { 
      title: 'Email Address', 
      dataIndex: 'email', 
      key: 'email',
      render: text => <span className="text-gray-600 text-xs">{text}</span>
    },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role', 
      render: role => {
        let color = 'default';
        if (role === 'developer') color = 'magenta';
        if (role === 'owner') color = 'gold';
        if (role === 'inventory_handler') color = 'blue';
        if (role === 'sales_staff') color = 'green';
        return <Tag color={color} className="uppercase text-[10px] tracking-wider font-bold">{role ? role.replace('_', ' ') : '-'}</Tag>;
      } 
    },
    {
      title: 'Registered Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: d => d ? <span className="text-xs text-gray-500">{new Date(d).toLocaleDateString()}</span> : '-'
    }
  ];

  // Purely read-only customer columns (NO actions)
  const customerColumns = [
    { 
      title: 'Customer Name', 
      dataIndex: 'name', 
      key: 'name',
      render: text => <span className="font-medium text-gray-900">{text}</span>
    },
    { 
      title: 'Email Address', 
      dataIndex: 'email', 
      key: 'email',
      render: text => <span className="text-gray-600 text-xs">{text}</span>
    },
    { 
      title: 'Phone Number', 
      dataIndex: 'phone', 
      key: 'phone', 
      render: p => p || '-' 
    },
    { 
      title: 'Verified', 
      dataIndex: 'isVerified', 
      key: 'isVerified', 
      render: v => v ? <Tag color="green">Yes</Tag> : <Tag color="default">No</Tag> 
    },
    {
      title: 'Joined Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: d => d ? <span className="text-xs text-gray-500">{new Date(d).toLocaleDateString()}</span> : '-'
    }
  ];

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span className="text-xs text-gray-400">Loading store overview...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Title & Overview Badge */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded mb-2">
            <Eye size={12} />
            Common Central Overview • View Only
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#111] mb-1">Store Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">
            Live operations summary and store status for all StyleHub team members.
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-6 admin-stat-card h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-medium text-gray-500 tracking-wider">TOTAL REVENUE</span>
                <span className="bg-[#e6f7ee] text-[#048b56] text-[10px] font-bold px-2 py-0.5 rounded">All Time</span>
              </div>
              <div className="text-xl font-serif text-gray-900 leading-tight">Rs.</div>
              <div className="text-4xl font-serif text-gray-900 tracking-tight">
                {overviewData.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-4">Verified completed transactions</div>
          </div>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-6 admin-stat-card h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-medium text-gray-500 tracking-wider">TOTAL ORDERS</span>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded">All Time</span>
              </div>
              <div className="text-4xl font-serif text-gray-900 tracking-tight mb-2">
                {overviewData.totalOrders}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
              <span className="w-1.5 h-1.5 bg-[#b7790b] rounded-full"></span>
              Orders placed across all channels
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-6 admin-stat-card h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-medium text-gray-500 tracking-wider w-1/2">TOTAL PRODUCTS</span>
                <span className="bg-[#fcf5e8] text-[#b7790b] text-[10px] font-medium px-2 py-0.5 rounded text-right">In Catalog</span>
              </div>
              <div className="text-4xl font-serif text-gray-900 tracking-tight">
                {overviewData.totalProducts}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-4">Active apparel styles &amp; items</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-6 admin-stat-card h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-medium text-gray-500 tracking-wider">REGISTERED CUSTOMERS</span>
                <span className="bg-[#e6f7ee] text-[#048b56] text-[10px] font-bold px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="text-4xl font-serif text-gray-900 tracking-tight mb-2">
                {overviewData.totalUsers}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-4">Verified customer accounts</div>
          </div>
        </Col>
      </Row>

      {/* Recent Orders Overview Table (Read-Only • No Actions) */}
      <div className="bg-white admin-table-card admin-table">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif text-gray-900 mb-1 flex items-center gap-2">
              <ShoppingBag size={18} />
              Recent Orders Summary
            </h2>
            <p className="text-xs text-gray-400">Live transaction stream across StyleHub Sri Lanka • View Only</p>
          </div>
        </div>
        
        <Table 
          columns={orderColumns} 
          dataSource={overviewData.recentOrders} 
          rowKey="_id"
          pagination={false}
          locale={{ emptyText: 'No recent orders to display.' }}
        />

        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-[#faf9f7]">
          <span className="text-xs text-gray-500">
            Displaying {overviewData.recentOrders.length} most recent orders out of {overviewData.totalOrders} total
          </span>
        </div>
      </div>

      {/* Staff & Customer Directory Overview Table (Directly Below Recent Orders • Read-Only • No Actions) */}
      <div className="bg-white admin-table-card admin-table mt-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#d4af37]" />
              <h2 className="text-xl font-serif text-gray-900 mb-0">Staff &amp; Customer Directory Overview</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">General team and customer status overview • View Only</p>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultActiveKey="staff">
            <Tabs.TabPane tab={<span className="font-medium px-2">Team Staff Members ({overviewData.staffList.length})</span>} key="staff">
              <Table 
                columns={staffColumns} 
                dataSource={overviewData.staffList} 
                rowKey="_id"
                pagination={{ pageSize: 6 }}
                className="mt-2"
                locale={{ emptyText: 'No staff members recorded.' }}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span className="font-medium px-2">Recent Registered Customers ({overviewData.customerList.length})</span>} key="customers">
              <Table 
                columns={customerColumns} 
                dataSource={overviewData.customerList} 
                rowKey="_id"
                pagination={{ pageSize: 6 }}
                className="mt-2"
                locale={{ emptyText: 'No registered customers recorded.' }}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
