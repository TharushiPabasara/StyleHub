import React, { useState, useEffect, useContext } from 'react';
import { Table, Spin, message, Dropdown, Badge } from 'antd';
import { AuthContext } from '../../context/AuthContext';
import { MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { API_URL } from '../../config/api';

const AdminReviews = () => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`${API_URL}/api/reviews/admin`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        message.error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        message.success(`Review ${newStatus.toLowerCase()} successfully`);
        fetchReviews(); // Refresh
      } else {
        message.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      message.error('An error occurred');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <Badge status="success" text="Approved" className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-green-100" />;
      case 'Rejected':
        return <Badge status="error" text="Rejected" className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-red-100" />;
      default:
        return <Badge status="warning" text="Pending" className="bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-100" />;
    }
  };

  const columns = [
    {
      title: 'Customer',
      key: 'user',
      render: (_, record) => (
        <div>
          <p className="font-bold text-gray-900 text-sm">{record.user?.name || 'Unknown User'}</p>
          <p className="text-xs text-gray-500">{record.user?.email}</p>
        </div>
      )
    },
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => <p className="text-sm font-medium text-gray-900">{record.product?.name || 'Unknown Product'}</p>
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <div className="flex items-center text-yellow-500 text-sm">
          {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        </div>
      )
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment) => <p className="text-sm text-gray-600 max-w-xs truncate" title={comment}>{comment}</p>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const items = [
          {
            key: 'approve',
            disabled: record.status === 'Approved',
            onClick: () => handleStatusChange(record._id, 'Approved'),
            label: <div className="flex items-center gap-2 text-green-600"><CheckCircle size={14} /> Approve</div>,
          },
          {
            key: 'reject',
            disabled: record.status === 'Rejected',
            onClick: () => handleStatusChange(record._id, 'Rejected'),
            label: <div className="flex items-center gap-2 text-red-600"><XCircle size={14} /> Reject</div>,
          },
          {
            key: 'pending',
            disabled: record.status === 'Pending',
            onClick: () => handleStatusChange(record._id, 'Pending'),
            label: <div className="flex items-center gap-2 text-yellow-600"><Clock size={14} /> Mark Pending</div>,
          }
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical size={16} className="text-gray-500" />
            </button>
          </Dropdown>
        );
      }
    }
  ];

  if (loading) return <div className="py-20 flex justify-center"><Spin size="large" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-1">Customer Reviews</h1>
          <p className="text-gray-500 text-sm">Moderate and manage product reviews submitted by customers.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={reviews} 
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default AdminReviews;
