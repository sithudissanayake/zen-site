
import React, { useEffect, useState } from 'react';
import { getAllDrivers, getAllOrders, getAllDeliveryOrders } from '../services/api';
import './DeliveryHome.css';

const STATUS_COLOR = {
  PENDING: '#f59e0b', SCHEDULED: '#6366f1', IN_TRANSIT: '#3b82f6',
  DELIVERED: '#10b981', CANCELLED: '#ef4444',
};

export default function DeliveryHome({ onNavigate }) {
  const [stats, setStats]     = useState({ drivers:0, orders:0, pending:0, inTransit:0, delivered:0, scheduled:0 });
  const [recent, setRecent]   = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getAllDrivers(), getAllOrders(), getAllDeliveryOrders()])
      .then(([dr, or, dlr]) => {
        const drivers  = dr.status  === 'fulfilled' ? dr.value.data  : [];
        const orders   = or.status  === 'fulfilled' ? or.value.data  : [];
        const delivs   = dlr.status === 'fulfilled' ? dlr.value.data : [];
        const pending  = orders.filter(o => (o.status||'').toUpperCase() === 'PENDING').length;
        const dlvd     = delivs.filter(d => (d.status||'').toUpperCase() === 'DELIVERED').length;
        const transit  = delivs.filter(d => (d.status||'').toUpperCase() === 'IN_TRANSIT').length;
        const sched    = delivs.filter(d => (d.status||'').toUpperCase() === 'SCHEDULED').length;
        setStats({ drivers: drivers.length, orders: orders.length, pending, inTransit: transit, delivered: dlvd, scheduled: sched });

        const sorted = [...delivs].sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
        setRecent(sorted.slice(0,5));

        const map = {};
        delivs.forEach(d => { const k = d.driverId||'Unknown'; map[k] = (map[k]||0)+1; });
        const lb = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([id,cnt]) => {
          const drv = drivers.find(d => d.driverId === id);
          return { id, name: drv?.driverName || id, count: cnt };
        });
        setLeaders(lb);
      })
      .finally(() => setLoading(false));
  }, []);

  const chip = (s='') => {
    const c = STATUS_COLOR[(s||'').toUpperCase().replace(/ /g,'_')] || '#6b7280';
    return <span style={{ background:c+'22', color:c, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>{s||'—'}</span>;
  };

  return (
    <div className="dh-page">
      {/* Hero */}
      <div className="dh-hero">
        <div className="dh-hero-shade"/>
        <div className="dh-hero-body">
          <h1 className="dh-hero-title">🚚 Delivery Management</h1>
          <p className="dh-hero-sub">Fast · Safe · Always On Schedule</p>
        </div>
        <div className="dh-kpi-bar">
          {[
            { icon:'🧑‍✈️', label:'Drivers',    val: stats.drivers   },
            { icon:'📦',   label:'Orders',     val: stats.orders    },
            { icon:'⏳',   label:'Pending',    val: stats.pending   },
            { icon:'🚛',   label:'In Transit', val: stats.inTransit },
            { icon:'✅',   label:'Delivered',  val: stats.delivered },
          ].map(k => (
            <div className="dh-kpi" key={k.label}>
              <span className="dh-kpi-i">{k.icon}</span>
              <span className="dh-kpi-v">{loading ? '…' : k.val}</span>
              <span className="dh-kpi-l">{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="dh-wrap">
        <h2 className="dh-sec">⚡ Quick Actions</h2>
        <div className="dh-actions">
          {[
            { icon:'📋', label:'Schedule Delivery', sub:'Assign orders to drivers',  view:'ToDeliver',     color:'#6366f1' },
            { icon:'🚗', label:'Manage Drivers',    sub:'Add · Edit · Remove',        view:'ManageDrivers', color:'#3b82f6' },
            { icon:'📊', label:'Monthly Report',    sub:'Charts & performance data', view:'MonthlyReport',color:'#10b981' },
            { icon:'📄', label:'All Deliveries',    sub:'View scheduled list',        view:'ToDeliver',     color:'#f59e0b' },
          ].map(a => (
            <button key={a.label} className="dh-action-btn" style={{'--ac':a.color}}
              onClick={() => onNavigate?.(a.view)} type="button">
              <span className="dh-ab-icon">{a.icon}</span>
              <span className="dh-ab-label">{a.label}</span>
              <span className="dh-ab-sub">{a.sub}</span>
              <span className="dh-ab-arrow">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two column */}
      <div className="dh-two-col">
        {/* Recent */}
        <div className="dh-panel">
          <div className="dh-panel-hd">
            <span>📬 Recent Deliveries</span>
            <button className="dh-panel-link" onClick={() => onNavigate?.('ToDeliver')} type="button">View all →</button>
          </div>
          {loading ? <div className="dh-spinner-wrap"><div className="dh-spin"/></div>
            : recent.length === 0 ? <div className="dh-empty">No delivery orders yet.</div>
            : recent.map(d => (
              <div className="dh-rec-item" key={d.id}>
                <div>
                  <div style={{ fontWeight:800, color:'#6366f1', fontSize:12 }}>#{d.orderId}</div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{d.customerName||'Unknown'}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>📍 {d.deliveryAddress||d.city||'—'}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  {chip(d.status)}
                  <span style={{ fontSize:10, color:'#94a3b8' }}>🧑‍✈️ {d.driverId||'—'}</span>
                </div>
              </div>
            ))}
        </div>

        {/* Leaderboard */}
        <div className="dh-panel">
          <div className="dh-panel-hd">
            <span>🏆 Driver Leaderboard</span>
            <button className="dh-panel-link" onClick={() => onNavigate?.('ManageDrivers')} type="button">Manage →</button>
          </div>
          {loading ? <div className="dh-spinner-wrap"><div className="dh-spin"/></div>
            : leaders.length === 0 ? <div className="dh-empty">No data yet.</div>
            : leaders.map((d,i) => (
              <div className="dh-leader" key={d.id}>
                <span style={{ fontSize:18 }}>{['🥇','🥈','🥉','4️⃣'][i]||i+1}</span>
                <span style={{ fontWeight:700, fontSize:13, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                <div style={{ flex:2, height:8, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:99, background:'#6366f1', width:`${Math.min(100,(d.count/(leaders[0]?.count||1))*100)}%` }}/>
                </div>
                <span style={{ fontWeight:800, color:'#6366f1', minWidth:20, textAlign:'right' }}>{d.count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="dh-wrap">
        <h2 className="dh-sec">📈 Delivery Pipeline</h2>
        <div className="dh-pipeline">
          {[
            { icon:'🛒', label:'Orders',    val:stats.orders,    color:'#6366f1' },
            { icon:'📅', label:'Scheduled', val:stats.scheduled, color:'#3b82f6' },
            { icon:'🚛', label:'In Transit',val:stats.inTransit, color:'#f59e0b' },
            { icon:'✅', label:'Delivered', val:stats.delivered, color:'#10b981' },
          ].map((s,i,arr) => (
            <React.Fragment key={s.label}>
              <div className="dh-pipe-step" style={{'--pc':s.color}}>
                <div style={{ fontSize:22 }}>{s.icon}</div>
                <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{loading?'…':s.val}</div>
                <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'.5px' }}>{s.label}</div>
              </div>
              {i < arr.length-1 && <div style={{ fontSize:28, color:'#cbd5e1', fontWeight:800 }}>›</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
