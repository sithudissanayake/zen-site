import React, { useEffect, useState } from 'react';
import { getAllDrivers, getAllOrders } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './MonthlyReport.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* Bar colours – cycles if more than 6 drivers */
const BAR_COLORS = [
  'rgba(58,91,191,.82)',
  'rgba(251,140,0,.82)',
  'rgba(122,147,200,.82)',
  'rgba(46,125,50,.82)',
  'rgba(198,40,40,.82)',
  'rgba(79,195,247,.82)',
];
const BAR_BORDERS = [
  'rgb(58,91,191)',
  'rgb(251,140,0)',
  'rgb(122,147,200)',
  'rgb(46,125,50)',
  'rgb(198,40,40)',
  'rgb(79,195,247)',
];

export default function MonthlyReport() {
  const [drivers, setDrivers] = useState([]);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert,   setAlert]   = useState({ msg:'', type:'' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, oRes] = await Promise.all([getAllDrivers(), getAllOrders()]);
      setDrivers(dRes.data);
      setOrders(oRes.data);
    } catch {
      showAlert('Could not load report data. Is the backend running?', 'error');
    } finally { setLoading(false); }
  };

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg:'', type:'' }), 3500);
  };

  /* ── Stats ── */
  const driverStats = drivers.map(d => ({
    ...d,
    total: orders.filter(o => o.driverId === d.driverId).length,
  }));
  const sorted     = [...driverStats].sort((a, b) => b.total - a.total);
  const totalOrds  = orders.length;
  const totalDrvs  = drivers.length;
  const topDriver  = sorted[0];
  const avg        = totalDrvs > 0 ? (totalOrds / totalDrvs).toFixed(1) : 0;

  /* ── Chart data ── */
  const chartData = {
    labels: sorted.map(d => d.driverName),
    datasets: [{
      label: 'Total Deliveries',
      data: sorted.map(d => d.total),
      backgroundColor: sorted.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
      borderColor:     sorted.map((_, i) => BAR_BORDERS[i % BAR_BORDERS.length]),
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family:'Nunito', size:13, weight:'700' },
          color: '#1a2a5e', padding:20,
        },
      },
      title: {
        display: true,
        text: 'Monthly Delivery Report',
        font: { family:'Rajdhani', size:20, weight:'700' },
        color: '#1a2a5e',
        padding: { bottom:20 },
      },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.parsed.y} deliveries` },
        bodyFont:  { family:'Nunito', size:13 },
        titleFont: { family:'Nunito', size:13, weight:'700' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize:1, font:{ family:'Nunito', size:12 }, color:'#7a93c8' },
        grid:  { color:'rgba(168,196,232,.35)' },
      },
      x: {
        ticks: { font:{ family:'Nunito', size:12, weight:'700' }, color:'#1a2a5e' },
        grid:  { display:false },
      },
    },
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Monthly Delivery Report</h1>

      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>{alert.msg}</div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"/><p>Loading report data…</p>
        </div>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className="rpt-stats">
            <div className="rpt-stat">
              <span className="rpt-stat-icon">📦</span>
              <span className="rpt-stat-num">{totalOrds}</span>
              <span className="rpt-stat-lbl">Total Orders</span>
            </div>
            <div className="rpt-stat">
              <span className="rpt-stat-icon">🚗</span>
              <span className="rpt-stat-num">{totalDrvs}</span>
              <span className="rpt-stat-lbl">Active Drivers</span>
            </div>
            <div className="rpt-stat">
              <span className="rpt-stat-icon">📊</span>
              <span className="rpt-stat-num">{avg}</span>
              <span className="rpt-stat-lbl">Avg / Driver</span>
            </div>
            {topDriver && (
              <div className="rpt-stat rpt-stat--top">
                <span className="rpt-stat-icon">🏆</span>
                <span className="rpt-stat-num" style={{ fontSize:'1.05rem' }}>
                  {topDriver.driverName}
                </span>
                <span className="rpt-stat-lbl">
                  Top Driver · {topDriver.total} orders
                </span>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="card rpt-tbl-card">
            {sorted.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p>No data yet. Add drivers and delivery orders first.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Driver Name</th>
                      <th>Driver ID</th>
                      <th>Total Delivery Orders</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((d, i) => {
                      const pct = totalOrds > 0
                        ? Math.round((d.total / totalOrds) * 100)
                        : 0;
                      return (
                        <tr key={d.driverId}>
                          <td>
                            <span className="rpt-rank">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </span>
                          </td>
                          <td style={{ fontWeight:800 }}>{d.driverName}</td>
                          <td>
                            <span className="badge badge-navy">{d.driverId}</span>
                          </td>
                          <td>
                            <span className="badge badge-navy" style={{ minWidth:40 }}>
                              {d.total}
                            </span>
                          </td>
                          <td style={{ minWidth:130 }}>
                            <div className="rpt-bar">
                              <div className="rpt-bar-fill" style={{ width:`${pct}%` }}/>
                              <span className="rpt-bar-pct">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Bar chart ── */}
          <div className="card rpt-chart-card">
            {sorted.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📈</span>
                <p>Chart will appear once you have drivers and orders.</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="rpt-footer">
            <button className="btn btn-secondary" onClick={fetchData}>
              🔄 Refresh
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              🖨️ Print Report
            </button>
          </div>
        </>
      )}
    </div>
  );
}