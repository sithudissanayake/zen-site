/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import './AdminOrderDetails.css';

const AdminOrderDetails = ({ order, onBack, onOrderUpdated, onNavigateToProducts }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [updating, setUpdating] = useState(false);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  useEffect(() => {
    if (order && order.id) {
      fetchOrderDetails();
    } else if (order) {
      setOrderDetails(order);
      setEditData(order);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/orders/${order.id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch order details');
      const data = await response.json();
      setOrderDetails(data);
      setEditData(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditData({ ...orderDetails });
  };

  const handleInputChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveUpdate = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/orders/${orderDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          customerName: editData.customerName,
          customerPhone: editData.customerPhone,
          shippingAddress: editData.shippingAddress,
          city: editData.city,
          orderNotes: editData.orderNotes,
          totalAmount: editData.totalAmount,
          status: editData.status
        })
      });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrderDetails(updatedOrder);
        setIsEditing(false);
        alert('Order updated successfully!');
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/orders/${orderDetails.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrderDetails(updatedOrder);
        setEditData(updatedOrder);
        alert(`Order status updated to ${newStatus}`);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      setUpdating(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/orders/${orderDetails.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.ok) {
          alert('Order deleted successfully!');
          if (onBack) onBack();
        } else {
          alert('Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
      } finally {
        setUpdating(false);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#f59e0b',
      'PROCESSING': '#3b82f6',
      'SHIPPED': '#8b5cf6',
      'DELIVERED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status?.toUpperCase()] || '#6b7280';
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'PENDING': 'status-pending',
      'PROCESSING': 'status-processing',
      'SHIPPED': 'status-shipped',
      'DELIVERED': 'status-delivered',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status?.toUpperCase()] || 'status-pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="admin-order-details">
        <div className="details-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-order-details">
        <div className="details-card">
          <div className="error-message">
            <p>Error: {error}</p>
            <button className="back-btn" onClick={onBack}>← Back to Orders</button>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="admin-order-details">
        <div className="details-card">
          <p>Order not found</p>
          <button className="back-btn" onClick={onBack}>← Back to Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-order-details">
      <div className="details-card">
        <button className="back-btn" onClick={onBack}>
          ← Back to Orders
        </button>
        
        <div className="details-header">
          <h2>Order #{orderDetails.orderNumber || `ORD-${orderDetails.id}`}</h2>
          {!isEditing && (
            <div className="header-actions">
              <select
                value={orderDetails.status || 'PENDING'}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className={`status-select ${getStatusBadgeClass(orderDetails.status)}`}
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}
        </div>
        
        {!isEditing ? (
          // View Mode
          <div className="details-view">
            <div className="details-grid">
              <div className="details-section">
                <h3>Order Information</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Order ID :</span>
                    <span className="detail-value">{orderDetails.orderNumber || orderDetails.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Order Date :</span>
                    <span className="detail-value">{formatDate(orderDetails.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Order Status :</span>
                    <span className={`status-badge ${getStatusBadgeClass(orderDetails.status)}`}>
                      {orderDetails.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Customer Information</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Customer Name :</span>
                    <span className="detail-value">{orderDetails.customerName || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone Number :</span>
                    <span className="detail-value">{orderDetails.customerPhone || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">City :</span>
                    <span className="detail-value">{orderDetails.city || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Shipping Information</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Shipping Address :</span>
                    <span className="detail-value">{orderDetails.shippingAddress || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Order Notes :</span>
                    <span className="detail-value">{orderDetails.orderNotes || 'No notes'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Order Summary</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Total Amount :</span>
                    <span className="detail-value total-amount">
                      RS: {orderDetails.totalAmount ? orderDetails.totalAmount.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Section */}
            {orderDetails.items && orderDetails.items.length > 0 && (
              <div className="details-section">
                <h3>Order Items</h3>
                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName || item.name}</td>
                          <td>{item.quantity}</td>
                          <td>RS: {item.price ? item.price.toFixed(2) : '0.00'}</td>
                          <td>RS: {item.subtotal ? item.subtotal.toFixed(2) : (item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                        <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                          RS: {orderDetails.totalAmount ? orderDetails.totalAmount.toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button className="btn-edit" onClick={handleEditClick}>
                 Edit Order
              </button>
              <button className="btn-delete" onClick={handleDeleteOrder}>
                 Delete Order
              </button>
              <button 
                className="btn-products" 
                onClick={() => onNavigateToProducts && onNavigateToProducts()}
                style={{ backgroundColor: '#10b981', marginLeft: '10px' }}
              >
                 Place New Order
              </button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="details-edit">
            <div className="edit-form">
              <div className="form-group">
                <label>Customer Name:</label>
                <input
                  type="text"
                  name="customerName"
                  value={editData.customerName || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="text"
                  name="customerPhone"
                  value={editData.customerPhone || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="form-group">
                <label>Shipping Address:</label>
                <textarea
                  name="shippingAddress"
                  value={editData.shippingAddress || ''}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                  placeholder="Enter shipping address"
                />
              </div>
              
              <div className="form-group">
                <label>City:</label>
                <input
                  type="text"
                  name="city"
                  value={editData.city || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter city"
                />
              </div>
              
              <div className="form-group">
                <label>Order Notes:</label>
                <textarea
                  name="orderNotes"
                  value={editData.orderNotes || ''}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="2"
                  placeholder="Any special notes..."
                />
              </div>
              
              <div className="form-group">
                <label>Total Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  name="totalAmount"
                  value={editData.totalAmount || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter total amount"
                />
              </div>
              
              <div className="form-group">
                <label>Order Status:</label>
                <select
                  name="status"
                  value={editData.status || 'PENDING'}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="btn-save" 
                onClick={handleSaveUpdate}
                disabled={updating}
              >
                {updating ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button 
                className="btn-cancel" 
                onClick={() => setIsEditing(false)}
              >
                 Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDetails;