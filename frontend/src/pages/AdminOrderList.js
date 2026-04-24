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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Download PDF Report — renders the styled report in a print window
  const downloadPDFReport = () => {
    if (!reportData) return;

    const STATUS_COLORS = {
      PENDING:    { bg: '#fef3c7', text: '#92400e' },
      PROCESSING: { bg: '#dbeafe', text: '#1e40af' },
      SHIPPED:    { bg: '#ede9fe', text: '#5b21b6' },
      DELIVERED:  { bg: '#d1fae5', text: '#065f46' },
      CANCELLED:  { bg: '#fee2e2', text: '#991b1b' },
    };

    const BAR_COLORS = {
      PENDING: '#f59e0b', PROCESSING: '#3b82f6',
      SHIPPED: '#8b5cf6', DELIVERED: '#10b981', CANCELLED: '#ef4444',
    };

    // Build donut SVG
    const entries = Object.entries(reportData.statusCounts).filter(([, v]) => v > 0);
    const total = reportData.totalOrders;
    let cumAngle = -Math.PI / 2;
    const cx = 90, cy = 90, R = 70, r = 42;
    const slicePaths = entries.map(([status, count]) => {
      const angle = (count / total) * 2 * Math.PI;
      const x1 = cx + R * Math.cos(cumAngle), y1 = cy + R * Math.sin(cumAngle);
      cumAngle += angle;
      const x2 = cx + R * Math.cos(cumAngle), y2 = cy + R * Math.sin(cumAngle);
      const ix1 = cx + r * Math.cos(cumAngle - angle), iy1 = cy + r * Math.sin(cumAngle - angle);
      const ix2 = cx + r * Math.cos(cumAngle), iy2 = cy + r * Math.sin(cumAngle);
      const large = angle > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
      return `<path d="${d}" fill="${BAR_COLORS[status] || '#94a3b8'}" stroke="white" stroke-width="2"/>`;
    }).join('');

    const donutSVG = total > 0 ? `
      <svg width="180" height="180" viewBox="0 0 180 180">
        ${slicePaths}
        <text x="90" y="85" text-anchor="middle" font-size="22" font-weight="800" fill="#1e293b" font-family="Georgia,serif">${total}</text>
        <text x="90" y="101" text-anchor="middle" font-size="9.5" fill="#94a3b8" font-family="sans-serif" letter-spacing="1">ORDERS</text>
      </svg>` : `<p style="color:#94a3b8;padding:20px;font-size:13px">No data</p>`;

    const legendRows = entries.map(([status, count]) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <div style="width:11px;height:11px;border-radius:3px;background:${BAR_COLORS[status]};flex-shrink:0"></div>
        <span style="font-size:11px;color:#475569;font-weight:600;flex:1">${status}</span>
        <span style="font-size:12px;color:#1e293b;font-weight:800">${((count/total)*100).toFixed(0)}%</span>
      </div>`).join('');

    const barRows = Object.entries(reportData.statusCounts).map(([status, count]) => {
      const pct = total > 0 ? (count / total) * 100 : 0;
      return `
        <div style="margin-bottom:11px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:11px;font-weight:700;color:#475569">${status}</span>
            <span style="font-size:11px;font-weight:800;color:#1e293b">${count} <span style="color:#94a3b8;font-weight:500">(${pct.toFixed(1)}%)</span></span>
          </div>
          <div style="height:11px;background:#e2e8f0;border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${BAR_COLORS[status]};border-radius:99px;min-width:${count>0?'6px':'0'}"></div>
          </div>
        </div>`;
    }).join('');

    const tableRows = reportData.orders.map((order, idx) => {
      const sc = STATUS_COLORS[order.status] || { bg:'#f3f4f6', text:'#374151' };
      return `
        <tr style="background:${idx%2===0?'#fff':'#f8fafc'};border-bottom:1px solid #f1f5f9">
          <td style="padding:9px 13px;font-weight:700;color:#1e293b;font-size:12px">${order.orderNumber || '-'}</td>
          <td style="padding:9px 13px;color:#374151;font-size:12px">${order.customerName || '-'}</td>
          <td style="padding:9px 13px;color:#374151;font-size:12px">${order.customerPhone || '-'}</td>
          <td style="padding:9px 13px;font-weight:700;color:#065f46;font-size:12px">Rs. ${(order.totalAmount||0).toFixed(2)}</td>
          <td style="padding:9px 13px">
            <span style="background:${sc.bg};color:${sc.text};padding:3px 9px;border-radius:99px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px">
              ${order.status || 'PENDING'}
            </span>
          </td>
          <td style="padding:9px 13px;color:#6b7280;font-size:11px">${formatDate(order.createdAt)}</td>
        </tr>`;
    }).join('');

    const kpiCards = [
      { label:'Total Orders',  value: reportData.totalOrders,                         color:'#1e3a5f', bg:'#eef2ff', icon:'📦' },
      { label:'Total Revenue', value:`Rs. ${reportData.totalRevenue.toFixed(2)}`,      color:'#065f46', bg:'#ecfdf5', icon:'💰' },
      { label:'Pending',       value: reportData.statusCounts.PENDING,                 color:'#92400e', bg:'#fffbeb', icon:'⏳' },
      { label:'Processing',    value: reportData.statusCounts.PROCESSING,              color:'#1e40af', bg:'#eff6ff', icon:'⚙️' },
      { label:'Shipped',       value: reportData.statusCounts.SHIPPED,                 color:'#5b21b6', bg:'#f5f3ff', icon:'🚚' },
      { label:'Delivered',     value: reportData.statusCounts.DELIVERED,               color:'#065f46', bg:'#d1fae5', icon:'✅' },
      { label:'Cancelled',     value: reportData.statusCounts.CANCELLED,               color:'#991b1b', bg:'#fef2f2', icon:'❌' },
    ].map(({ label, value, color, bg, icon }) => `
      <div style="background:${bg};border-radius:12px;padding:14px 10px;text-align:center;flex:1;min-width:90px">
        <div style="font-size:18px;margin-bottom:5px">${icon}</div>
        <div style="font-size:17px;font-weight:800;color:${color};font-family:Georgia,serif;line-height:1">${value}</div>
        <div style="font-size:9px;color:#6b7280;margin-top:5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px">${label}</div>
      </div>`).join('');

    // Get logo as base64 if possible, fall back to text
    const logoHTML = `<img src="./zen.jpg" alt="Logo" style="width:58px;height:58px;object-fit:contain;border-radius:10px;border:2px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.09)" onerror="this.style.display='none'"/>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Zenvora Order Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui,-apple-system,sans-serif; background:#fff; color:#1e293b; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display:none !important; }
      @page { margin: 0.5cm; size: A4; }
    }
    .print-btn {
      position:fixed; top:16px; right:16px; z-index:999;
      background:linear-gradient(135deg,#1e3a5f,#1a5276);
      color:#fff; border:none; padding:10px 22px; border-radius:8px;
      font-size:14px; font-weight:700; cursor:pointer;
      box-shadow:0 4px 14px rgba(30,58,95,0.4);
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Save as PDF</button>

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1a5276 100%);padding:28px 36px 22px;position:relative;overflow:hidden">
    <div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>
    <div style="position:absolute;bottom:-60px;right:80px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,0.03)"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1">
      <div style="display:flex;align-items:center;gap:16px">
        ${logoHTML}
        <div>
          <div style="font-size:20px;font-weight:800;color:#fff;font-family:Georgia,serif">Zenvora Trading &amp; Industries</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.55);letter-spacing:2.5px;text-transform:uppercase;margin-top:4px">Order Management Report</div>
        </div>
      </div>
      <div style="text-align:right;color:rgba(255,255,255,0.6);font-size:11px;line-height:1.8">
        <div>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</div>
        <div>Period: ${reportData.startDate || 'All time'}${reportData.endDate ? ' → ' + reportData.endDate : ''}</div>
        <div>Filter: ${reportData.status === 'ALL' ? 'All Statuses' : reportData.status}</div>
      </div>
    </div>
  </div>

  <div style="padding:28px 36px">

    <!-- KPI Cards -->
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:26px">
      ${kpiCards}
    </div>

    <!-- Charts -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:26px">

      <!-- Bar Chart -->
      <div style="background:#f8fafc;border-radius:14px;padding:20px 22px;border:1px solid #e2e8f0">
        <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px">Orders by Status — Bar Chart</div>
        ${barRows}
      </div>

      <!-- Donut Chart -->
      <div style="background:#f8fafc;border-radius:14px;padding:20px 22px;border:1px solid #e2e8f0">
        <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px">Distribution Overview — Donut Chart</div>
        <div style="display:flex;align-items:center;gap:18px">
          ${donutSVG}
          <div style="flex:1">${legendRows}</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div style="border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:22px">
      <div style="background:linear-gradient(90deg,#0f172a,#1e3a5f);padding:12px 18px">
        <span style="color:#fff;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Order Details</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f1f5f9">
            ${['Order ID','Customer','Phone','Total (Rs.)','Status','Date'].map(h =>
              `<th style="padding:9px 13px;text-align:left;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e2e8f0">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows || `<tr><td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;font-size:13px">No orders</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid #e2e8f0">
      <div style="font-size:10px;color:#94a3b8">© ${new Date().getFullYear()} Zenvora Trading &amp; Industries · All Rights Reserved · Confidential</div>
      <div style="font-size:10px;color:#94a3b8">Total Orders: ${reportData.totalOrders} &nbsp;|&nbsp; Total Revenue: Rs. ${reportData.totalRevenue.toFixed(2)}</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1000,height=800');
    win.document.write(html);
    win.document.close();
    win.focus();
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

  // ── Donut chart helper ──────────────────────────────────────────────────────
  const DonutChart = ({ statusCounts, total }) => {
    const STATUS_COLORS = {
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      SHIPPED: '#8b5cf6',
      DELIVERED: '#10b981',
      CANCELLED: '#ef4444',
    };
    const entries = Object.entries(statusCounts).filter(([, v]) => v > 0);
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '40px', fontSize: '13px' }}>
          No data available
        </div>
      );
    }
    const cx = 90, cy = 90, R = 70, r = 42;
    let cumAngle = -Math.PI / 2;
    const slices = entries.map(([status, count]) => {
      const angle = (count / total) * 2 * Math.PI;
      const x1 = cx + R * Math.cos(cumAngle);
      const y1 = cy + R * Math.sin(cumAngle);
      cumAngle += angle;
      const x2 = cx + R * Math.cos(cumAngle);
      const y2 = cy + R * Math.sin(cumAngle);
      const ix1 = cx + r * Math.cos(cumAngle - angle);
      const iy1 = cy + r * Math.sin(cumAngle - angle);
      const ix2 = cx + r * Math.cos(cumAngle);
      const iy2 = cy + r * Math.sin(cumAngle);
      const large = angle > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
      return { d, color: STATUS_COLORS[status] || '#94a3b8', status, count };
    });
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
          {slices.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} stroke="#fff" strokeWidth="2.5" />
          ))}
          <text x="90" y="85" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e293b" fontFamily="Georgia, serif">
            {total}
          </text>
          <text x="90" y="101" textAnchor="middle" fontSize="9.5" fill="#94a3b8" fontFamily="sans-serif" letterSpacing="1">
            ORDERS
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {slices.map(s => (
            <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '11px', height: '11px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600', flex: 1 }}>{s.status}</span>
              <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '800' }}>
                {((s.count / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="admin-loading">Loading orders...</div>;

  return (
    <div className="admin-order-container">

      {/* ── PREMIUM REPORT MODAL ─────────────────────────────────────────────── */}
      {showReportModal && reportData && (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{
            maxWidth: '920px',
            width: '95%',
            maxHeight: '95vh',
            overflowY: 'auto',
            borderRadius: '18px',
            background: '#ffffff',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            padding: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>

            {/* ── Branded header ── */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1a5276 100%)',
              padding: '30px 38px 22px',
              borderRadius: '18px 18px 0 0',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* decorative blobs */}
              <div style={{ position:'absolute', top:'-50px', right:'-50px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
              <div style={{ position:'absolute', bottom:'-70px', right:'80px', width:'260px', height:'260px', borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
                  <img
                    src="./zen.jpg"
                    alt="Zenvora Logo"
                    style={{ width:'62px', height:'62px', objectFit:'contain', borderRadius:'10px', border:'2px solid rgba(255,255,255,0.22)', background:'rgba(255,255,255,0.09)' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <div style={{ fontSize:'21px', fontWeight:'800', color:'#ffffff', letterSpacing:'0.3px', fontFamily:'Georgia, "Times New Roman", serif' }}>
                      Zenvora Trading &amp; Industries
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', letterSpacing:'2.5px', textTransform:'uppercase', marginTop:'4px' }}>
                      Order Management Report
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeReportModal}
                  style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:'34px', height:'34px', borderRadius:'8px', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                >×</button>
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', gap:'20px', marginTop:'18px', position:'relative', zIndex:1 }}>
                {[
                  ['Generated', new Date(reportData.generatedAt).toLocaleString()],
                  ['Period', `${reportData.startDate || 'All time'}${reportData.endDate ? ' → ' + reportData.endDate : ''}`],
                  ['Filter', reportData.status === 'ALL' ? 'All Statuses' : reportData.status],
                ].map(([label, val]) => (
                  <div key={label} style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>
                    <span style={{ color:'rgba(255,255,255,0.4)', marginRight:'5px' }}>{label}:</span>{val}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '32px 38px' }}>

              {/* KPI cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(118px, 1fr))', gap:'12px', marginBottom:'30px' }}>
                {[
                  { label:'Total Orders',  value: reportData.totalOrders,                        color:'#1e3a5f', bg:'#eef2ff', icon:'📦' },
                  { label:'Total Revenue', value:`Rs.\u00a0${reportData.totalRevenue.toFixed(2)}`, color:'#065f46', bg:'#ecfdf5', icon:'💰' },
                  { label:'Pending',       value: reportData.statusCounts.PENDING,                color:'#92400e', bg:'#fffbeb', icon:'⏳' },
                  { label:'Processing',    value: reportData.statusCounts.PROCESSING,             color:'#1e40af', bg:'#eff6ff', icon:'⚙️' },
                  { label:'Shipped',       value: reportData.statusCounts.SHIPPED,                color:'#5b21b6', bg:'#f5f3ff', icon:'🚚' },
                  { label:'Delivered',     value: reportData.statusCounts.DELIVERED,              color:'#065f46', bg:'#d1fae5', icon:'✅' },
                  { label:'Cancelled',     value: reportData.statusCounts.CANCELLED,              color:'#991b1b', bg:'#fef2f2', icon:'❌' },
                ].map(({ label, value, color, bg, icon }) => (
                  <div key={label} style={{ background: bg, borderRadius:'12px', padding:'14px 12px', textAlign:'center', border:`1px solid ${bg}` }}>
                    <div style={{ fontSize:'20px', marginBottom:'5px' }}>{icon}</div>
                    <div style={{ fontSize:'18px', fontWeight:'800', color, fontFamily:'Georgia, serif', lineHeight:1 }}>{value}</div>
                    <div style={{ fontSize:'10px', color:'#6b7280', marginTop:'5px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'30px' }}>

                {/* Bar Chart */}
                <div style={{ background:'#f8fafc', borderRadius:'14px', padding:'22px 24px', border:'1px solid #e2e8f0' }}>
                  <div style={{ fontSize:'11px', fontWeight:'800', color:'#64748b', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'18px' }}>
                    Orders by Status — Bar Chart
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'11px' }}>
                    {Object.entries(reportData.statusCounts).map(([status, count]) => {
                      const pct = reportData.totalOrders > 0 ? (count / reportData.totalOrders) * 100 : 0;
                      const color = getStatusColor(status);
                      return (
                        <div key={status}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                            <span style={{ fontSize:'11px', fontWeight:'700', color:'#475569' }}>{status}</span>
                            <span style={{ fontSize:'11px', fontWeight:'800', color:'#1e293b' }}>
                              {count}
                              <span style={{ color:'#94a3b8', fontWeight:'500', marginLeft:'4px' }}>({pct.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div style={{ height:'11px', background:'#e2e8f0', borderRadius:'99px', overflow:'hidden' }}>
                            <div style={{
                              height:'100%',
                              width:`${pct}%`,
                              background:`linear-gradient(90deg, ${color}, ${color}cc)`,
                              borderRadius:'99px',
                              minWidth: count > 0 ? '6px' : '0',
                              transition:'width 0.6s cubic-bezier(.4,0,.2,1)'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Donut Chart */}
                <div style={{ background:'#f8fafc', borderRadius:'14px', padding:'22px 24px', border:'1px solid #e2e8f0' }}>
                  <div style={{ fontSize:'11px', fontWeight:'800', color:'#64748b', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'18px' }}>
                    Distribution Overview — Donut Chart
                  </div>
                  <DonutChart statusCounts={reportData.statusCounts} total={reportData.totalOrders} />
                </div>
              </div>

              {/* Orders table */}
              <div style={{ borderRadius:'14px', overflow:'hidden', border:'1px solid #e2e8f0', marginBottom:'24px' }}>
                <div style={{ background:'linear-gradient(90deg, #0f172a, #1e3a5f)', padding:'13px 20px' }}>
                  <span style={{ color:'#fff', fontWeight:'700', fontSize:'12px', textTransform:'uppercase', letterSpacing:'1.5px' }}>
                    Order Details
                  </span>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                    <thead>
                      <tr style={{ background:'#f1f5f9' }}>
                        {['Order ID','Customer','Phone','Total (Rs.)','Status','Date'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'10px', fontWeight:'800', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #e2e8f0' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign:'center', padding:'36px', color:'#94a3b8', fontSize:'13px' }}>
                            No orders match the selected filters
                          </td>
                        </tr>
                      ) : (
                        reportData.orders.map((order, idx) => {
                          const statusBg  = { PENDING:'#fef3c7', PROCESSING:'#dbeafe', SHIPPED:'#ede9fe', DELIVERED:'#d1fae5', CANCELLED:'#fee2e2' };
                          const statusTxt = { PENDING:'#92400e', PROCESSING:'#1e40af', SHIPPED:'#5b21b6', DELIVERED:'#065f46', CANCELLED:'#991b1b' };
                          return (
                            <tr key={order.orderId} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                              <td style={{ padding:'10px 14px', fontWeight:'700', color:'#1e293b' }}>{order.orderNumber}</td>
                              <td style={{ padding:'10px 14px', color:'#374151' }}>{order.customerName || '—'}</td>
                              <td style={{ padding:'10px 14px', color:'#374151' }}>{order.customerPhone || '—'}</td>
                              <td style={{ padding:'10px 14px', fontWeight:'700', color:'#065f46' }}>{(order.totalAmount || 0).toFixed(2)}</td>
                              <td style={{ padding:'10px 14px' }}>
                                <span style={{
                                  background: statusBg[order.status] || '#f3f4f6',
                                  color: statusTxt[order.status] || '#374151',
                                  padding:'3px 10px', borderRadius:'99px',
                                  fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.6px'
                                }}>
                                  {order.status || 'PENDING'}
                                </span>
                              </td>
                              <td style={{ padding:'10px 14px', color:'#6b7280', fontSize:'12px' }}>{formatDate(order.createdAt)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'20px', borderTop:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'11px', color:'#94a3b8' }}>
                  © {new Date().getFullYear()} Zenvora Trading &amp; Industries · All Rights Reserved · Confidential
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <button
                    onClick={downloadPDFReport}
                    style={{ background:'linear-gradient(135deg,#1e3a5f,#1a5276)', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 22px', fontWeight:'700', fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 4px 14px rgba(30,58,95,0.35)' }}
                  >
                    📄 Download PDF
                  </button>
                  <button
                    onClick={closeReportModal}
                    style={{ background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'10px 22px', fontWeight:'600', fontSize:'13px', cursor:'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>

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