import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spin, message, Select, DatePicker, Button, Tag, Input, Tooltip } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Package, Calendar, Download, Printer, Filter, RotateCcw, Search, ShoppingBag, CheckCircle, Clock, XCircle 
} from 'lucide-react';
import { API_URL } from '../../config/api';

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminReports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [periodPreset, setPeriodPreset] = useState('month');
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        message.error('Failed to fetch orders data');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('An error occurred while fetching orders data');
    } finally {
      setLoading(false);
    }
  };

  // Handle preset period selection
  const handlePresetChange = (val) => {
    setPeriodPreset(val);
    const now = dayjs();
    switch (val) {
      case 'today':
        setDateRange([now.startOf('day'), now.endOf('day')]);
        break;
      case 'yesterday':
        const yest = now.subtract(1, 'day');
        setDateRange([yest.startOf('day'), yest.endOf('day')]);
        break;
      case 'week':
        setDateRange([now.subtract(6, 'day').startOf('day'), now.endOf('day')]);
        break;
      case 'month':
        setDateRange([now.startOf('month'), now.endOf('month')]);
        break;
      case 'last_month':
        const lastMonth = now.subtract(1, 'month');
        setDateRange([lastMonth.startOf('month'), lastMonth.endOf('month')]);
        break;
      case 'year':
        setDateRange([now.startOf('year'), now.endOf('year')]);
        break;
      case 'all':
        setDateRange(null);
        break;
      case 'custom':
        break;
      default:
        break;
    }
  };

  // Handle custom date range picker
  const handleRangePickerChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      setPeriodPreset('custom');
    } else {
      setDateRange(null);
      setPeriodPreset('all');
    }
  };

  const handleResetFilters = () => {
    setPeriodPreset('month');
    setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
    setPaymentMethodFilter('all');
    setOrderStatusFilter('all');
    setSearchQuery('');
  };

  // Filter orders by date range, payment method, order status, and search query
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = dayjs(order.createdAt);

      // 1. Date Range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const start = dateRange[0].startOf('day');
        const end = dateRange[1].endOf('day');
        if (orderDate.isBefore(start) || orderDate.isAfter(end)) {
          return false;
        }
      }

      // 2. Payment Method filter
      if (paymentMethodFilter !== 'all' && order.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // 3. Order Status filter
      if (orderStatusFilter !== 'all' && order.orderStatus !== orderStatusFilter) {
        return false;
      }

      // 4. Search Query filter (ID, Customer Name, Email, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = order._id.toLowerCase().includes(q);
        const nameMatch = `${order.shippingDetails?.firstName || ''} ${order.shippingDetails?.lastName || ''}`.toLowerCase().includes(q);
        const emailMatch = (order.shippingDetails?.email || '').toLowerCase().includes(q);
        const phoneMatch = (order.shippingDetails?.phone || '').includes(q);
        if (!idMatch && !nameMatch && !emailMatch && !phoneMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, dateRange, paymentMethodFilter, orderStatusFilter, searchQuery]);

  // Period label for display
  const periodLabel = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return 'All Time';
    }
    const startStr = dateRange[0].format('MMM D, YYYY');
    const endStr = dateRange[1].format('MMM D, YYYY');
    if (startStr === endStr) return startStr;
    return `${startStr} – ${endStr}`;
  }, [dateRange]);

  // Successful orders for actual revenue metrics (exclude Cancelled / Failed / Returned)
  const successfulOrders = useMemo(() => {
    return filteredOrders.filter(o => 
      o.orderStatus !== 'Cancelled' && o.paymentStatus !== 'Failed' && o.paymentStatus !== 'Returned'
    );
  }, [filteredOrders]);

  // Metrics Calculation
  const totalRevenue = useMemo(() => {
    return successfulOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  }, [successfulOrders]);

  const paidTotal = useMemo(() => {
    return filteredOrders.filter(o => o.paymentStatus === 'Paid').reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  }, [filteredOrders]);

  const pendingTotal = useMemo(() => {
    return filteredOrders.filter(o => o.paymentStatus === 'Pending' && o.orderStatus !== 'Cancelled').reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter(o => o.orderStatus === 'Cancelled');
  }, [filteredOrders]);

  const cancelledTotal = useMemo(() => {
    return cancelledOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  }, [cancelledOrders]);

  const totalOrdersCount = filteredOrders.length;
  const successfulOrdersCount = successfulOrders.length;
  const aov = successfulOrdersCount > 0 ? Math.round(totalRevenue / successfulOrdersCount) : 0;

  const totalItemsSold = useMemo(() => {
    return successfulOrders.reduce((acc, order) => {
      return acc + (order.orderItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    }, 0);
  }, [successfulOrders]);

  // Revenue Trend Data
  const revenueTrendData = useMemo(() => {
    const map = {};
    const isSingleDay = dateRange && dateRange[0] && dateRange[1] && dateRange[0].isSame(dateRange[1], 'day');

    // Sort chronologically
    const sortedSuccessful = [...successfulOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sortedSuccessful.forEach(order => {
      const dt = dayjs(order.createdAt);
      let key = dt.format('MMM D');
      if (isSingleDay) {
        key = dt.format('HH:00');
      } else if (!dateRange || (dateRange[1] && dateRange[0] && dateRange[1].diff(dateRange[0], 'day') > 60)) {
        key = dt.format('MMM YYYY');
      }
      map[key] = (map[key] || 0) + (order.totalPrice || 0);
    });

    return Object.keys(map).map(date => ({
      date,
      revenue: map[date]
    }));
  }, [successfulOrders, dateRange]);

  // Sales by Category
  const categoryData = useMemo(() => {
    const map = {};
    successfulOrders.forEach(order => {
      (order.orderItems || []).forEach(item => {
        const category = item.product?.category || 'General';
        map[category] = (map[category] || 0) + (item.quantity || 0);
      });
    });
    return Object.keys(map).map(name => ({
      name,
      sales: map[name]
    })).sort((a, b) => b.sales - a.sales);
  }, [successfulOrders]);

  // Top Selling Products
  const topProductsData = useMemo(() => {
    const map = {};
    successfulOrders.forEach(order => {
      (order.orderItems || []).forEach(item => {
        const key = item.name;
        if (!map[key]) {
          map[key] = { name: item.name, sales: 0, revenue: 0 };
        }
        map[key].sales += (item.quantity || 0);
        map[key].revenue += ((item.price || 0) * (item.quantity || 0));
      });
    });
    return Object.values(map)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [successfulOrders]);

  // Payment Method Data
  const paymentMethodData = useMemo(() => {
    const map = { 'Card Payment': 0, 'Cash on Delivery': 0 };
    filteredOrders.forEach(order => {
      if (order.paymentMethod && map[order.paymentMethod] !== undefined) {
        map[order.paymentMethod] += 1;
      }
    });
    return [
      { name: 'Card Payment', value: map['Card Payment'] },
      { name: 'Cash on Delivery', value: map['Cash on Delivery'] }
    ].filter(item => item.value > 0);
  }, [filteredOrders]);

  // Payment Status Data
  const paymentStatusData = useMemo(() => {
    const map = { 'Paid': 0, 'Pending': 0, 'Failed': 0, 'Returned': 0 };
    filteredOrders.forEach(order => {
      if (order.paymentStatus && map[order.paymentStatus] !== undefined) {
        map[order.paymentStatus] += 1;
      }
    });
    return [
      { name: 'Paid', value: map['Paid'] },
      { name: 'Pending', value: map['Pending'] },
      { name: 'Failed', value: map['Failed'] },
      { name: 'Returned', value: map['Returned'] }
    ].filter(item => item.value > 0);
  }, [filteredOrders]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      return message.warning('No sales data in the selected period to export.');
    }

    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'City',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Items Count',
      'Items Summary',
      'Total Amount (LKR)'
    ];

    const rows = filteredOrders.map(order => {
      const dt = dayjs(order.createdAt);
      const itemsSummary = (order.orderItems || [])
        .map(item => `${item.name} (${item.variant?.size || ''} x${item.quantity})`)
        .join('; ');
      const totalQty = (order.orderItems || []).reduce((acc, it) => acc + it.quantity, 0);

      return [
        `#${order._id.slice(-8).toUpperCase()}`,
        dt.format('YYYY-MM-DD'),
        dt.format('HH:mm:ss'),
        `"${(order.shippingDetails?.firstName || '')} ${(order.shippingDetails?.lastName || '')}".trim()`,
        order.shippingDetails?.email || '',
        order.shippingDetails?.phone || '',
        `"${(order.shippingDetails?.city || '').replace(/"/g, '""')}"`,
        order.paymentMethod || '',
        order.paymentStatus || '',
        order.orderStatus || '',
        totalQty,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        order.totalPrice || 0
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filenamePeriod = dateRange ? `${dateRange[0].format('YYYYMMDD')}_to_${dateRange[1].format('YYYYMMDD')}` : 'all_time';
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${filenamePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Sales report exported to CSV successfully.');
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Table Columns
  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <span className="font-mono text-xs font-semibold text-gray-800">#{id.slice(-8).toUpperCase()}</span>,
    },
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-gray-900">{dayjs(date).format('MMM D, YYYY')}</span>
          <span className="text-[11px] text-gray-400">{dayjs(date).format('hh:mm A')}</span>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-gray-900">{record.shippingDetails?.firstName} {record.shippingDetails?.lastName}</span>
          <span className="text-[11px] text-gray-500">{record.shippingDetails?.email}</span>
        </div>
      )
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => {
        const totalQty = (record.orderItems || []).reduce((acc, it) => acc + it.quantity, 0);
        return (
          <Tooltip title={(record.orderItems || []).map(i => `${i.name} (${i.variant?.size || ''} x${i.quantity})`).join(', ')}>
            <span className="text-xs font-medium cursor-pointer text-blue-600 underline decoration-dotted">
              {totalQty} item{totalQty > 1 ? 's' : ''}
            </span>
          </Tooltip>
        );
      }
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => <span className="text-xs text-gray-600 font-medium">{method}</span>
    },
    {
      title: 'Order Status',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status) => {
        const color = status === 'Delivered' ? 'green' : status === 'Processing' ? 'blue' : status === 'Shipped' ? 'purple' : status === 'Cancelled' ? 'red' : 'orange';
        return <Tag color={color} className="text-[10px] font-bold uppercase tracking-wider">{status}</Tag>;
      }
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const color = status === 'Paid' ? 'green' : status === 'Pending' ? 'orange' : status === 'Returned' ? 'blue' : 'red';
        return <Tag color={color} className="text-[10px] font-bold uppercase tracking-wider">{status}</Tag>;
      }
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => <span className="font-bold text-gray-900 text-sm">LKR {price.toLocaleString()}</span>,
      align: 'right'
    }
  ];

  if (loading) return <div className="py-24 flex justify-center"><Spin size="large" /></div>;

  return (
    <div className="space-y-6 pb-12 sales-report-container">
      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-3xl font-serif font-bold text-black">StyleHub - Sales Report</h1>
        <p className="text-sm text-gray-600 mt-1">Period: {periodLabel} | Generated on: {dayjs().format('MMM D, YYYY hh:mm A')}</p>
      </div>

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-1">Sales & Revenue Reports</h1>
          <p className="text-gray-500 text-sm">Generate, analyze, and export sales reports for any selected period.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            icon={<Download size={15} />} 
            onClick={exportToCSV}
            className="flex items-center gap-1.5 rounded-sm text-xs font-semibold border-gray-300 hover:border-black"
          >
            Export CSV
          </Button>
          <Button 
            type="primary"
            icon={<Printer size={15} />} 
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-sm text-xs font-semibold bg-black hover:bg-gray-800 border-0"
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Period Selection & Filter Control Bar */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" /> Period:
            </span>
            <Select 
              value={periodPreset} 
              onChange={handlePresetChange} 
              style={{ width: 150 }} 
              className="rounded"
            >
              <Option value="today">Today</Option>
              <Option value="yesterday">Yesterday</Option>
              <Option value="week">Past 7 Days</Option>
              <Option value="month">This Month</Option>
              <Option value="last_month">Last Month</Option>
              <Option value="year">This Year</Option>
              <Option value="all">All Time</Option>
              <Option value="custom">Custom Range</Option>
            </Select>

            <RangePicker 
              value={dateRange}
              onChange={handleRangePickerChange}
              format="YYYY-MM-DD"
              allowClear={false}
              className="rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="small" 
              icon={<RotateCcw size={12} />} 
              onClick={handleResetFilters}
              className="text-xs rounded-sm text-gray-500"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">Payment:</span>
              <Select 
                value={paymentMethodFilter} 
                onChange={setPaymentMethodFilter} 
                style={{ width: 145 }}
                size="small"
              >
                <Option value="all">All Methods</Option>
                <Option value="Card Payment">Card Payment</Option>
                <Option value="Cash on Delivery">Cash on Delivery</Option>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">Order Status:</span>
              <Select 
                value={orderStatusFilter} 
                onChange={setOrderStatusFilter} 
                style={{ width: 135 }}
                size="small"
              >
                <Option value="all">All Statuses</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Processing">Processing</Option>
                <Option value="Shipped">Shipped</Option>
                <Option value="Delivered">Delivered</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </div>
          </div>

          <div className="w-full sm:w-60">
            <Input 
              placeholder="Search order or customer..." 
              prefix={<Search size={13} className="text-gray-400 mr-1" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              allowClear
              className="rounded-sm"
            />
          </div>
        </div>
      </div>

      {/* Selected Period Active Report Summary Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Generated Sales Report Period</p>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-emerald-400" />
            {periodLabel}
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Displaying data for <strong>{filteredOrders.length}</strong> total order{filteredOrders.length === 1 ? '' : 's'} 
            ({successfulOrdersCount} successful, {cancelledOrders.length} cancelled)
          </p>
        </div>
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-700 pt-3 md:pt-0 md:pl-6">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Net Sales Revenue</p>
            <p className="text-2xl font-bold text-emerald-400">LKR {totalRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Units Sold</p>
            <p className="text-2xl font-bold text-white">{totalItemsSold}</p>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Net Revenue</p>
            <p className="text-xl font-serif font-bold text-gray-900">LKR {totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-medium">Excludes cancelled/refunded</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Paid Orders</p>
            <p className="text-xl font-serif font-bold text-gray-900">LKR {paidTotal.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 font-medium">{filteredOrders.filter(o => o.paymentStatus === 'Paid').length} orders collected</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pending COD</p>
            <p className="text-xl font-serif font-bold text-gray-900">LKR {pendingTotal.toLocaleString()}</p>
            <p className="text-[10px] text-amber-600 font-medium">{filteredOrders.filter(o => o.paymentStatus === 'Pending' && o.orderStatus !== 'Cancelled').length} pending collection</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Avg Order Value</p>
            <p className="text-xl font-serif font-bold text-gray-900">LKR {aov.toLocaleString()}</p>
            <p className="text-[10px] text-purple-600 font-medium">Per successful order</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Cancelled Loss</p>
            <p className="text-xl font-serif font-bold text-rose-600">LKR {cancelledTotal.toLocaleString()}</p>
            <p className="text-[10px] text-rose-500 font-medium">{cancelledOrders.length} cancelled order{cancelledOrders.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-lg font-bold text-gray-900">Revenue Trend ({periodLabel})</h3>
            <span className="text-xs text-gray-400">Successful orders only</span>
          </div>
          <div className="h-[280px] w-full">
            {revenueTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No sales revenue recorded for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `Rs.${val >= 1000 ? val/1000 + 'k' : val}`} dx={-10} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`LKR ${value.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-lg font-bold text-gray-900">Units Sold by Category</h3>
            <span className="text-xs text-gray-400">Total: {totalItemsSold} items</span>
          </div>
          <div className="h-[280px] w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No items sold in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#333', fontWeight: 500 }} width={100} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Top Products, Payment Methods, Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm col-span-1">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">Top 5 Products ({periodLabel})</h3>
          <div className="space-y-3.5">
            {topProductsData.map((prod, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="truncate max-w-[150px]">
                    <p className="text-xs font-semibold text-gray-900 truncate" title={prod.name}>{prod.name}</p>
                    <p className="text-[10px] text-gray-400">LKR {prod.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                  {prod.sales} sold
                </span>
              </div>
            ))}
            {topProductsData.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">No sales recorded for this period</p>}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm col-span-1">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">Payment Methods</h3>
          <div className="h-[220px] w-full">
            {paymentMethodData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No payment data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                    <Cell fill="#111827" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm col-span-1">
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="h-[220px] w-full">
            {paymentStatusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No status data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatusData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Orders & Transactions Table for Period */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900">Period Transactions Register</h3>
            <p className="text-xs text-gray-500 mt-0.5">Showing all {filteredOrders.length} order records for {periodLabel}</p>
          </div>
          <Button 
            size="small" 
            icon={<Download size={13} />} 
            onClick={exportToCSV}
            className="text-xs rounded-sm no-print"
          >
            Export Register (.CSV)
          </Button>
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredOrders} 
          rowKey="_id" 
          pagination={{ pageSize: 10, showSizeChanger: true }}
          className="report-orders-table"
        />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print, .ant-layout-sider, .ant-layout-header, header, nav, .ant-pagination {
            display: none !important;
          }
          .sales-report-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-white {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          .report-orders-table table {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminReports;
