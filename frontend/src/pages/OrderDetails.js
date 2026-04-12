import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderDetails.css';

const OrderDetails = ({ order: propOrder, onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(propOrder || null);
  const [loading, setLoading] = useState(!propOrder);
  const [error, setError] = useState(null);
  
  const API_URL = 'http://localhost:8080';

  useEffect(() => {
    if (propOrder) {
      console.log('Using order from prop:', propOrder);
      setOrderDetails(propOrder);
      setLoading(false);
      return;
    }
    
    if (id) {
      fetchOrderDetails();
    }
  }, [id, propOrder]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log(`Fetching order ${id} from: ${API_URL}/api/orders/${id}`);
      
      const response = await fetch(`${API_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Order details response:', data);
      setOrderDetails(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/orders');
    }
  };

  if (loading) {
    return (
      <div className="order-details-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-container">
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <button className="back-btn" onClick={handleBack}>← Back to Orders</button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="order-details-container">
        <div className="error-container">
          <p>Order not found</p>
          <button className="back-btn" onClick={handleBack}>← Back to Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-container">
      <button className="back-btn" onClick={handleBack}>
        ← Back to Orders
      </button>

      <div className="order-details-card">
        {/* Header Section */}
        <div className="details-header">
          <h2>Order #{orderDetails.orderNumber || `ORD-${orderDetails.orderId}`}</h2>
          <span className={`status-badge ${getStatusBadgeClass(orderDetails.status)}`}>
            {orderDetails.status || 'PENDING'}
          </span>
        </div>

        {/* Order Information Section */}
        <div className="details-section">
          <h3>Order Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Order Date</span>
              <span className="value">{formatDate(orderDetails.createdAt)}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Amount</span>
              <span className="value total">Rs. {parseFloat(orderDetails.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="details-section">
          <h3>Customer Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Customer Name</span>
              <span className="value">{orderDetails.customerName || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Phone Number</span>
              <span className="value">{orderDetails.customerPhone || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Email</span>
              <span className="value">{orderDetails.customerEmail || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">City</span>
              <span className="value">{orderDetails.city || 'N/A'}</span>
            </div>
            <div className="info-item full-width">
              <span className="label">Shipping Address</span>
              <span className="value">{orderDetails.shippingAddress || 'N/A'}</span>
            </div>
            {orderDetails.orderNotes && (
              <div className="info-item full-width">
                <span className="label">Order Notes</span>
                <span className="value">{orderDetails.orderNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items Section */}
        <div className="details-section">
          <h3>Order Items</h3>
          {orderDetails.items && orderDetails.items.length > 0 ? (
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Unit Price (Rs.)</th>
                    <th>Subtotal (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.productName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">Rs. {parseFloat(item.price).toFixed(2)}</td>
                      <td className="text-right">Rs. {parseFloat(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-right"><strong>Total:</strong></td>
                    <td className="text-right total-amount">
                      Rs. {parseFloat(orderDetails.totalAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-items">
              <p>No items found for this order</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;