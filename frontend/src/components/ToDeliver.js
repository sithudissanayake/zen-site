import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllDeliveryOrders, createDeliveryOrder, updateDeliveryOrder,
  updateDeliveryOrderStatus, deleteDeliveryOrder,
  getAllOrders, getAllDrivers,
} from '../services/api';
import './ToDeliver.css';

const STATUSES  = ['PENDING','SCHEDULED','IN_TRANSIT','DELIVERED','CANCELLED'];
const PRIORITIES = ['LOW','NORMAL','HIGH','URGENT'];
const S_COLOR = { PENDING:'#f59e0b', SCHEDULED:'#6366f1', IN_TRANSIT:'#3b82f6', DELIVERED:'#10b981', CANCELLED:'#ef4444' };
const P_COLOR = { LOW:'#94a3b8', NORMAL:'#6366f1', HIGH:'#f59e0b', URGENT:'#ef4444' };
const EMPTY = { orderId:'', customerName:'', customerPhone:'', deliveryAddress:'', city:'', driverId:'', driverName:'', deliveryDate:'', estimatedTime:'', priority:'NORMAL', notes:'' };

export default function ToDeliver() {
  const [delivOrders, setDelivOrders] = useState([]);
  const [openOrders,  setOpenOrders]  = useState([]);
  const [drivers,     setDrivers]     = useState([]);
  const [form,        setForm]        = useState(EMPTY);
  const [editId,      setEditId]      = useState(null);  // delivery record id
  const [selOrder,    setSelOrder]    = useState(null);  // orderId of selected open order
  const [loading,     setLoading]     = useState(false);
  const [lstLoad,     setLstLoad]     = useState(true);
  const [alert,       setAlert]       = useState({ msg:'', type:'' });
  const [filterSt,    setFilterSt]    = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [showForm,    setShowForm]    = useState(false);

  const fetchAll = useCallback(async () => {
    setLstLoad(true);
    try {
      const [dRes, oRes, drRes] = await Promise.allSettled([
        getAllDeliveryOrders(), getAllOrders(), getAllDrivers(),
      ]);
      const delivs  = dRes.status  === 'fulfilled' ? dRes.value.data  : [];
      const orders  = oRes.status  === 'fulfilled' ? oRes.value.data  : [];
      const drvList = drRes.status === 'fulfilled' ? drRes.value.data : [];
      setDelivOrders(delivs);
      setDrivers(drvList);
      // Open orders = not yet in delivery list and not delivered
      const scheduledIds = new Set(delivs.map(d => String(d.orderId)));
      setOpenOrders(orders.filter(o => !scheduledIds.has(String(o.orderId)) &&
        (o.status||'').toUpperCase() !== 'DELIVERED'));
    } catch { showAlert('Cannot connect to backend.','error'); }
    finally { setLstLoad(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg:'', type:'' }), 4000);
  };

  const selectOpen = (order) => {
    setSelOrder(String(order.orderId));
    setEditId(null);
    setShowForm(true);
    setForm({ ...EMPTY,
      orderId:         String(order.orderId),
      customerName:    order.customerName || order.userName || '',
      customerPhone:   order.customerPhone || order.contact || '',
      deliveryAddress: order.shippingAddress || '',
      city:            order.city || '',
    });
    setTimeout(() => document.getElementById('tdl-form')?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
  };

  const selectScheduled = (rec) => {
    setEditId(rec.id);
    setSelOrder(null);
    setShowForm(true);
    setForm({
      orderId:         String(rec.orderId),
      customerName:    rec.customerName || '',
      customerPhone:   rec.customerPhone || '',
      deliveryAddress: rec.deliveryAddress || rec.address || '',
      city:            rec.city || '',
      driverId:        rec.driverId || '',
      driverName:      rec.driverName || '',
      deliveryDate:    rec.deliveryDate || '',
      estimatedTime:   rec.estimatedTime || '',
      priority:        rec.priority || 'NORMAL',
      notes:           rec.notes || '',
    });
    setTimeout(() => document.getElementById('tdl-form')?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
  };

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDriverSelect = e => {
    const id = e.target.value;
    const drv = drivers.find(d => d.driverId === id);
    setForm(prev => ({ ...prev, driverId: id, driverName: drv?.driverName || '' }));
  };

  const validate = () => {
    if (!form.orderId.trim())      { showAlert('Order ID is required.','error'); return false; }
    if (!form.customerName.trim()) { showAlert('Customer Name is required.','error'); return false; }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createDeliveryOrder({ ...form, status:'SCHEDULED' });
      showAlert('✅ Delivery order scheduled successfully!','success');
      clearForm(); fetchAll();
    } catch (err) {
      showAlert(err.response?.status===409 ? 'Order already scheduled.' : 'Error creating delivery.','error');
    } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!validate() || !editId) return;
    setLoading(true);
    try {
      await updateDeliveryOrder(editId, form);
      showAlert('✅ Delivery order updated!','success');
      clearForm(); fetchAll();
    } catch { showAlert('Error updating order.','error'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (rec, newStatus) => {
    try {
      await updateDeliveryOrderStatus(rec.id, newStatus);
      fetchAll();
    } catch { showAlert('Could not update status.','error'); }
  };

  const handleDelete = async (rec, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete delivery for Order #${rec.orderId}?`)) return;
    try {
      await deleteDeliveryOrder(rec.id);
      showAlert('Deleted.','success');
      if (editId === rec.id) clearForm();
      fetchAll();
    } catch { showAlert('Error deleting.','error'); }
  };

  const clearForm = () => { setForm(EMPTY); setEditId(null); setSelOrder(null); setShowForm(false); };

  const filtered = delivOrders.filter(d => {
    const q = search.toLowerCase();
    const matchS = filterSt === 'ALL' || (d.status||'').toUpperCase() === filterSt;
    const matchQ = !q || String(d.orderId).toLowerCase().includes(q)
      || (d.customerName||'').toLowerCase().includes(q)
      || (d.driverId||'').toLowerCase().includes(q);
    return matchS && matchQ;
  });

  const sc = (s='') => S_COLOR[(s||'').toUpperCase().replace(/ /g,'_')] || '#6b7280';
  const pc = (p='') => P_COLOR[(p||'').toUpperCase()] || '#6366f1';

  return (
    <div className="page-wrapper">
      <h1 className="page-title">📦 Delivery Schedule</h1>
      {alert.msg && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* Open Orders */}
      <div className="tdl-sec-hd">
        Available Orders for Delivery
        <span className="tdl-badge">{openOrders.length}</span>
      </div>
      {lstLoad ? <div className="loading-state"><div className="spinner"/></div>
        : openOrders.length === 0
          ? <p className="tdl-empty">✅ All active orders are already scheduled or delivered.</p>
          : <div className="tdl-open-grid">
              {openOrders.map(o => (
                <div key={o.orderId}
                  className={`tdl-open-card${selOrder===String(o.orderId)?' tdl-open-card--sel':''}`}
                  onClick={() => selectOpen(o)}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:800, color:'#6366f1', fontSize:13 }}>#{o.orderId}</span>
                    <span style={{ fontWeight:700 }}>{o.customerName||o.userName||'Order '+o.orderId}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>
                    📍 {o.city||o.shippingAddress||'No location'} &nbsp;·&nbsp;
                    <span style={{ color:sc(o.status), fontWeight:700 }}>{o.status||'PENDING'}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#6366f1', fontWeight:700, marginTop:3 }}>Click to schedule →</div>
                </div>
              ))}
            </div>}

      {/* Scheduled Deliveries */}
      <div className="tdl-sec-hd" style={{ marginTop:'2rem' }}>
        Scheduled Deliveries
        <span className="tdl-badge">{filtered.length}</span>
        <button className="tdl-refresh" onClick={fetchAll} type="button">🔄</button>
      </div>

      {/* Filter bar */}
      <div className="tdl-filter-bar">
        <input className="tdl-search" placeholder="🔍 Search order ID, customer, driver…"
          value={search} onChange={e => setSearch(e.target.value)}/>
        <div className="tdl-filter-btns">
          {['ALL',...STATUSES].map(s => (
            <button key={s} type="button"
              className={`tdl-fb${filterSt===s?' tdl-fb--on':''}`}
              style={filterSt===s&&s!=='ALL'?{background:sc(s),color:'#fff',borderColor:sc(s)}:{}}
              onClick={() => setFilterSt(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Scheduled grid */}
      {lstLoad ? null : filtered.length === 0
        ? <p className="tdl-empty">{delivOrders.length===0 ? 'No deliveries scheduled yet.' : 'No results.'}</p>
        : <div className="tdl-sched-grid">
            {filtered.map(d => (
              <div key={d.id} className={`tdl-scard${editId===d.id?' tdl-scard--sel':''}`} onClick={() => selectScheduled(d)}>
                <div className="tdl-scard-top">
                  <span style={{ fontWeight:800, color:'#6366f1', fontSize:12 }}>#{d.orderId}</span>
                  <span style={{ background:sc(d.status)+'22', color:sc(d.status), fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, textTransform:'uppercase' }}>
                    {d.status||'—'}</span>
                </div>
                <div style={{ fontWeight:700, fontSize:14, margin:'3px 0' }}>{d.customerName||'Unknown'}</div>
                <div style={{ fontSize:11, color:'#64748b', display:'flex', flexDirection:'column', gap:2 }}>
                  <span>📍 {d.deliveryAddress||d.city||'—'}</span>
                  <span>🧑‍✈️ {d.driverName||d.driverId||'No driver'}</span>
                  {d.deliveryDate && <span>📅 {d.deliveryDate}</span>}
                  {d.priority && d.priority!=='NORMAL' && (
                    <span style={{ color:pc(d.priority), fontWeight:700 }}>⚡ {d.priority}</span>
                  )}
                </div>
                {/* Quick status */}
                <div className="tdl-scard-foot" onClick={e => e.stopPropagation()}>
                  <select className="tdl-qs" value={d.status||'SCHEDULED'}
                    style={{ borderColor:sc(d.status), color:sc(d.status) }}
                    onChange={e => handleStatusChange(d, e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="tdl-del-btn" onClick={e => handleDelete(d, e)} type="button">🗑️</button>
                </div>
              </div>
            ))}
          </div>}

      {/* Form */}
      {showForm && (
        <div id="tdl-form" className="card tdl-form-card">
          <h2 className="tdl-form-title">
            {editId ? '✏️ Edit Delivery Order' : '📋 Schedule New Delivery'}
          </h2>
          <div className="tdl-form-grid">
            <div className="form-group">
              <label className="form-label"><span className="field-num">1.</span> Order ID</label>
              <span className="form-colon">:</span>
              <input className="form-input" name="orderId" value={form.orderId} onChange={handleChange}
                placeholder="e.g. 1001" readOnly={!!editId}/>
            </div>
            <div className="form-group">
              <label className="form-label"><span className="field-num">2.</span> Customer Name</label>
              <span className="form-colon">:</span>
              <input className="form-input" name="customerName" value={form.customerName} onChange={handleChange} placeholder="Full name"/>
            </div>
            <div className="form-group">
              <label className="form-label"><span className="field-num">3.</span> Phone</label>
              <span className="form-colon">:</span>
              <input className="form-input" name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="07XXXXXXXX"/>
            </div>
            <div className="form-group">
              <label className="form-label"><span className="field-num">4.</span> Delivery Address</label>
              <span className="form-colon">:</span>
              <input className="form-input" name="deliveryAddress" value={form.deliveryAddress} onChange={handleChange} placeholder="Full address"/>
            </div>
            <div className="form-group">
              <label className="form-label"><span className="field-num">5.</span> City</label>
              <span className="form-colon">:</span>
              <input className="form-input" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Colombo"/>
            </div>
            <div className="form-group">
              <label className="form-label"><span className="field-num">6.</span> Assign Driver</label>
              <span className="form-colon">:</span>
              {drivers.length > 0
                ? <select className="form-input" value={form.driverId} onChange={handleDriverSelect}>
                    <option value="">— Select Driver —</option>
                    {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.driverName} ({d.driverId})</option>)}
                  </select>
                : <input className="form-input" name="driverId" value={form.driverId} onChange={handleChange} placeholder="e.g. D001"/>
              }
            </div>
            <div className="form-group">
              <label className="form-label"><span className="field-num">7.</span> Delivery Date</label>
              <span className="form-colon">:</span>
              <input className="form-input" type="date" name="deliveryDate" value={form.deliveryDate}
                onChange={handleChange} min={new Date().toISOString().split('T')[0]}/>
            </div>
            <div className="form-group">
              <label className="form-label"><span className="field-num">8.</span> Priority</label>
              <span className="form-colon">:</span>
              <select className="form-input" name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group tdl-full">
              <label className="form-label"><span className="field-num">9.</span> Notes</label>
              <span className="form-colon">:</span>
              <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange}
                placeholder="Special instructions, fragile items…" rows={2}/>
            </div>
          </div>
          <p className="tdl-note">📅 Orders are typically dispatched within one business week.</p>
          <div className="tdl-btn-row">
            {editId
              ? <button className="btn btn-primary" onClick={handleUpdate} disabled={loading} type="button">
                  {loading ? <><span className="btn-spinner"/>Saving…</> : '💾 Update'}
                </button>
              : <button className="btn btn-primary" onClick={handleCreate} disabled={loading} type="button">
                  {loading ? <><span className="btn-spinner"/>Scheduling…</> : '📤 Schedule Delivery'}
                </button>}
            <button className="btn btn-secondary" onClick={clearForm} type="button">✖ Clear</button>
          </div>
        </div>
      )}

      {!showForm && (
        <div style={{ textAlign:'center', margin:'1.5rem 0' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} type="button">➕ New Delivery Order</button>
        </div>
      )}
    </div>
  );
}