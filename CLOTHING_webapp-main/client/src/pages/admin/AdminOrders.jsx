import React, { useState, useEffect, useRef } from 'react';
import { Table, Tag, Select, message, Button, Modal, Tabs, Input, notification } from 'antd';
import { Eye, Clock, PackageCheck, Truck, CheckCircle2, XCircle, Search, ShoppingBag, Bell, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/api';

const { Option } = Select;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchText, setSearchText] = useState('');

  const previousOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const fetchOrders = async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo?.token) return;
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();

        // Check if new orders arrived in real-time
        if (!isInitialLoadRef.current && previousOrderIdsRef.current.size > 0) {
          const newOrders = data.filter(order => !previousOrderIdsRef.current.has(order._id));
          if (newOrders.length > 0) {
            playNotificationSound();
            newOrders.forEach(order => {
              notification.open({
                message: <span className="font-bold text-gray-900">New Order Received!</span>,
                description: (
                  <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    <p className="font-semibold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p>Method: <strong className="text-blue-600">{order.paymentMethod}</strong> • Total: <strong>LKR {order.totalPrice?.toLocaleString()}</strong></p>
                    <p className="text-[11px] text-gray-500">Customer: {order.shippingDetails?.firstName} {order.shippingDetails?.lastName}</p>
                  </div>
                ),
                icon: <ShoppingBag className="text-emerald-600" size={20} />,
                placement: 'topRight',
                duration: 6,
              });
            });
          }
        }

        previousOrderIdsRef.current = new Set(data.map(o => o._id));
        isInitialLoadRef.current = false;
        setOrders(data);
      } else if (isManual) {
        message.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (isManual) message.error('An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, type, newStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const payload = type === 'order' 
        ? { orderStatus: newStatus } 
        : { paymentStatus: newStatus };

      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        message.success(`${type === 'order' ? 'Order' : 'Payment'} status updated successfully`);
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, ...payload } 
            : order
        ));
      } else {
        message.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('An error occurred while updating status');
    }
  };

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock size={12} />;
      case 'Processing': return <PackageCheck size={12} />;
      case 'Shipped': return <Truck size={12} />;
      case 'Delivered': return <CheckCircle2 size={12} />;
      case 'Cancelled': return <XCircle size={12} />;
      default: return null;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'orange';
      case 'Processing': return 'blue';
      case 'Shipped': return 'geekblue';
      case 'Delivered': return 'green';
      case 'Cancelled': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <span className="font-medium text-gray-700">#{id.slice(-8).toUpperCase()}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium">{record.shippingDetails.firstName} {record.shippingDetails.lastName}</span>
          <span className="text-xs text-gray-500">{record.shippingDetails.email}</span>
        </div>
      )
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => <span className="font-bold">LKR {price.toLocaleString()}</span>,
    },
    {
      title: 'Order Status',
      key: 'orderStatus',
      render: (_, record) => (
        <div>
          <Select 
            value={record.orderStatus} 
            style={{ width: 130 }}
            bordered={false}
            className="bg-gray-50 rounded"
            onChange={(val) => handleStatusChange(record._id, 'order', val)}
          >
            {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
              <Option key={status} value={status}>
                <div className="flex items-center gap-1.5 text-xs">
                  <Tag color={getOrderStatusColor(status)} className="m-0 flex items-center gap-1 px-1.5 py-0.5 border-0">
                    {getOrderStatusIcon(status)}
                    {status}
                  </Tag>
                </div>
              </Option>
            ))}
          </Select>
          {record.orderStatus === 'Cancelled' && record.cancelReason && (
            <p className="text-[11px] text-red-500 mt-1 max-w-[130px] truncate" title={record.cancelReason}>
              Reason: {record.cancelReason}
            </p>
          )}
        </div>
      )
    },
    {
      title: 'Payment Status',
      key: 'paymentStatus',
      render: (_, record) => (
        <Select 
          value={record.paymentStatus} 
          style={{ width: 100 }}
          bordered={false}
          className="bg-gray-50 rounded"
          onChange={(val) => handleStatusChange(record._id, 'payment', val)}
        >
          {(record.paymentMethod === 'Card Payment' ? ['Paid', 'Returned', 'Failed'] : ['Pending', 'Paid', 'Failed']).map(status => (
            <Option key={status} value={status}>
               <Tag color={status === 'Paid' ? 'green' : status === 'Pending' ? 'orange' : status === 'Returned' ? 'blue' : 'red'} className="m-0 border-0">
                  {status}
                </Tag>
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<Eye size={16} />} 
          onClick={() => {
            setSelectedOrder(record);
            setViewModalVisible(true);
          }}
          className="flex items-center text-gray-500 hover:text-black"
        >
          View
        </Button>
      )
    }
  ];

  const filteredOrders = orders.filter(order => 
    order._id.slice(-8).toUpperCase().includes(searchText.toUpperCase())
  );

  const cardOrders = orders.filter(o => o.paymentMethod === 'Card Payment');
  const codOrders = orders.filter(o => o.paymentMethod === 'Cash on Delivery');

  const cardPendingCount = cardOrders.filter(o => o.orderStatus === 'Pending').length;
  const codPendingCount = codOrders.filter(o => o.orderStatus === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-1">Order Management</h1>
          <p className="text-gray-500 text-sm">Monitor, process, and track customer orders in real-time.</p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search Order ID..."
            prefix={<Search size={16} className="text-gray-400 mr-1" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-sm"
            size="large"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden px-4 pt-2 pb-4">
        {(cardPendingCount > 0 || codPendingCount > 0) && (
          <div className="mb-3 mt-2 p-3 bg-gradient-to-r from-amber-50/80 to-rose-50/80 border border-amber-200/80 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>
                <strong className="text-gray-900">New Orders Alert: </strong>
                {cardPendingCount > 0 && <strong className="text-rose-700">{cardPendingCount} new Card payment{cardPendingCount > 1 ? 's' : ''}</strong>}
                {cardPendingCount > 0 && codPendingCount > 0 && ' and '}
                {codPendingCount > 0 && <strong className="text-rose-700">{codPendingCount} new Cash on Delivery</strong>}
                {' waiting for processing.'}
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live polling
              </span>
              <Button 
                size="small" 
                icon={<RefreshCw size={11} className={loading ? "animate-spin" : ""} />}
                onClick={() => fetchOrders(true)} 
                className="text-[11px] rounded-sm"
              >
                Refresh
              </Button>
            </div>
          </div>
        )}

        {searchText ? (
          <div>
            <div className="py-2 border-b border-gray-100 mb-4">
              <span className="text-sm font-bold text-gray-700">Search Results for "{searchText}"</span>
            </div>
            <Table 
              columns={columns} 
              dataSource={filteredOrders} 
              rowKey="_id" 
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </div>
        ) : (
          <Tabs 
            defaultActiveKey="card" 
            items={[
              {
                key: 'card',
                label: (
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="font-medium text-sm">Card Payments</span>
                    {cardPendingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block"></span>
                        {cardPendingCount} New
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-normal">({cardOrders.length})</span>
                    )}
                  </div>
                ),
                children: (
                  <Table 
                    columns={columns} 
                    dataSource={cardOrders} 
                    rowKey="_id" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                )
              },
              {
                key: 'cod',
                label: (
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="font-medium text-sm">Cash on Delivery</span>
                    {codPendingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block"></span>
                        {codPendingCount} New
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-normal">({codOrders.length})</span>
                    )}
                  </div>
                ),
                children: (
                  <Table 
                    columns={columns} 
                    dataSource={codOrders} 
                    rowKey="_id" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                )
              }
            ]} 
          />
        )}
      </div>

      {/* Order Details Modal */}
      <Modal
        title={<span className="font-serif text-xl">Order Details</span>}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div className="space-y-6 mt-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded border border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Order ID</p>
                <p className="text-lg font-bold">#{selectedOrder._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Placed On</p>
                <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-serif text-lg mb-3">Customer Information</h4>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                  <p><span className="text-gray-500 w-20 inline-block">Name:</span> <strong>{selectedOrder.shippingDetails.firstName} {selectedOrder.shippingDetails.lastName}</strong></p>
                  <p><span className="text-gray-500 w-20 inline-block">Email:</span> {selectedOrder.shippingDetails.email}</p>
                  <p><span className="text-gray-500 w-20 inline-block">Phone:</span> {selectedOrder.shippingDetails.phone}</p>
                  {selectedOrder.user && <p className="text-xs text-blue-600 mt-2">Registered User</p>}
                </div>
              </div>

              <div>
                <h4 className="font-serif text-lg mb-3">Shipping Address</h4>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-1">
                  <p>{selectedOrder.shippingDetails.recipientName || `${selectedOrder.shippingDetails.firstName} ${selectedOrder.shippingDetails.lastName}`}</p>
                  <p>{selectedOrder.shippingDetails.address}</p>
                  <p>{selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.postalCode}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-serif text-lg mb-3">Order Items</h4>
              <div className="border border-gray-100 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3 font-medium">Item</th>
                      <th className="p-3 font-medium">Price</th>
                      <th className="p-3 font-medium">Qty</th>
                      <th className="p-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.orderItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">Size: {item.variant.size}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">LKR {item.price.toLocaleString()}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3 text-right font-medium">LKR {(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={selectedOrder.shippingPrice === 0 ? "text-green-600 font-medium" : "font-medium"}>
                    {selectedOrder.shippingPrice === 0 ? 'Free' : `LKR ${(selectedOrder.shippingPrice || 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-900 font-bold">Total Amount</span>
                  <span className="font-bold text-lg">LKR {selectedOrder.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
