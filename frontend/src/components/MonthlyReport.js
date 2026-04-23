import React, { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getAllDeliveryOrders, getAllDrivers } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_COLORS = {
  DELIVERED: '#10b981', IN_TRANSIT: '#3b82f6',
  SCHEDULED: '#6366f1', PENDING: '#f59e0b', CANCELLED: '#ef4444',
};

/* ─── Inline chip HTML (used inside the print window string) ─── */
const chipHTML = (status = '') => {
  const key   = status.toUpperCase().replace(/ /g, '_');
  const color = STATUS_COLORS[key] || '#6b7280';
  return `<span style="background:${color}22;color:${color};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;white-space:nowrap">${status || '—'}</span>`;
};

/* ═══════════════════════════════════════════════════
   Builds a complete self-contained HTML page string
   that will be opened in a blank popup for printing.
═══════════════════════════════════════════════════ */
function buildPrintHTML({
  filterMonth, filterYear, filterStatus, filterDriver,
  filtered, delivered, inTransit, scheduled, pending, cancelled,
  compRate, driverBreakdown, topDriver,
  barChartBase64, donutChartBase64, logoBase64,
}) {
  const share = n => filtered.length > 0 ? Math.round(n / filtered.length * 100) : 0;

  const kpiCards = [
    { icon: '📦', label: 'Total Deliveries', value: filtered.length, color: '#6366f1' },
    { icon: '✅', label: 'Delivered',         value: delivered,       color: '#10b981' },
    { icon: '🚛', label: 'In Transit',        value: inTransit,       color: '#3b82f6' },
    { icon: '📈', label: 'Completion Rate',   value: `${compRate}%`,
      color: compRate >= 80 ? '#10b981' : compRate >= 50 ? '#f59e0b' : '#ef4444' },
  ].map(k => `
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;text-align:center;background:#fff">
      <div style="font-size:22px;margin-bottom:4px">${k.icon}</div>
      <div style="font-size:24px;font-weight:800;color:${k.color}">${k.value}</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px">${k.label}</div>
    </div>`).join('');

  const topDriverHTML = topDriver && topDriver.total > 0 ? `
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:12px 18px;
                margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;color:#92400e;font-weight:600">🏆 Top Performing Driver</div>
        <div style="font-size:17px;font-weight:800;color:#b45309">${topDriver.name || topDriver.driverName || topDriver.driverId}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:26px;font-weight:800;color:#d97706">${topDriver.total}</div>
        <div style="font-size:11px;color:#92400e">Total Deliveries</div>
      </div>
    </div>` : '';

  const driverRows = driverBreakdown.map((d, i) => {
    const pct   = share(d.total);
    const medal = ['🥇','🥈','🥉'][i] || `${i + 1}`;
    return `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 10px">${medal}</td>
        <td style="padding:8px 10px;font-weight:600">${d.name || d.driverName || d.driverId}</td>
        <td style="padding:8px 10px;color:#64748b">${d.driverId}</td>
        <td style="padding:8px 10px;color:#64748b">${d.vehicleType || '—'}</td>
        <td style="padding:8px 10px;text-align:center;font-weight:700">${d.total}</td>
        <td style="padding:8px 10px;text-align:center;color:#10b981;font-weight:600">${d.delivered}</td>
        <td style="padding:8px 10px;text-align:center;color:#3b82f6;font-weight:600">${d.inTransit}</td>
        <td style="padding:8px 10px;text-align:center;color:#6366f1;font-weight:600">${d.scheduled}</td>
        <td style="padding:8px 10px;min-width:90px">
          <div style="position:relative;background:#e2e8f0;border-radius:10px;height:18px">
            <div style="background:#6366f1;border-radius:10px;height:100%;width:${pct}%"></div>
            <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                         font-size:10px;font-weight:700">${pct}%</span>
          </div>
        </td>
      </tr>`;
  }).join('');

  const orderRows = filtered.slice(0, 50).map((d, i) => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:7px 8px;text-align:center;color:#94a3b8">${i + 1}</td>
      <td style="padding:7px 8px;font-weight:700;color:#6366f1">${d.orderId || '—'}</td>
      <td style="padding:7px 8px">${d.customerName || '—'}</td>
      <td style="padding:7px 8px;color:#475569;max-width:160px;overflow:hidden;
                 text-overflow:ellipsis;white-space:nowrap">
        ${(d.deliveryAddress || d.city || '—').substring(0, 40)}
      </td>
      <td style="padding:7px 8px;color:#475569">${d.driverId || '—'}</td>
      <td style="padding:7px 8px;text-align:center">${chipHTML(d.status || '')}</td>
      <td style="padding:7px 8px;text-align:center">
        <span style="padding:2px 8px;border-radius:12px;font-size:10px;background:#f1f5f9;color:#475569">
          ${d.priority || 'NORMAL'}
        </span>
      </td>
      <td style="padding:7px 8px;white-space:nowrap;color:#475569">${d.deliveryDate || '—'}</td>
    </tr>`).join('');

  const logoTag = logoBase64
    ? `<img src="${logoBase64}" alt="Zenvora" style="height:56px;width:auto;object-fit:contain" />`
    : `<div style="width:56px;height:56px;background:#6366f1;border-radius:8px;display:flex;
                  align-items:center;justify-content:center;color:white;font-weight:800;font-size:18px">Z</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Delivery Report – ${MONTHS[filterMonth]} ${filterYear}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      background: white;
      padding: 24px 28px;
      font-size: 12px;
    }
    table { border-collapse: collapse; width: 100%; }
    th    { font-weight: 700; color: #374151; white-space: nowrap; }
    *     { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 14mm 12mm; }
    @media print {
      body  { padding: 0; }
      table { page-break-inside: auto; }
      tr    { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>

  <!-- ── Header ── -->
  <div style="display:flex;align-items:center;gap:16px;padding-bottom:16px;
              border-bottom:3px solid #6366f1;margin-bottom:20px">
    ${logoTag}
    <div>
      <div style="font-size:20px;font-weight:800;letter-spacing:-0.3px">
        ZENVORA TRADING &amp; INDUSTRIES
      </div>
      <div style="font-size:12px;color:#6366f1;font-weight:600">Delivery Performance Report</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:16px;font-weight:700">${MONTHS[filterMonth]} ${filterYear}</div>
      <div style="font-size:11px;color:#94a3b8">Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <!-- ── Filter summary ── -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
              padding:8px 14px;font-size:11px;margin-bottom:20px;color:#475569">
    <strong>Filters:</strong>&nbsp;
    Month: ${MONTHS[filterMonth]} &nbsp;|&nbsp;
    Year: ${filterYear} &nbsp;|&nbsp;
    Status: ${filterStatus === 'ALL' ? 'All' : filterStatus} &nbsp;|&nbsp;
    Driver: ${filterDriver === 'ALL' ? 'All' : filterDriver}
  </div>

  <!-- ── KPI Cards ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
    ${kpiCards}
  </div>

  <!-- ── Top Driver ── -->
  ${topDriverHTML}

  <!-- ── Charts (captured as images) ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px">📊 Deliveries by Driver</div>
      ${barChartBase64
        ? `<img src="${barChartBase64}" style="width:100%;height:auto" />`
        : `<div style="text-align:center;padding:40px;color:#94a3b8">No chart data</div>`}
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px">📈 Status Distribution</div>
      ${donutChartBase64
        ? `<img src="${donutChartBase64}" style="width:100%;height:auto" />`
        : `<div style="text-align:center;padding:40px;color:#94a3b8">No chart data</div>`}
    </div>
  </div>

  <!-- ── Driver Performance Table ── -->
  <div style="margin-bottom:20px">
    <div style="font-size:14px;font-weight:700;margin-bottom:10px;
                padding-bottom:6px;border-bottom:2px solid #e2e8f0">Driver Performance</div>
    ${driverBreakdown.length === 0
      ? `<div style="text-align:center;padding:30px;color:#94a3b8">No driver data</div>`
      : `<table>
          <thead>
            <tr style="background:#f8fafc">
              ${['Rank','Driver','ID','Vehicle','Total','Delivered','In Transit','Scheduled','Share']
                .map(h => `<th style="padding:8px 10px;text-align:${
                  ['Rank','Driver','ID','Vehicle'].includes(h) ? 'left' : 'center'
                };border-bottom:2px solid #e2e8f0">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${driverRows}</tbody>
        </table>`}
  </div>

  <!-- ── Orders Detail Table ── -->
  <div style="margin-bottom:24px">
    <div style="font-size:14px;font-weight:700;margin-bottom:10px;
                padding-bottom:6px;border-bottom:2px solid #e2e8f0">
      Delivery Orders Detail
      <span style="font-size:12px;color:#94a3b8;font-weight:400">
        &nbsp;(${filtered.length} orders${filtered.length > 50 ? ', showing first 50' : ''})
      </span>
    </div>
    ${filtered.length === 0
      ? `<div style="text-align:center;padding:30px;color:#94a3b8">No orders match the selected filters</div>`
      : `<table style="font-size:10.5px">
          <thead>
            <tr style="background:#f8fafc">
              ${['#','Order ID','Customer','Address','Driver','Status','Priority','Date']
                .map(h => `<th style="padding:7px 8px;text-align:${
                  ['Status','Priority','#'].includes(h) ? 'center' : 'left'
                };border-bottom:2px solid #e2e8f0">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${orderRows}</tbody>
        </table>`}
  </div>

  <!-- ── Signature ── -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px;
              margin-top:40px;padding-top:16px;border-top:2px dashed #e2e8f0">
    ${['Prepared By','Approved By','Date'].map(l => `
      <div style="text-align:center">
        <div style="height:1px;background:#cbd5e1;margin-bottom:6px"></div>
        <div style="font-size:10px;color:#94a3b8;letter-spacing:0.05em">${l}</div>
      </div>`).join('')}
  </div>

</body>
</html>`;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function MonthlyReport({ onNavigate }) {
  const now = new Date();
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [drivers,       setDrivers]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [alert,         setAlert]         = useState({ msg: '', type: '' });
  const [filterMonth,   setFilterMonth]   = useState(now.getMonth());
  const [filterYear,    setFilterYear]    = useState(now.getFullYear());
  const [filterStatus,  setFilterStatus]  = useState('ALL');
  const [filterDriver,  setFilterDriver]  = useState('ALL');

  // Refs to grab base64 snapshots of charts before printing
  const barRef   = React.useRef(null);
  const donutRef = React.useRef(null);

  const showAlert = useCallback((msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg: '', type: '' }), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, drRes] = await Promise.all([getAllDeliveryOrders(), getAllDrivers()]);
      setAllDeliveries(Array.isArray(dRes.data) ? dRes.data : []);
      setDrivers(Array.isArray(drRes.data) ? drRes.data : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showAlert('Could not load data. Is the backend running?', 'error');
      setAllDeliveries([]);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Derived data ─── */
  const filtered = allDeliveries.filter(d => {
    const created = d.createdAt ? new Date(d.createdAt) : null;
    const mOk  = !created || (created.getMonth() === filterMonth && created.getFullYear() === filterYear);
    const sOk  = filterStatus === 'ALL' || (d.status || '').toUpperCase() === filterStatus;
    const drOk = filterDriver === 'ALL' || d.driverId === filterDriver;
    return mOk && sOk && drOk;
  });

  const count     = s => filtered.filter(d => (d.status || '').toUpperCase() === s).length;
  const delivered = count('DELIVERED');
  const inTransit = count('IN_TRANSIT');
  const scheduled = count('SCHEDULED');
  const pending   = count('PENDING');
  const cancelled = count('CANCELLED');
  const compRate  = filtered.length > 0 ? Math.round(delivered / filtered.length * 100) : 0;

  const driverBreakdown = drivers.map(drv => {
    const dOrds = filtered.filter(d => d.driverId === drv.driverId);
    return {
      ...drv,
      total:     dOrds.length,
      delivered: dOrds.filter(d => (d.status||'').toUpperCase()==='DELIVERED').length,
      inTransit: dOrds.filter(d => (d.status||'').toUpperCase()==='IN_TRANSIT').length,
      scheduled: dOrds.filter(d => (d.status||'').toUpperCase()==='SCHEDULED').length,
    };
  }).sort((a, b) => b.total - a.total);

  const topDriver = driverBreakdown[0];
  const years     = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  /* ─── Chart data / options ─── */
  const barData = {
    labels: driverBreakdown.slice(0, 8).map(d => (d.name || d.driverId).substring(0, 12)),
    datasets: [
      { label: 'Delivered',  data: driverBreakdown.slice(0,8).map(d=>d.delivered),  backgroundColor:'rgba(16,185,129,.8)', borderRadius:4, barPercentage:0.7 },
      { label: 'In Transit', data: driverBreakdown.slice(0,8).map(d=>d.inTransit), backgroundColor:'rgba(59,130,246,.8)',  borderRadius:4, barPercentage:0.7 },
      { label: 'Scheduled',  data: driverBreakdown.slice(0,8).map(d=>d.scheduled),  backgroundColor:'rgba(99,102,241,.8)', borderRadius:4, barPercentage:0.7 },
    ],
  };
  const donutData = {
    labels: ['Delivered','In Transit','Scheduled','Pending','Cancelled'],
    datasets: [{ data:[delivered,inTransit,scheduled,pending,cancelled], backgroundColor:['#10b981','#3b82f6','#6366f1','#f59e0b','#ef4444'], borderWidth:0 }],
  };
  const barOptions = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'top', labels:{ font:{size:10}, boxWidth:10, padding:6 } } },
    scales:{
      y:{ beginAtZero:true, ticks:{ stepSize:1, font:{size:9} } },
      x:{ ticks:{ font:{size:9} }, grid:{ display:false } },
    },
  };
  const donutOptions = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'right', labels:{ font:{size:10}, boxWidth:10, padding:6 } } },
    cutout:'65%',
  };

  /* ─── Convert /zen.jpg to base64 (so it works in isolated window) ─── */
  const getLogoBase64 = () => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = '/zen.jpg';
  });

  /* ─── Print handler: opens isolated blank popup ─── */
  const handlePrint = async () => {
    // Capture chart canvases as base64 PNGs
    const barChartBase64   = barRef.current?.toBase64Image?.()   || null;
    const donutChartBase64 = donutRef.current?.toBase64Image?.() || null;
    const logoBase64       = await getLogoBase64();

    const html = buildPrintHTML({
      filterMonth, filterYear, filterStatus, filterDriver,
      filtered, delivered, inTransit, scheduled, pending, cancelled,
      compRate, driverBreakdown, topDriver,
      barChartBase64, donutChartBase64, logoBase64,
    });

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      showAlert('Pop-up blocked – please allow pop-ups for this site, then try again.', 'error');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();

    // Trigger print once all resources are loaded
    win.onload = () => {
      win.focus();
      win.print();
      win.onafterprint = () => win.close();
    };
  };

  /* ─── Screen-only StatusChip ─── */
  const StatusChip = ({ status }) => {
    const key   = (status || '').toUpperCase().replace(/ /g, '_');
    const color = STATUS_COLORS[key] || '#6b7280';
    return (
      <span style={{ background:`${color}22`, color, padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
        {status || '—'}
      </span>
    );
  };

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <>
      {/* ── Sticky toolbar ── */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'12px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1400, margin:'0 auto' }}>
          <h2 style={{ margin:0, fontSize:17 }}>📊 Monthly Delivery Report</h2>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => onNavigate && onNavigate('DeliveryHome')}
              style={{ padding:'7px 14px', background:'#64748b', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13 }}
            >← Back</button>
            <button
              onClick={fetchData}
              style={{ padding:'7px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:13 }}
            >🔄 Refresh</button>
            {/* This now opens an isolated clean popup – no navbar, no app chrome */}
            <button
              onClick={handlePrint}
              style={{ padding:'7px 14px', background:'#6366f1', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13 }}
            >🖨️ Save as PDF</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:12, alignItems:'center' }}>
          <span style={{ fontWeight:600, fontSize:12 }}>Filters:</span>
          <select value={filterMonth}  onChange={e => setFilterMonth(+e.target.value)}  style={SEL}>
            {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={filterYear}   onChange={e => setFilterYear(+e.target.value)}   style={SEL}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}  style={SEL}>
            <option value="ALL">All Statuses</option>
            {['PENDING','SCHEDULED','IN_TRANSIT','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)}  style={SEL}>
            <option value="ALL">All Drivers</option>
            {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.name || d.driverName} ({d.driverId})</option>)}
          </select>
        </div>
      </div>

      {/* Alert */}
      {alert.msg && (
        <div style={{ margin:'12px 20px', padding:12, borderRadius:8, background:'#fee2e2', color:'#991b1b', fontSize:13 }}>
          {alert.msg}
        </div>
      )}

      {/* ── Screen report preview ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px', fontFamily:"'Segoe UI',Arial,sans-serif", color:'#1e293b' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:300 }}>
            <div style={{ width:40, height:40, border:'3px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:16, borderBottom:'3px solid #6366f1', marginBottom:20 }}>
              <img src="/zen.jpg" alt="Zenvora" style={{ height:56, width:'auto', objectFit:'contain' }} />
              <div>
                <div style={{ fontSize:20, fontWeight:800 }}>ZENVORA TRADING &amp; INDUSTRIES</div>
                <div style={{ fontSize:12, color:'#6366f1', fontWeight:600 }}>Delivery Performance Report</div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontSize:16, fontWeight:700 }}>{MONTHS[filterMonth]} {filterYear}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>Generated: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Filter summary */}
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 14px', fontSize:11, marginBottom:20, color:'#475569' }}>
              <strong>Filters:</strong>&nbsp; Month: {MONTHS[filterMonth]} &nbsp;|&nbsp; Year: {filterYear} &nbsp;|&nbsp;
              Status: {filterStatus==='ALL'?'All':filterStatus} &nbsp;|&nbsp;
              Driver: {filterDriver==='ALL'?'All':filterDriver}
            </div>

            {/* KPI row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
              {[
                { icon:'📦', label:'Total Deliveries', value:filtered.length, color:'#6366f1' },
                { icon:'✅', label:'Delivered',         value:delivered,       color:'#10b981' },
                { icon:'🚛', label:'In Transit',        value:inTransit,       color:'#3b82f6' },
                { icon:'📈', label:'Completion Rate',   value:`${compRate}%`,  color:compRate>=80?'#10b981':compRate>=50?'#f59e0b':'#ef4444' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', textAlign:'center', background:'#fff' }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:24, fontWeight:800, color }}>{value}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Top driver */}
            {topDriver && topDriver.total > 0 && (
              <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10, padding:'12px 18px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11, color:'#92400e', fontWeight:600 }}>🏆 Top Performing Driver</div>
                  <div style={{ fontSize:17, fontWeight:800, color:'#b45309' }}>{topDriver.name || topDriver.driverName || topDriver.driverId}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:26, fontWeight:800, color:'#d97706' }}>{topDriver.total}</div>
                  <div style={{ fontSize:11, color:'#92400e' }}>Total Deliveries</div>
                </div>
              </div>
            )}

            {/* Charts */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
              <div style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>📊 Deliveries by Driver</div>
                <div style={{ height:220 }}>
                  {driverBreakdown.some(d=>d.total>0)
                    ? <Bar ref={barRef} data={barData} options={barOptions} />
                    : <div style={{ textAlign:'center', padding:40, color:'#94a3b8', fontSize:12 }}>No data</div>}
                </div>
              </div>
              <div style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>📈 Status Distribution</div>
                <div style={{ height:220 }}>
                  {filtered.length>0
                    ? <Doughnut ref={donutRef} data={donutData} options={donutOptions} />
                    : <div style={{ textAlign:'center', padding:40, color:'#94a3b8', fontSize:12 }}>No data</div>}
                </div>
              </div>
            </div>

            {/* Driver table */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10, paddingBottom:6, borderBottom:'2px solid #e2e8f0' }}>Driver Performance</div>
              {driverBreakdown.length===0
                ? <div style={{ textAlign:'center', padding:30, color:'#94a3b8', fontSize:12 }}>No driver data</div>
                : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                    <thead>
                      <tr style={{ background:'#f8fafc' }}>
                        {['Rank','Driver','ID','Vehicle','Total','Delivered','In Transit','Scheduled','Share'].map(h=>(
                          <th key={h} style={{ padding:'8px 10px', textAlign:['Rank','Driver','ID','Vehicle'].includes(h)?'left':'center', borderBottom:'2px solid #e2e8f0', fontWeight:700, color:'#374151', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {driverBreakdown.map((d,i)=>{
                        const pct = filtered.length>0 ? Math.round(d.total/filtered.length*100) : 0;
                        return (
                          <tr key={d.driverId} style={{ borderBottom:'1px solid #f1f5f9' }}>
                            <td style={{ padding:'8px 10px' }}>{['🥇','🥈','🥉'][i]||`${i+1}`}</td>
                            <td style={{ padding:'8px 10px', fontWeight:600 }}>{d.name||d.driverName||d.driverId}</td>
                            <td style={{ padding:'8px 10px', color:'#64748b' }}>{d.driverId}</td>
                            <td style={{ padding:'8px 10px', color:'#64748b' }}>{d.vehicleType||'—'}</td>
                            <td style={{ padding:'8px 10px', textAlign:'center', fontWeight:700 }}>{d.total}</td>
                            <td style={{ padding:'8px 10px', textAlign:'center', color:'#10b981', fontWeight:600 }}>{d.delivered}</td>
                            <td style={{ padding:'8px 10px', textAlign:'center', color:'#3b82f6', fontWeight:600 }}>{d.inTransit}</td>
                            <td style={{ padding:'8px 10px', textAlign:'center', color:'#6366f1', fontWeight:600 }}>{d.scheduled}</td>
                            <td style={{ padding:'8px 10px', minWidth:90 }}>
                              <div style={{ position:'relative', background:'#e2e8f0', borderRadius:10, height:18 }}>
                                <div style={{ background:'#6366f1', borderRadius:10, height:'100%', width:`${pct}%` }} />
                                <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              }
            </div>

            {/* Orders table */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10, paddingBottom:6, borderBottom:'2px solid #e2e8f0' }}>
                Delivery Orders Detail&nbsp;
                <span style={{ fontSize:12, color:'#94a3b8', fontWeight:400 }}>
                  ({filtered.length} orders{filtered.length>50?', showing first 50':''})
                </span>
              </div>
              {filtered.length===0
                ? <div style={{ textAlign:'center', padding:30, color:'#94a3b8', fontSize:12 }}>No orders match the selected filters</div>
                : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10.5 }}>
                    <thead>
                      <tr style={{ background:'#f8fafc' }}>
                        {['#','Order ID','Customer','Address','Driver','Status','Priority','Date'].map(h=>(
                          <th key={h} style={{ padding:'7px 8px', textAlign:['Status','Priority','#'].includes(h)?'center':'left', borderBottom:'2px solid #e2e8f0', fontWeight:700, color:'#374151', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0,50).map((d,i)=>(
                        <tr key={d.id||d.orderId} style={{ borderBottom:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'7px 8px', textAlign:'center', color:'#94a3b8' }}>{i+1}</td>
                          <td style={{ padding:'7px 8px', fontWeight:700, color:'#6366f1' }}>{d.orderId}</td>
                          <td style={{ padding:'7px 8px' }}>{d.customerName||'—'}</td>
                          <td style={{ padding:'7px 8px', color:'#475569', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(d.deliveryAddress||d.city||'—').substring(0,40)}</td>
                          <td style={{ padding:'7px 8px', color:'#475569' }}>{d.driverId||'—'}</td>
                          <td style={{ padding:'7px 8px', textAlign:'center' }}><StatusChip status={d.status} /></td>
                          <td style={{ padding:'7px 8px', textAlign:'center' }}>
                            <span style={{ padding:'2px 8px', borderRadius:12, fontSize:10, background:'#f1f5f9', color:'#475569' }}>{d.priority||'NORMAL'}</span>
                          </td>
                          <td style={{ padding:'7px 8px', whiteSpace:'nowrap', color:'#475569' }}>{d.deliveryDate||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>

            {/* Signature */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40, marginTop:40, paddingTop:16, borderTop:'2px dashed #e2e8f0' }}>
              {['Prepared By','Approved By','Date'].map(l=>(
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ height:1, background:'#cbd5e1', marginBottom:6 }} />
                  <div style={{ fontSize:10, color:'#94a3b8', letterSpacing:'0.05em' }}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

const SEL = { padding:'5px 10px', borderRadius:6, border:'1px solid #e2e8f0', fontSize:12 };