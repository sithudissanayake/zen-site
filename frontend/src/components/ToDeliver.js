import React, { useEffect, useState } from 'react';
import { getAllOrders } from '../services/api';

export default function ToDeliver({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getAllOrders();
      const ordersData = Array.isArray(response.data) ? response.data : [];
      const pendingOrders = ordersData.filter(o => {
        const status = (o.orderStatus || o.OrderStatus || o.status || '').toString().toUpperCase();
        return status === 'PENDING';
      });
      setOrders(pendingOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (onNavigate) {
      onNavigate('DeliveryHome');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading pending orders...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>To Deliver - Pending Orders</h2>
        <button 
          onClick={handleBackClick}
          style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          ← Back to Delivery
        </button>
      </div>

      {orders.length === 0 ? (
        <p>No pending orders.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Order ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.id || index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{order.id || order.orderId || '-'}</td>
                <td style={{ padding: '12px' }}>{order.customerName || order.name || '-'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: '#ffc107', borderRadius: '4px', fontSize: '12px' }}>
                    {order.orderStatus || order.status || 'PENDING'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}