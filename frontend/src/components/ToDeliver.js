import React, { useState, useEffect } from 'react';
import {
  getAllDeliveryOrders,
  createDeliveryOrder,
  deleteDeliveryOrder,
  getAllOrders,
} from '../services/api';
import './ToDeliver.css';

const EMPTY = {
  orderId:'', customerName:'', phoneNumber:'',
  deliveryLocation:'', driverId:'',
};

const FIELDS = [
  { num:1, label:'Customer Name',     name:'customerName',     ph:'Full customer name'   },
  { num:2, label:'Phone Number',      name:'phoneNumber',      ph:'07XXXXXXXX'            },
  { num:3, label:'Order ID',          name:'orderId',          ph:'e.g. 001'              },
  { num:4, label:'Delivery Location', name:'deliveryLocation', ph:'Full delivery address' },
  { num:5, label:'Driver ID',         name:'driverId',         ph:'e.g. D001'             },
];

export default function ToDeliver() {
  const [orders,            setOrders]            = useState([]);
  const [deliveryOrders,    setDeliveryOrders]    = useState([]);
  const [form,              setForm]              = useState(EMPTY);
  const [selected,          setSelected]          = useState(null);
  const [selectedOpenOrder, setSelectedOpenOrder] = useState(null);
  const [loading,           setLoading]           = useState(false);
  const [lstLoad,           setLstLoad]           = useState(true);
  const [alert,             setAlert]             = useState({ msg:'', type:'' });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLstLoad(true);
    try {
      const results = await Promise.allSettled([
        getAllDeliveryOrders(),
        getAllOrders(),
      ]);

      const deliveryResult = results[0];
      const orderResult = results[1];

      if (orderResult.status === 'fulfilled') {
        setOrders(orderResult.value.data);
      } else {
        throw new Error('Could not load main orders.');
      }

      if (deliveryResult.status === 'fulfilled') {
        setDeliveryOrders(deliveryResult.value.data);
      } else {
        setDeliveryOrders([]);
        showAlert('Could not load delivery schedule list. Showing open orders only.', 'info');
      }
    } catch {
      showAlert('Could not load orders. Is the backend running?', 'error');
    } finally { setLstLoad(false); }
  };

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg:'', type:'' }), 3500);
  };

  /* Click an existing scheduled delivery order → fill form */
  const handleSelectDelivery = (order) => {
    const orderId = String(order.orderId);
    setSelected(orderId);
    setSelectedOpenOrder(null);
    setForm({
      orderId,
      customerName:     order.customerName     || '',
      phoneNumber:      order.phoneNumber      || '',
      deliveryLocation: order.deliveryLocation || '',
      driverId:         order.driverId         || '',
    });
  };

  /* Pick an available order from the main orders list */
  const handleChooseOrder = (order) => {
    const orderId = String(order.orderId);
    setSelectedOpenOrder(orderId);
    setSelected(null);
    setForm({
      orderId,
      customerName:     order.userName || order.customerId || '',
      phoneNumber:      order.contact || '',
      deliveryLocation: order.city || '',
      driverId:         '',
    });
  };

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.orderId.trim())      { showAlert('Order ID is required.',      'error'); return false; }
    if (!form.customerName.trim()) { showAlert('Customer Name is required.', 'error'); return false; }
    return true;
  };

  /* Send / create order */
  const handleSend = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createDeliveryOrder(form);
      showAlert('📦 Delivery order created! Will be sent within a week.', 'success');
      setForm(EMPTY); setSelected(null); setSelectedOpenOrder(null);
      fetchOrders();
    } catch (err) {
      showAlert(
        err.response?.status === 409
          ? 'Order ID already exists. Use a different ID.'
          : 'Error creating order. Please try again.',
        'error'
      );
    } finally { setLoading(false); }
  };

  /* Delete an order */
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete order #${id}?`)) return;
    try {
      await deleteDeliveryOrder(id);
      showAlert(`Order #${id} deleted.`, 'success');
      if (selected === id) { setSelected(null); setForm(EMPTY); }
      fetchOrders();
    } catch {
      showAlert('Error deleting order.', 'error');
    }
  };

  const handleClear = () => { setForm(EMPTY); setSelected(null); setSelectedOpenOrder(null); };

  const availableOrders = orders.filter(order => {
    const orderId = String(order.orderId);
    const alreadyScheduled = deliveryOrders.some(item => item.orderId === orderId);
    const isDelivered = order.orderStatus?.toLowerCase() === 'delivered';
    return !alreadyScheduled && !isDelivered;
  });

  return (
    <div className="page-wrapper">
      <h1 className="page-title">To Deliver</h1>

      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>{alert.msg}</div>
      )}

      {/* ── Open orders eligible for delivery ── */}
      <div className="tdl-section-hd">
        Open Orders
        <span className="tdl-count">{availableOrders.length}</span>
      </div>

      {lstLoad ? (
        <div className="loading-state" style={{ padding:'1.5rem' }}>
          <div className="spinner"/>
        </div>
      ) : orders.length === 0 ? (
        <p style={{
          color:'var(--steel)', fontWeight:600, fontSize:'.92rem',
          marginBottom:'1.2rem', textAlign:'center'
        }}>
          No orders found in the main order list.
        </p>
      ) : availableOrders.length === 0 ? (
        <div className="empty-state" style={{ padding:'1.5rem', marginBottom:'1.8rem' }}>
          <div className="empty-icon">✅</div>
          <p>All active orders are already scheduled for delivery or marked delivered.</p>
        </div>
      ) : (
        <div className="tdl-open-orders">
          {availableOrders.map(o => (
            <div
              key={o.orderId}
              className={`tdl-order-card${selectedOpenOrder === String(o.orderId) ? ' tdl-order-card--active' : ''}`}
              onClick={() => handleChooseOrder(o)}
            >
              <div className="tdl-order-card-main">
                <span className="tdl-pill-id">#{o.orderId}</span>
                <span className="tdl-pill-name">{o.userName || o.customerId || 'Order ' + o.orderId}</span>
              </div>
              <div className="tdl-order-meta">
                {o.city || 'No location'} · {o.orderStatus || 'Status unknown'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="tdl-section-hd" style={{ marginTop:'2rem' }}>
        Scheduled Deliveries
        <span className="tdl-count">{deliveryOrders.length}</span>
      </div>

      {lstLoad ? null : deliveryOrders.length === 0 ? (
        <p style={{
          color:'var(--steel)', fontWeight:600, fontSize:'.92rem',
          marginBottom:'1.2rem', textAlign:'center'
        }}>
          No delivery orders yet. Pick an open order above to schedule delivery.
        </p>
      ) : (
        <div className="tdl-pills">
          {deliveryOrders.map(o => (
            <div
              key={o.orderId}
              className={`tdl-pill${selected === String(o.orderId) ? ' tdl-pill--active' : ''}`}
              onClick={() => handleSelectDelivery(o)}
            >
              <span className="tdl-pill-id">#{o.orderId}</span>
              <span className="tdl-pill-name">{o.customerName || 'Unknown'}</span>
              <button
                className="tdl-pill-del"
                title="Delete"
                onClick={e => handleDelete(o.orderId, e)}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Order form ── */}
      <div className="card tdl-form-card">
        <h2 className="tdl-form-title">Delivery Order Summary</h2>

        {FIELDS.map(f => (
          <div className="form-group" key={f.name}>
            <label className="form-label">
              <span className="field-num">{f.num}.</span>&nbsp;{f.label}
            </label>
            <span className="form-colon">:</span>
            <input
              className="form-input"
              type="text"
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              placeholder={f.ph}
            />
          </div>
        ))}

        <p className="tdl-note">📅 The order will be sent within a week.</p>

        <div className="tdl-btn-row">
          <button
            className="btn btn-primary"
            style={{ minWidth:150 }}
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? <><span className="btn-spinner"/>Sending…</> : '📤 Send'}
          </button>
          <button className="btn btn-secondary" onClick={handleClear}>
            ✖ Clear
          </button>
        </div>
      </div>
    </div>
  );
}