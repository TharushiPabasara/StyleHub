import React, { useContext, useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Popover, Badge } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  LogOut,
  Menu as MenuIcon,
  Home,
  Bell,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Star,
  AlertTriangle,
  Check
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { API_URL } from '../config/api';
import './Admin.css'; // Import custom styles

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user?.token]);

  const markAllAsRead = async () => {
    if (!user?.token) return;
    try {
      await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const markSingleAsRead = async (id) => {
    if (!user?.token) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const allMenuItems = [
    {
      key: '/admin/dashboard',
      icon: <LayoutDashboard size={18} />,
      label: 'Dashboard',
      roles: ['developer', 'owner', 'inventory_handler', 'sales_staff']
    },
    {
      key: '/admin/users',
      icon: <Users size={18} />,
      label: 'Customer & Staff Management',
      roles: ['developer', 'owner']
    },
    {
      key: '/admin/products',
      icon: <Package size={18} />,
      label: 'Product & Stock Management',
      roles: ['developer', 'owner', 'inventory_handler']
    },
    {
      key: '/admin/orders',
      icon: <ShoppingBag size={18} />,
      label: 'Order Management',
      roles: ['developer', 'owner', 'sales_staff']
    },
    {
      key: '/admin/payments',
      icon: <CreditCard size={18} />,
      label: 'Payments & Sales Reports',
      roles: ['developer', 'owner']
    },
    {
      key: '/admin/reviews',
      icon: <Star size={18} />,
      label: 'Customer Reviews',
      roles: ['developer', 'owner']
    },
    {
      key: '/admin/tickets',
      icon: <MessageSquare size={18} />,
      label: 'Support Tickets',
      roles: ['developer', 'owner', 'sales_staff']
    },
    {
      key: 'divider',
      type: 'divider',
      style: { backgroundColor: '#333' },
      roles: ['developer', 'owner']
    },
    {
      key: '/admin/settings',
      icon: <Settings size={18} />,
      label: 'Settings',
      roles: ['developer', 'owner']
    }
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role));

  return (
    <Layout className="min-h-screen admin-layout-container" style={{ backgroundColor: '#fcfaf8' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        className="admin-sidebar"
      >
        <div className="pt-8 pb-4 px-6">
          <h1 className={`text-[#d4af37] text-[10px] tracking-widest font-bold uppercase transition-all ${collapsed ? 'scale-0 hidden' : 'scale-100'}`}>
            Console • {settings?.companyName || 'StyleHub'}
          </h1>
          <p className={`text-gray-400 text-xs mt-1 transition-all ${collapsed ? 'hidden' : 'block'}`}>
            Management Portal
          </p>
          <div className={`text-[#d4af37] text-xl font-serif font-bold text-center transition-all ${!collapsed ? 'scale-0 hidden' : 'scale-100'}`}>
            A.
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          className="mt-4"
        />

        {!collapsed && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#d4af37]"></div>
              <span className="text-[#d4af37] text-[10px] font-bold tracking-widest uppercase">Flagship Store</span>
            </div>
            <p className="text-gray-400 text-xs italic font-serif">{settings?.locationCity}</p>
            <p className="text-gray-500 text-[10px]">Sri Lanka • GMT+5:30</p>
          </div>
        )}
      </Sider>

      <Layout style={{ backgroundColor: '#fcfaf8' }}>
        <Header
          className="flex items-center justify-between px-6 bg-white border-b border-gray-200"
          style={{ height: '72px', padding: '0 24px' }}
        >
          <div className="flex items-center gap-6">
            <Button
              type="text"
              icon={<MenuIcon size={20} />}
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-black"
            />

            {/* Logo Area */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-serif tracking-widest uppercase font-bold m-0">{settings?.companyName || 'StyleHub'}</h2>
              <span className="text-[#d4af37] text-[10px] tracking-widest font-bold uppercase">Sri Lanka</span>
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-500">
                  {settings?.locationCity
                    ? (settings.locationCity.toLowerCase().includes('branch')
                      ? `${settings.locationCity} & Islandwide Delivery`
                      : `${settings.locationCity} Main Branch & Islandwide Delivery`)
                    : 'Akuressa Main Branch & Islandwide Delivery'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors">
              <Home size={16} />
              <span className="text-xs font-medium">Live Storefront</span>
            </Link>

            <Popover
              content={
                <div className="w-80 sm:w-96 max-h-[460px] flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-gray-900 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-gray-500 hover:text-black font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1 divide-y divide-gray-50 my-1 max-h-[350px]">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <Check size={28} className="mx-auto mb-2 text-emerald-500" />
                        <p className="text-xs">No new notifications.</p>
                      </div>
                    ) : (
                      notifications.map(item => (
                        <div
                          key={item._id}
                          onClick={() => {
                            markSingleAsRead(item._id);
                            setNotifOpen(false);
                            navigate(item.type === 'ORDER_CREATED' ? '/admin/orders' : '/admin/products');
                          }}
                          className={`p-3 cursor-pointer hover:bg-neutral-50 transition-colors flex items-start gap-3 ${!item.isRead ? 'bg-red-50/40' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full ${item.type === 'ORDER_CREATED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            {item.type === 'ORDER_CREATED' ? <ShoppingBag size={15} /> : <AlertTriangle size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-bold text-gray-900 truncate">
                                {item.productName || item.title}
                              </span>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 ml-1"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 mb-1">
                              {item.message}
                            </p>
                            {item.variant && (
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                                  Stock: <strong className="text-red-600">{item.variant.stock}</strong> / Min: {item.variant.threshold ?? 2}
                                </span>
                                <span className="text-gray-400">
                                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 text-center">
                    <Link
                      to="/admin/products"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-medium text-black hover:underline"
                    >
                      Manage Stock &amp; Thresholds &rarr;
                    </Link>
                  </div>
                </div>
              }
              trigger="click"
              placement="bottomRight"
              open={notifOpen}
              onOpenChange={setNotifOpen}
            >
              <button
                className="text-gray-400 hover:text-black transition-colors relative flex items-center justify-center p-2 rounded-full hover:bg-gray-100"
                title="Low Stock & System Notifications"
              >
                <Badge count={unreadCount} size="small" offset={[2, -2]}>
                  <Bell size={18} className="text-gray-600" />
                </Badge>
              </button>
            </Popover>

            <div className="w-px h-6 bg-gray-200"></div>

            <div className="flex items-center gap-3">
              <Avatar size={36} className="bg-[#111] font-serif font-bold text-white">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900 leading-tight">
                  {user?.name || 'Staff User'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#d4af37] leading-tight mt-0.5">
                  {user?.role === 'developer' ? 'Developer' : user?.role === 'owner' ? 'Store Owner' : user?.role === 'inventory_handler' ? 'Inventory Handler' : user?.role === 'sales_staff' ? 'Sales Staff' : 'Staff'}
                </span>
              </div>
            </div>

            <Button
              type="text"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
            >
              <span className="text-xs font-medium">Logout</span>
            </Button>
          </div>
        </Header>

        <Content className="p-8">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
