import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Switch, Tag, Popconfirm, message } from 'antd';
import { Plus, Edit, Trash2, Calendar, Clock, Sparkles, AlertCircle, CheckCircle, Tag as TagIcon } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

const { Option } = Select;

const CategoryDiscountsManager = () => {
  const { user } = useContext(AuthContext);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [form] = Form.useForm();

  // Helper to format ISO to datetime-local input string
  const formatForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/discounts`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data);
      } else {
        message.error('Failed to load category discounts');
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      message.error('An error occurred loading discounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingDiscount(null);
    form.resetFields();

    // Default: starts now, ends in 7 days
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    form.setFieldsValue({
      title: '',
      category: 'Womenswear',
      discountPercentage: 20,
      startDate: formatForInput(now),
      endDate: formatForInput(nextWeek),
      isActive: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingDiscount(record);
    form.setFieldsValue({
      title: record.title,
      category: record.category,
      discountPercentage: record.discountPercentage,
      startDate: formatForInput(record.startDate),
      endDate: formatForInput(record.endDate),
      isActive: record.isActive !== false,
      description: record.description || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (record, checked) => {
    try {
      const res = await fetch(`${API_URL}/api/discounts/${record._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ isActive: checked }),
      });

      if (res.ok) {
        message.success(checked ? `"${record.title}" resumed` : `"${record.title}" paused`);
        fetchDiscounts();
      } else {
        const err = await res.json();
        message.error(err.message || 'Failed to update discount status');
      }
    } catch (error) {
      message.error('Failed to update discount status');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/discounts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (res.ok) {
        message.success('Category discount campaign removed');
        fetchDiscounts();
      } else {
        const err = await res.json();
        message.error(err.message || 'Failed to delete discount');
      }
    } catch (error) {
      message.error('Failed to delete discount');
    }
  };

  const onFinish = async (values) => {
    try {
      const url = editingDiscount
        ? `${API_URL}/api/discounts/${editingDiscount._id}`
        : `${API_URL}/api/discounts`;
      const method = editingDiscount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(editingDiscount ? 'Discount campaign updated' : 'Category discount campaign created');
        setIsModalOpen(false);
        fetchDiscounts();
      } else {
        const err = await res.json();
        message.error(err.message || 'Failed to save discount campaign');
      }
    } catch (error) {
      message.error('An error occurred while saving');
    }
  };

  // Quick preset helper
  const applyPreset = (days) => {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    form.setFieldsValue({
      startDate: formatForInput(now),
      endDate: formatForInput(future),
    });
    message.info(`Applied ${days}-day campaign window`);
  };

  const now = new Date();
  const activeNowCount = discounts.filter(d => d.isActive && now >= new Date(d.startDate) && now <= new Date(d.endDate)).length;
  const scheduledCount = discounts.filter(d => d.isActive && now < new Date(d.startDate)).length;
  const expiredCount = discounts.filter(d => now > new Date(d.endDate)).length;

  const columns = [
    {
      title: 'Campaign & Category',
      key: 'campaign',
      render: (_, record) => {
        let categoryColor = 'purple';
        if (record.category === 'Menswear') categoryColor = 'blue';
        if (record.category === 'Womenswear') categoryColor = 'magenta';
        if (record.category === 'Accessories') categoryColor = 'gold';
        if (record.category === 'All') categoryColor = 'cyan';

        return (
          <div>
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <span>{record.title}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Tag color={categoryColor} className="text-[11px] font-semibold uppercase tracking-wider">
                {record.category === 'All' ? 'ALL CATEGORIES' : record.category}
              </Tag>
              {record.description && (
                <span className="text-xs text-gray-500 line-clamp-1">{record.description}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Discount Rate',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      width: 130,
      render: (pct) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
          <Sparkles size={13} />
          {pct}% OFF
        </span>
      ),
    },
    {
      title: 'Active Schedule Window',
      key: 'schedule',
      render: (_, record) => {
        const start = new Date(record.startDate);
        const end = new Date(record.endDate);
        return (
          <div className="text-xs text-gray-600 space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-gray-800">
              <Calendar size={13} className="text-gray-400" />
              <span>{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}, {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock size={13} className="text-gray-400" />
              <span>to {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}, {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Live Status',
      key: 'status',
      width: 160,
      render: (_, record) => {
        const isExpired = now > new Date(record.endDate);
        const isScheduled = record.isActive && now < new Date(record.startDate);
        const isActiveNow = record.isActive && now >= new Date(record.startDate) && now <= new Date(record.endDate);
        const isPaused = !record.isActive;

        return (
          <div className="space-y-1">
            {isActiveNow && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE NOW
              </span>
            )}
            {isScheduled && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium text-[11px]">
                <Clock size={12} />
                SCHEDULED
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500 font-medium text-[11px]">
                EXPIRED
              </span>
            )}
            {isPaused && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium text-[11px]">
                PAUSED
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Enable / Pause',
      key: 'isActive',
      width: 130,
      render: (_, record) => (
        <Switch
          checked={record.isActive !== false}
          size="small"
          onChange={(checked) => handleToggleStatus(record, checked)}
          className={record.isActive !== false ? '!bg-emerald-600' : '!bg-gray-300'}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<Edit size={15} />}
            onClick={() => handleOpenEditModal(record)}
          />
          <Popconfirm
            title="Delete Discount Campaign"
            description="Are you sure you want to permanently remove this campaign?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Top Banner & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Live Now</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{activeNowCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Scheduled Upcoming</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{scheduledCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Past / Expired</span>
            <span className="text-2xl font-bold text-gray-500 mt-1 block">{expiredCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="text-xs text-neutral-300 font-medium">New Promotion</div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="w-full mt-2 py-2 bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm m-0">Category Discount Campaigns</h3>
            <p className="text-xs text-gray-500 m-0 mt-0.5">
              Promotional price reductions are automatically applied across storefront catalogs, product details, and checkout during active date windows.
            </p>
          </div>

        </div>

        <Table
          columns={columns}
          dataSource={discounts}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          className="no-border"
        />
      </div>

      {/* Create / Edit Campaign Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={560}
        title={
          <div className="pb-3 border-b border-gray-100">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 block mb-0.5">
              PROMOTIONS & SALES ATELIER
            </span>
            <h3 className="font-serif text-2xl text-gray-900 font-normal m-0">
              {editingDiscount ? 'Edit Discount Campaign' : 'Create Category Discount Campaign'}
            </h3>
          </div>
        }
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="pt-4"
        >
          {/* Campaign Title */}
          <Form.Item
            name="title"
            label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Campaign Title *</span>}
            rules={[{ required: true, message: 'Please enter campaign title' }]}
          >
            <Input
              placeholder="e.g. Summer Flash Sale, 20% Off Womenswear"
              className="h-10 rounded-lg text-sm"
            />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Category */}
            <Form.Item
              name="category"
              label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Target Category *</span>}
              rules={[{ required: true, message: 'Select category' }]}
            >
              <Select className="h-10 text-sm">
                <Option value="Womenswear">Womenswear</Option>
                <Option value="Menswear">Menswear</Option>
                <Option value="Accessories">Accessories</Option>
                <Option value="All">All Categories (Storewide)</Option>
              </Select>
            </Form.Item>

            {/* Discount Percentage */}
            <Form.Item
              name="discountPercentage"
              label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Discount Rate (%) *</span>}
              rules={[{ required: true, message: 'Enter discount percent' }]}
            >
              <InputNumber
                min={1}
                max={90}
                className="w-full h-10 !flex items-center text-sm font-semibold rounded-lg"
                prefix={<span className="text-rose-600 font-bold mr-1">%</span>}
                placeholder="20"
              />
            </Form.Item>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Quick Duration Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset(1)}
                className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
              >
                24 Hours Flash
              </button>
              <button
                type="button"
                onClick={() => applyPreset(3)}
                className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Weekend (3 Days)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
              >
                1 Week (7 Days)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
              >
                1 Month (30 Days)
              </button>
            </div>
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="startDate"
              label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Start Date & Time *</span>}
              rules={[{ required: true, message: 'Select start date' }]}
            >
              <input
                type="datetime-local"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black"
                onChange={(e) => form.setFieldsValue({ startDate: e.target.value })}
              />
            </Form.Item>

            <Form.Item
              name="endDate"
              label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">End Date & Time *</span>}
              rules={[{ required: true, message: 'Select end date' }]}
            >
              <input
                type="datetime-local"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black"
                onChange={(e) => form.setFieldsValue({ endDate: e.target.value })}
              />
            </Form.Item>
          </div>

          {/* Notes / Description */}
          <Form.Item
            name="description"
            label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Campaign Notes (Optional)</span>}
          >
            <Input.TextArea
              rows={2}
              placeholder="e.g. End of Season Sale applied to all Womenswear items..."
              className="rounded-lg text-xs p-2.5"
            />
          </Form.Item>

          {/* Active Status */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800 block">
                Campaign Active Status
              </span>
              <span className="text-[11px] text-gray-500">
                When active, prices will automatically adjust during the specified start and end dates.
              </span>
            </div>
            <Form.Item name="isActive" valuePropName="checked" style={{ margin: 0 }}>
              <Switch checkedChildren="Active" unCheckedChildren="Paused" className="!bg-emerald-600" />
            </Form.Item>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-black font-semibold">
              {editingDiscount ? 'Update Campaign' : 'Launch Campaign'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryDiscountsManager;
