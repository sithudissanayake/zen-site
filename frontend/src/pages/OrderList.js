import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderList.css';

const OrderList = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  // Get user email
  const getUserEmail = () => {
    return user?.email || user?.emailAddress || localStorage.getItem('userEmail');
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const userEmail = getUserEmail();
      
      if (!userEmail) {
        setError('Please login to view your orders');
        setLoading(false);
        return;
      }
      
      console.log('Fetching orders for email:', userEmail);
      
      const response = await fetch(`http://localhost:8080/api/orders/customer/email?email=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched orders:', data);
      
      setOrders(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('Fetch orders failed:', err);
      setError('Connection error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate order statistics
  const getOrderStats = () => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = filteredOrders.filter(o => o.status === 'PENDING').length;
    const deliveredOrders = filteredOrders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'CANCELLED').length;
    
    return { totalOrders, totalRevenue, pendingOrders, deliveredOrders, cancelledOrders };
  };

  const stats = getOrderStats();

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="order-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-list-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      {/* Back to Products Button */}
      <div className="back-to-products">
        <button className="back-to-products-btn" onClick={() => navigate('/products')}>
          ← Back to Products
        </button>
      </div>

      {/* Header Section */}
      <div className="order-list-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="header-title">My Orders</h1>
            <p className="header-subtitle">Track and manage all your orders in one place</p>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="stat-number">{stats.totalOrders}</span>
              <span className="stat-label">Total Orders</span>
            </div>
            <div className="header-stat">
              <span className="stat-number">Rs. {stats.totalRevenue.toFixed(2)}</span>
              <span className="stat-label">Total Spent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card delivered">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.deliveredOrders}</h3>
            <p>Delivered</p>
          </div>
        </div>
        <div className="stat-card cancelled">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{stats.cancelledOrders}</h3>
            <p>Cancelled</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="order-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by Order ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Orders
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilterStatus('PENDING')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'PROCESSING' ? 'active' : ''}`}
            onClick={() => setFilterStatus('PROCESSING')}
          >
            Processing
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'SHIPPED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('SHIPPED')}
          >
            Shipped
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('DELIVERED')}
          >
            Delivered
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('CANCELLED')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">📦</div>
          <p>No orders found</p>
          <button className="btn-primary" onClick={() => navigate('/products')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>DATE</th>
                <th>CUSTOMER</th>
                <th>PHONE</th>
                <th>TOTAL AMOUNT</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>{order.orderNumber || 'N/A'}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.customerName || 'N/A'}</td>
                  <td>{order.customerPhone || 'N/A'}</td>
                  <td>Rs.{order.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-view" 
                      onClick={() => navigate(`/order/${order.orderId}`)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderList;