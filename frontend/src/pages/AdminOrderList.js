import React, { useState, useEffect } from 'react';
import './AdminOrderList.css';

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportParams, setReportParams] = useState({
    startDate: '',
    endDate: '',
    status: 'ALL'
  });
  
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    city: '',
    orderNotes: '',
    totalAmount: '',
    status: 'PENDING'
  });
  
  const API_URL = 'http://localhost:8080';

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      const data = await response.json();
      console.log('Fetched orders:', data);
      setOrders(Array.isArray(data) ? data : []);
      setFilteredOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Error fetching orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`);
      const data = await response.json();
      console.log('Order details:', data);
      setSelectedOrderDetails(data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Error fetching order details: ' + error.message);
    }
  };

  const filterOrders = () => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = orders.filter(order => 
        (order.customerName && order.customerName.toLowerCase().includes(term)) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(term)) ||
        (order.status && order.status.toLowerCase().includes(term)) ||
        (order.customerPhone && order.customerPhone.includes(term)) ||
        (order.city && order.city.toLowerCase().includes(term))
      );
      setFilteredOrders(filtered);
    }
  };

  const addOrder = async () => {
    if (!newOrder.customerName || newOrder.customerName.trim() === '') {
      alert('Please enter customer name');
      return;
    }
    if (!newOrder.customerPhone || newOrder.customerPhone.trim() === '') {
      alert('Please enter customer phone number');
      return;
    }
    if (!newOrder.shippingAddress || newOrder.shippingAddress.trim() === '') {
      alert('Please enter shipping address');
      return;
    }
    if (!newOrder.city || newOrder.city.trim() === '') {
      alert('Please enter city');
      return;
    }
    if (!newOrder.totalAmount || parseFloat(newOrder.totalAmount) <= 0) {
      alert('Please enter valid total amount (greater than 0)');
      return;
    }
    
    try {
      const orderData = {
        customerName: newOrder.customerName.trim(),
        customerPhone: newOrder.customerPhone.trim(),
        shippingAddress: newOrder.shippingAddress.trim(),
        city: newOrder.city.trim(),
        orderNotes: newOrder.orderNotes ? newOrder.orderNotes.trim() : '',
        totalAmount: parseFloat(newOrder.totalAmount),
        status: newOrder.status
      };
      
      console.log('Sending order data:', orderData);
      
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (response.ok && result.success !== false) {
        alert('Order added successfully!');
        setNewOrder({
          customerName: '',
          customerPhone: '',
          shippingAddress: '',
          city: '',
          orderNotes: '',
          totalAmount: '',
          status: 'PENDING'
        });
        setShowAddModal(false);
        fetchOrders();
      } else {
        alert('Failed to add order: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding order:', error);
      alert('Error adding order: ' + error.message);
    }
  };

  const updateOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedOrder)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Order updated successfully!');
        setShowEditModal(false);
        fetchOrders();
      } else {
        alert('Failed to update order: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order: ' + error.message);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchOrders();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status: ' + error.message);
    }
  };

  const deleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await fetch(`${API_URL}/api/orders/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          alert('Order deleted successfully');
          fetchOrders();
        } else {
          alert('Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order: ' + error.message);
      }
    }
  };

  // Generate Report Preview
  const generateReportPreview = async () => {
    setGeneratingReport(true);
    try {
      // Get filtered orders based on criteria
      let filtered = [...orders];
      
      if (reportParams.status && reportParams.status !== 'ALL') {
        filtered = filtered.filter(order => order.status === reportParams.status);
      }
      
      if (reportParams.startDate) {
        const startDate = new Date(reportParams.startDate);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(order => new Date(order.createdAt) >= startDate);
      }
      
      if (reportParams.endDate) {
        const endDate = new Date(reportParams.endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(order => new Date(order.createdAt) <= endDate);
      }
      
      const totalOrders = filtered.length;
      const totalRevenue = filtered.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const pendingOrders = filtered.filter(o => o.status === 'PENDING').length;
      const processingOrders = filtered.filter(o => o.status === 'PROCESSING').length;
      const shippedOrders = filtered.filter(o => o.status === 'SHIPPED').length;
      const deliveredOrders = filtered.filter(o => o.status === 'DELIVERED').length;
      const cancelledOrders = filtered.filter(o => o.status === 'CANCELLED').length;
      
      setReportData({
        orders: filtered,
        totalOrders,
        totalRevenue,
        statusCounts: {
          PENDING: pendingOrders,
          PROCESSING: processingOrders,
          SHIPPED: shippedOrders,
          DELIVERED: deliveredOrders,
          CANCELLED: cancelledOrders
        },
        startDate: reportParams.startDate,
        endDate: reportParams.endDate,
        status: reportParams.status,
        generatedAt: new Date().toISOString()
      });
      
      setShowReportModal(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Download PDF Report
  const downloadPDFReport = async () => {
    try {
      let url = `${API_URL}/api/orders/report`;
      const params = new URLSearchParams();
      
      if (reportParams.startDate) params.append('startDate', reportParams.startDate);
      if (reportParams.endDate) params.append('endDate', reportParams.endDate);
      if (reportParams.status && reportParams.status !== 'ALL') params.append('status', reportParams.status);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url_blob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_blob;
      link.download = `order_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url_blob);
      
      alert('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report: ' + error.message);
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportData(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'PROCESSING': return '#3b82f6';
      case 'SHIPPED': return '#8b5cf6';
      case 'DELIVERED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
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

  const getOrderStats = () => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = filteredOrders.filter(o => o.status === 'PENDING').length;
    const deliveredOrders = filteredOrders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'CANCELLED').length;
    
    return { totalOrders, totalRevenue, pendingOrders, deliveredOrders, cancelledOrders };
  };

  const stats = getOrderStats();

  if (loading) return <div className="admin-loading">Loading orders...</div>;

  return (
    <div className="admin-order-container">
      {/* Report Preview Modal */}
      {showReportModal && reportData && (
        <div className="modal-overlay">
          <div className="modal-content report-modal-large">
            <div className="modal-header">
              <h2>📊 Order Report</h2>
              <button className="modal-close" onClick={closeReportModal}>×</button>
            </div>
            <div className="report-preview-content">
              {/* Report Header */}
              <div className="report-header">
                <h3>ORDER REPORT SUMMARY</h3>
                <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
                <p>Date Range: {reportData.startDate || 'All'} to {reportData.endDate || 'All'}</p>
                <p>Status: {reportData.status === 'ALL' ? 'All Orders' : reportData.status}</p>
              </div>

              {/* Summary Cards */}
              <div className="report-summary-cards">
                <div className="report-card">
                  <div className="report-card-title">Total Orders</div>
                  <div className="report-card-value">{reportData.totalOrders}</div>
                </div>
                <div className="report-card">
                  <div className="report-card-title">Total Revenue</div>
                  <div className="report-card-value">Rs. {reportData.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="report-card pending">
                  <div className="report-card-title">Pending</div>
                  <div className="report-card-value">{reportData.statusCounts.PENDING}</div>
                </div>
                <div className="report-card processing">
                  <div className="report-card-title">Processing</div>
                  <div className="report-card-value">{reportData.statusCounts.PROCESSING}</div>
                </div>
                <div className="report-card shipped">
                  <div className="report-card-title">Shipped</div>
                  <div className="report-card-value">{reportData.statusCounts.SHIPPED}</div>
                </div>
                <div className="report-card delivered">
                  <div className="report-card-title">Delivered</div>
                  <div className="report-card-value">{reportData.statusCounts.DELIVERED}</div>
                </div>
                <div className="report-card cancelled">
                  <div className="report-card-title">Cancelled</div>
                  <div className="report-card-value">{reportData.statusCounts.CANCELLED}</div>
                </div>
              </div>

              {/* Status Bars */}
              <div className="report-status-bars">
                <h4>Order Status Distribution</h4>
                {Object.entries(reportData.statusCounts).map(([status, count]) => {
                  const percentage = reportData.totalOrders > 0 ? (count / reportData.totalOrders) * 100 : 0;
                  return (
                    <div key={status} className="status-bar-item">
                      <div className="status-bar-label">{status}</div>
                      <div className="status-bar-container">
                        <div 
                          className="status-bar-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: getStatusColor(status)
                          }}
                        >
                          <span className="status-bar-value">{count}</span>
                        </div>
                      </div>
                      <div className="status-bar-percentage">{percentage.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Orders Table */}
              <div className="report-orders-table-wrapper">
                <h4>Order Details</h4>
                <table className="report-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map((order) => (
                      <tr key={order.orderId}>
                        <td>{order.orderNumber}</td>
                        <td>{order.customerName || '-'}</td>
                        <td>{order.customerPhone || '-'}</td>
                        <td>Rs. {(order.totalAmount || 0).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge-small ${getStatusBadgeClass(order.status)}`}>
                            {order.status || 'PENDING'}
                          </span>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="report-footer">
                <p>Report generated by Zenvora Inventory System</p>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-download" onClick={downloadPDFReport}>
                📄 Download PDF
              </button>
              <button className="btn-cancel" onClick={closeReportModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {showViewModal && selectedOrderDetails && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="view-order-content">
              <div className="order-info-section">
                <h3>Order Information</h3>
                <div className="info-row">
                  <span className="info-label">Order ID:</span>
                  <span className="info-value">{selectedOrderDetails.orderNumber}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Order Date:</span>
                  <span className="info-value">{formatDate(selectedOrderDetails.createdAt)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedOrderDetails.status)}`}>
                    {selectedOrderDetails.status}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total Amount:</span>
                  <span className="info-value total">Rs. {selectedOrderDetails.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <div className="customer-info-section">
                <h3>Customer Information</h3>
                <div className="info-row">
                  <span className="info-label">Customer Name:</span>
                  <span className="info-value">{selectedOrderDetails.customerName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{selectedOrderDetails.customerPhone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{selectedOrderDetails.customerEmail || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">City:</span>
                  <span className="info-value">{selectedOrderDetails.city}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Shipping Address:</span>
                  <span className="info-value">{selectedOrderDetails.shippingAddress}</span>
                </div>
                {selectedOrderDetails.orderNotes && (
                  <div className="info-row">
                    <span className="info-label">Order Notes:</span>
                    <span className="info-value">{selectedOrderDetails.orderNotes}</span>
                  </div>
                )}
              </div>

              <div className="order-items-section">
                <h3>Order Items</h3>
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
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
                      {selectedOrderDetails.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">Rs. {item.price?.toFixed(2)}</td>
                          <td className="text-right">Rs. {item.subtotal?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-right"><strong>Total:</strong></td>
                        <td className="text-right total">Rs. {selectedOrderDetails.totalAmount?.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="no-items">No items found for this order</div>
                )}
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-order-header">
        <div>
          <h1>Order Management</h1>
          <div className="order-stats">
            <span className="stat-badge">Total: {stats.totalOrders}</span>
            <span className="stat-badge pending">Pending: {stats.pendingOrders}</span>
            <span className="stat-badge delivered">Delivered: {stats.deliveredOrders}</span>
            <span className="stat-badge cancelled">Cancelled: {stats.cancelledOrders}</span>
            <span className="stat-badge revenue">Revenue: Rs.{stats.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="header-buttons">
          <button className="btn-report" onClick={generateReportPreview}>
            📊 Generate Report
          </button>
          <button className="btn-create" onClick={() => setShowAddModal(true)}>
            + Create New Order
          </button>
        </div>
      </div>

      {/* Report Filter Section */}
      <div className="report-filter-section">
        <div className="filter-group">
          <label>Start Date</label>
          <input 
            type="date" 
            value={reportParams.startDate} 
            onChange={(e) => setReportParams({...reportParams, startDate: e.target.value})} 
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input 
            type="date" 
            value={reportParams.endDate} 
            onChange={(e) => setReportParams({...reportParams, endDate: e.target.value})} 
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Order Status</label>
          <select 
            value={reportParams.status} 
            onChange={(e) => setReportParams({...reportParams, status: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <button className="btn-generate-preview" onClick={generateReportPreview} disabled={generatingReport}>
            {generatingReport ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="Search orders by Customer Name, Order ID, Status, Phone Number, or City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-order-table-wrapper">
        <table className="admin-order-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Order Number</th>
              <th>Customer Name</th>
              <th>Customer Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>City</th>
              <th>Notes</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr><td colSpan="12" style={{ textAlign: 'center', padding: '40px' }}>No orders found</td></tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.orderId}>
                  <td>{order.orderId}</td>
                  <td>{order.orderNumber || '-'}</td>
                  <td>{order.customerName || '-'}</td>
                  <td>{order.customerEmail || '-'}</td>
                  <td>{order.customerPhone || '-'}</td>
                  <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{order.shippingAddress || '-'}</td>
                  <td>{order.city || '-'}</td>
                  <td style={{ maxWidth: '150px', wordBreak: 'break-word' }}>{order.orderNotes || '-'}</td>
                  <td className="total-amount">Rs.{order.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <select 
                      value={order.status || 'PENDING'}
                      onChange={(e) => updateStatus(order.orderId, e.target.value)}
                      className="status-select"
                      style={{ borderColor: getStatusColor(order.status) }}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button className="btn-view" onClick={() => fetchOrderDetails(order.orderId)}>View</button>
                    <button className="btn-edit" onClick={() => {
                      setSelectedOrder(order);
                      setShowEditModal(true);
                    }}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteOrder(order.orderId)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Add New Order</h2>
            
            <div className="form-group">
              <label>Customer Name *</label>
              <input 
                type="text" 
                placeholder="Enter customer name" 
                value={newOrder.customerName} 
                onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})} 
                className="modal-input"
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="text" 
                placeholder="Enter phone number" 
                value={newOrder.customerPhone} 
                onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})} 
                className="modal-input"
              />
            </div>
            
            <div className="form-group">
              <label>Shipping Address *</label>
              <textarea 
                placeholder="Enter shipping address" 
                value={newOrder.shippingAddress} 
                onChange={(e) => setNewOrder({...newOrder, shippingAddress: e.target.value})} 
                className="modal-input"
                rows="2"
              />
            </div>
            
            <div className="form-group">
              <label>City *</label>
              <input 
                type="text" 
                placeholder="Enter city" 
                value={newOrder.city} 
                onChange={(e) => setNewOrder({...newOrder, city: e.target.value})} 
                className="modal-input"
              />
            </div>
            
            <div className="form-group">
              <label>Order Notes (Optional)</label>
              <textarea 
                placeholder="Enter any special notes" 
                value={newOrder.orderNotes} 
                onChange={(e) => setNewOrder({...newOrder, orderNotes: e.target.value})} 
                className="modal-input"
                rows="2"
              />
            </div>
            
            <div className="form-group">
              <label>Total Amount *</label>
              <input 
                type="number" 
                placeholder="Enter total amount" 
                value={newOrder.totalAmount} 
                onChange={(e) => setNewOrder({...newOrder, totalAmount: e.target.value})} 
                className="modal-input"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select 
                value={newOrder.status} 
                onChange={(e) => setNewOrder({...newOrder, status: e.target.value})}
                className="modal-input"
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div className="modal-buttons">
              <button className="btn-save" onClick={addOrder}>Save Order</button>
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }}>
            <h2>Edit Order #{selectedOrder.orderNumber}</h2>
            
            <div className="form-group">
              <label>Customer Name</label>
              <input type="text" value={selectedOrder.customerName || ''} onChange={(e) => setSelectedOrder({...selectedOrder, customerName: e.target.value})} className="modal-input" />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={selectedOrder.customerPhone || ''} onChange={(e) => setSelectedOrder({...selectedOrder, customerPhone: e.target.value})} className="modal-input" />
            </div>
            
            <div className="form-group">
              <label>Shipping Address</label>
              <textarea value={selectedOrder.shippingAddress || ''} onChange={(e) => setSelectedOrder({...selectedOrder, shippingAddress: e.target.value})} className="modal-input" rows="2" />
            </div>
            
            <div className="form-group">
              <label>City</label>
              <input type="text" value={selectedOrder.city || ''} onChange={(e) => setSelectedOrder({...selectedOrder, city: e.target.value})} className="modal-input" />
            </div>
            
            <div className="form-group">
              <label>Order Notes</label>
              <textarea value={selectedOrder.orderNotes || ''} onChange={(e) => setSelectedOrder({...selectedOrder, orderNotes: e.target.value})} className="modal-input" rows="2" />
            </div>
            
            <div className="form-group">
              <label>Total Amount</label>
              <input type="number" value={selectedOrder.totalAmount || 0} onChange={(e) => setSelectedOrder({...selectedOrder, totalAmount: parseFloat(e.target.value)})} className="modal-input" step="0.01" />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select value={selectedOrder.status || 'PENDING'} onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value})} className="modal-input">
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div className="modal-buttons">
              <button className="btn-save" onClick={updateOrder}>Save Changes</button>
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderList;