import React, { useState, useEffect, useContext } from 'react';
import { Table, Typography, Button, Space, Modal, Form, Input, Select, message, Tag, Tabs, Popconfirm } from 'antd';
import { Edit, Trash2, Plus } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

const { Title } = Typography;
const { Option } = Select;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const { user: currentUser } = useContext(AuthContext);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || currentUser;
      const res = await fetch(`${API_URL}/api/users/staff`, {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        message.error(data.message || 'Failed to fetch staff');
      }
    } catch (err) {
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || currentUser;
      const res = await fetch(`${API_URL}/api/users/customers`, {
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data);
      } else {
        message.error(data.message || 'Failed to fetch customers');
      }
    } catch (err) {
      message.error('An error occurred');
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchCustomers();
  }, []);

  const handleDelete = async (id, isCustomer = false) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || currentUser;
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userInfo?.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        message.success(data.message || 'User deleted successfully');
        if (isCustomer) {
          fetchCustomers();
        } else {
          fetchStaff();
        }
      } else {
        message.error(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      message.error('An error occurred while deleting user');
    }
  };

  const handleAddSubmit = async (values) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || currentUser;
      const res = await fetch(`${API_URL}/api/users/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(values)
      });
      
      const data = await res.json();
      if (res.ok) {
        message.success('Staff added successfully');
        setIsModalVisible(false);
        form.resetFields();
        fetchStaff();
      } else {
        message.error(data.message || 'Failed to add staff');
      }
    } catch (err) {
      message.error('An error occurred');
    }
  };

  const handleEditClick = (record) => {
    setEditingStaff(record);
    editForm.setFieldsValue({
      name: record.name,
      email: record.email,
      role: record.role,
      password: ''
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    if (!editingStaff) return;
    setEditLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || currentUser;
      
      const payload = {
        name: values.name,
        email: values.email,
        role: values.role,
      };

      if (values.password && values.password.trim().length >= 6) {
        payload.password = values.password.trim();
      }

      const res = await fetch(`${API_URL}/api/users/${editingStaff._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        message.success(data.message || 'Staff updated successfully');
        setIsEditModalVisible(false);
        setEditingStaff(null);
        editForm.resetFields();
        fetchStaff();
      } else {
        message.error(data.message || 'Failed to update staff');
      }
    } catch (err) {
      console.error('Update staff error:', err);
      message.error('An error occurred while updating staff');
    } finally {
      setEditLoading(false);
    }
  };

  const staffColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
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
        return <Tag color={color} className="uppercase text-[10px] tracking-wider font-bold">{role.replace('_', ' ')}</Tag>;
      } 
    },
    { 
      title: 'Actions', 
      key: 'actions',
      render: (_, record) => {
        const currentUserId = currentUser?._id || currentUser?.id;
        const isSelf = currentUserId && record._id === currentUserId;
        const isDeveloper = record.role === 'developer';
        const isOwnerRestricted = currentUser?.role === 'owner' && (record.role === 'owner' || record.role === 'developer');
        
        const canDelete = !isSelf && !isDeveloper && !isOwnerRestricted;
        const canEdit = !isDeveloper || currentUser?.role === 'developer';
        const canModify = canEdit && !isOwnerRestricted;

        return (
          <Space size="small">
            <Button 
              type="default" 
              size="small"
              icon={<Edit size={14} />} 
              onClick={() => handleEditClick(record)}
              disabled={!canModify}
              className="border-gray-300 hover:border-black text-gray-700 hover:text-black flex items-center gap-1 text-xs font-medium"
              title={!canModify ? "Not authorized to edit this account" : "Edit staff details"}
            >
              Edit
            </Button>
            <Popconfirm
              title={`Are you sure you want to delete ${record.name}?`}
              description="This will permanently delete this staff member."
              onConfirm={() => handleDelete(record._id, false)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              disabled={!canDelete}
            >
              <Button 
                type="text" 
                danger 
                size="small"
                icon={<Trash2 size={15} />} 
                disabled={!canDelete}
                title={!canDelete ? (isSelf ? "Cannot delete own account" : "Cannot delete this user") : "Delete staff member"}
              />
            </Popconfirm>
          </Space>
        );
      }
    },
  ];

  const customerColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: p => p || '-' },
    { title: 'Verified', dataIndex: 'isVerified', key: 'isVerified', render: v => v ? <Tag color="green">Yes</Tag> : <Tag color="default">No</Tag> },
    { 
      title: 'Actions', 
      key: 'actions',
      render: (_, record) => {
        const currentUserId = currentUser?._id || currentUser?.id;
        const isSelf = currentUserId && record._id === currentUserId;

        return (
          <Space size="middle">
            <Popconfirm
              title={`Are you sure you want to delete ${record.name}?`}
              description="This will permanently delete this customer account."
              onConfirm={() => handleDelete(record._id, true)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
            >
              <Button 
                type="text" 
                danger 
                icon={<Trash2 size={16} />} 
                disabled={isSelf}
                title="Delete customer"
              />
            </Popconfirm>
          </Space>
        );
      }
    },
  ];

  const getAvailableRoles = () => {
    if (currentUser?.role === 'developer') {
      return [
        { label: 'Owner', value: 'owner' },
        { label: 'Inventory Handler', value: 'inventory_handler' },
        { label: 'Sales Staff', value: 'sales_staff' }
      ];
    }
    if (currentUser?.role === 'owner') {
      return [
        { label: 'Inventory Handler', value: 'inventory_handler' },
        { label: 'Sales Staff', value: 'sales_staff' }
      ];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-0 font-serif">User Directory</Title>
          <p className="text-gray-500 text-sm mt-1">Manage staff access and customer accounts</p>
        </div>
        {availableRoles.length > 0 && (
          <Button 
            type="primary" 
            className="bg-black flex items-center gap-2 h-10 px-6" 
            onClick={() => setIsModalVisible(true)}
            icon={<Plus size={16} />}
          >
            Add Staff
          </Button>
        )}
      </div>

      <Tabs defaultActiveKey="staff" className="bg-white border border-gray-100 rounded-lg p-4">
        <Tabs.TabPane tab={<span className="font-medium px-4">Staff Members ({users.length})</span>} key="staff">
          <Table 
            columns={staffColumns} 
            dataSource={users} 
            rowKey="_id"
            loading={loading}
            className="admin-table-card mt-2"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span className="font-medium px-4">Customers ({customers.length})</span>} key="customers">
          <Table 
            columns={customerColumns} 
            dataSource={customers} 
            rowKey="_id"
            loading={customersLoading}
            className="admin-table-card mt-2"
          />
        </Tabs.TabPane>
      </Tabs>

      {/* Add Staff Modal */}
      <Modal
        title={<span className="font-serif text-xl">Add New Staff</span>}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddSubmit} className="mt-6">
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input size="large" />
          </Form.Item>
          
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" />
          </Form.Item>
          
          <Form.Item name="password" label="Temporary Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password size="large" />
          </Form.Item>
          
          <Form.Item name="role" label="Assign Role" rules={[{ required: true }]}>
            <Select size="large">
              {availableRoles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item className="mb-0 mt-8 text-right">
            <Button onClick={() => setIsModalVisible(false)} className="mr-3">Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-black">Create User</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        title={<span className="font-serif text-xl">Edit Staff Member</span>}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingStaff(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} className="mt-6">
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input size="large" />
          </Form.Item>
          
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" />
          </Form.Item>

          <Form.Item 
            name="password" 
            label="New Password (optional)" 
            extra="Leave blank to keep existing password"
            rules={[{ min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password size="large" placeholder="Enter new password if changing" />
          </Form.Item>
          
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select size="large">
              {availableRoles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item className="mb-0 mt-8 text-right">
            <Button 
              onClick={() => {
                setIsEditModalVisible(false);
                setEditingStaff(null);
                editForm.resetFields();
              }} 
              className="mr-3"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={editLoading} className="bg-black">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
