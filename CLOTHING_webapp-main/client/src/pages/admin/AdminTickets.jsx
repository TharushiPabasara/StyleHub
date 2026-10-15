import React, { useState, useEffect } from 'react';
import { Table, Tag, Select, message, Spin, Button, Modal } from 'antd';
import { Ticket, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/api';

const { Option } = Select;

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const showTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedTicket(null);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await fetch(`${API_URL}/api/tickets`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data);
      } else {
        message.error(data.message || 'Failed to fetch tickets');
      }
    } catch (err) {
      message.error('An error occurred while fetching tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        message.success('Ticket status updated');
        setTickets(tickets.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
      } else {
        const data = await res.json();
        message.error(data.message || 'Failed to update ticket status');
      }
    } catch (err) {
      message.error('An error occurred');
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.name}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
          {record.phone && <div className="text-[11px] text-gray-400">{record.phone}</div>}
        </div>
      )
    },
    {
      title: 'Issue Type',
      dataIndex: 'issueType',
      key: 'issueType',
      render: (type) => <span className="capitalize">{type}</span>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (msg, record) => (
        <div className="flex items-center justify-between">
          <div className="max-w-[200px] text-xs truncate" title={msg}>{msg}</div>
          <Button type="link" size="small" onClick={() => showTicketDetails(record)} className="p-0 h-auto">View full</Button>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Select 
          value={record.status} 
          style={{ width: 120 }}
          onChange={(val) => handleStatusChange(record._id, val)}
          bordered={false}
          className={`
            ${record.status === 'open' ? 'bg-red-50 text-red-600' : ''}
            ${record.status === 'in-progress' ? 'bg-yellow-50 text-yellow-600' : ''}
            ${record.status === 'resolved' ? 'bg-green-50 text-green-600' : ''}
            rounded-md
          `}
        >
          <Option value="open">Open</Option>
          <Option value="in-progress">In Progress</Option>
          <Option value="resolved">Resolved</Option>
        </Select>
      )
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-serif text-[#111] mb-2 flex items-center gap-3">
            <Ticket size={32} /> Support Tickets
          </h1>
          <p className="text-gray-500 text-sm">Manage customer login and registration issues.</p>
        </div>
        <Button onClick={fetchTickets} icon={<RefreshCw size={14} />}>Refresh</Button>
      </div>

      <div className="bg-white admin-table-card border border-gray-100 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Spin size="large" /></div>
        ) : (
          <Table 
            columns={columns} 
            dataSource={tickets} 
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </div>

      <Modal
        title="Ticket Details"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>
        ]}
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">User</h4>
              <p>{selectedTicket.name} ({selectedTicket.email})</p>
              {selectedTicket.phone && <p className="text-xs text-gray-500 mt-1">Phone: {selectedTicket.phone}</p>}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Issue Type</h4>
              <p className="capitalize">{selectedTicket.issueType}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Message</h4>
              <div className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap border border-gray-100">
                {selectedTicket.message}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTickets;
