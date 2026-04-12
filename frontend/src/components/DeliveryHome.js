import React, { useEffect, useState } from 'react';
import { getAllDrivers, getAllOrders } from '../services/api';
import './DeliveryHome.css';

export default function DeliveryHome({ onNavigate }) {
  const [stats, setStats] = useState({ drivers: 0, orders: 0, pending: 0 });

  useEffect(() => {
    Promise.all([getAllDrivers(), getAllOrders()])
      .then(([dRes, oRes]) => {
        const pending = oRes.data.filter(o => ((o.orderStatus || o.OrderStatus || o.status || '').toString().toUpperCase()) === 'PENDING').length;
        setStats({ drivers: dRes.data.length, orders: oRes.data.length, pending });
      })
      .catch(() => {}); // silent – backend may not be up yet
  }, []);

  return (
    <div className="home">

      {/* ── Hero ── */}
      <div className="home__hero">
        <div className="home__hero-shade" />

        {/* Stats strip */}
        <div className="home__stats">
          <div className="home__stat">
            <span className="home__stat-num">{stats.drivers}</span>
            <span className="home__stat-lbl">Active Drivers</span>
          </div>
          <div className="home__stat-div" />
          <div className="home__stat">
            <span className="home__stat-num">{stats.orders}</span>
            <span className="home__stat-lbl">Total Orders</span>
          </div>
          <div className="home__stat-div" />
          <div className="home__stat">
            <span className="home__stat-num">{stats.pending}</span>
            <span className="home__stat-lbl">Pending</span>
          </div>
        </div>

        <div className="home__tagline">Fast, Safe and Always On Schedule</div>
      </div>

      {/* ── Top action pills ── */}
      <div className="home__pills-bar">
        <button className="home__pill home__pill--dark" type="button" onClick={() => onNavigate?.('ManageDrivers')}>
          🚗&nbsp; Drivers
        </button>
       <button className="home__pill home__pill--outline" type="button" onClick={() => onNavigate?.('MonthlyReport')}>
          📊&nbsp; View Monthly Delivery Report
        </button>
      </div>
      {/* ── Feature cards ── */}
      <div className="home__cards">

        <div className="home__card">
          <div className="home__card-visual home__card-visual--driver">
            <span className="home__card-icon">🚚</span>
            <span className="home__card-visual-lbl">Delivery Driver</span>
          </div>
          <button className="home__card-btn" type="button" onClick={() => onNavigate?.('ManageDrivers')}>
            Manage Drivers
          </button>
        </div>

        <div className="home__card">
          <div className="home__card-visual home__card-visual--map">
            <span className="home__card-icon">📍</span>
            <span className="home__card-visual-lbl">Track &amp; Assign</span>
          </div>
          <button className="home__card-btn" type="button" onClick={() => onNavigate?.('ManageDrivers')}>
            View All Drivers
          </button>
        </div>

      </div>

      {/* ── Quick-access row ── */}
      <div className="home__quick">
        <button className="home__quick-btn" type="button" onClick={() => onNavigate?.('ToDeliver')}>
          <span>📦</span><span>To Deliver</span>
        </button>
        <button className="home__quick-btn" type="button" onClick={() => onNavigate?.('MonthlyReport')}>
          <span>📈</span><span>Monthly Report</span>
        </button>
        <button className="home__quick-btn" type="button" onClick={() => onNavigate?.('ManageDrivers')}>
          <span>👁️</span><span>View Drivers</span>
        </button>
        <button className="home__quick-btn" type="button" onClick={() => onNavigate?.('ManageDrivers')}>
          <span>➕</span><span>Add Driver</span>
        </button>
      </div>

    </div>
  );
}