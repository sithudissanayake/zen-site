import React, { useEffect, useState } from 'react';
import { getAllDrivers, deleteDriver } from '../services/api';

export default function ViewAllDrivers({ onAddDriver }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [alert,   setAlert]   = useState({ msg:'', type:'' });

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await getAllDrivers();
      setDrivers(res.data);
    } catch {
      showAlert('Could not load drivers. Is the backend running?', 'error');
    } finally { setLoading(false); }
  };

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg:'', type:'' }), 3500);
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver "${driver.driverName}"? This cannot be undone.`)) return;
    try {
      await deleteDriver(driver.driverId);
      showAlert(`🗑️ ${driver.driverName} deleted.`, 'success');
      fetchDrivers();
    } catch {
      showAlert('Error deleting driver. They may have linked delivery orders.', 'error');
    }
  };

  const handleEdit = (driver) => {
    /* No router available; load driver into editor manually if needed */
  };

  const handleAddClick = () => {
    if (typeof onAddDriver === 'function') {
      onAddDriver();
      return;
    }
    showAlert('Use the Driver Details page to add a new driver.', 'info');
  };

  /* Filter */
  const filtered = drivers.filter(d =>
    d.driverName.toLowerCase().includes(search.toLowerCase()) ||
    d.driverId.toLowerCase().includes(search.toLowerCase()) ||
    (d.vehicleNo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <h1 className="page-title">View All Drivers</h1>

      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>{alert.msg}</div>
      )}

      {/* ── Controls ── */}
      <div style={{
        display:'flex', gap:'1rem', marginBottom:'1.2rem',
        flexWrap:'wrap', alignItems:'center'
      }}>
        <input
          className="form-input"
          style={{ maxWidth:'320px', flex:1 }}
          type="text"
          placeholder="🔍  Search by name, ID or vehicle…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-primary"
          onClick={handleAddClick}>
          ➕ Add Driver
        </button>
        <button className="btn btn-secondary" onClick={fetchDrivers}>
          🔄 Refresh
        </button>
      </div>

      {/* ── Table card ── */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"/><p>Loading drivers…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding:'3rem' }}>
            <span className="empty-icon">{search ? '🔍' : '🚗'}</span>
            <p>{search ? `No drivers match "${search}"` : 'No drivers found.'}</p>
            {!search && (
              <button className="btn btn-primary"
                onClick={handleAddClick}>
                ➕ Add Driver
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Driver Name</th>
                  <th>Driver ID</th>
                  <th>Vehicle Type</th>
                  <th>Vehicle No</th>
                  <th>Contact No</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.driverId}>
                    <td style={{ color:'var(--steel)', fontWeight:700 }}>{i + 1}</td>
                    <td style={{ fontWeight:800, textAlign:'left' }}>{d.driverName}</td>
                    <td><span className="badge badge-navy">{d.driverId}</span></td>
                    <td>{d.vehicleType || '—'}</td>
                    <td>{d.vehicleNo   || '—'}</td>
                    <td>{d.contactNo   || '—'}</td>
                    <td style={{ textAlign:'left', fontSize:'.85rem', maxWidth:160 }}>
                      {d.address || '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:'.45rem', justifyContent:'center' }}>
                        <button
                          className="btn btn-edit"
                          style={{ padding:'.35rem .85rem', fontSize:'.82rem' }}
                          onClick={() => handleEdit(d)}
                        >✏️</button>
                        <button
                          className="btn btn-danger"
                          style={{ padding:'.35rem .85rem', fontSize:'.82rem' }}
                          onClick={() => handleDelete(d)}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding:'.9rem 1.5rem',
            borderTop:'1px solid rgba(168,196,232,.35)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            background:'rgba(232,240,248,.4)', flexWrap:'wrap', gap:'.5rem'
          }}>
            <span style={{ fontSize:'.88rem', color:'var(--steel)', fontWeight:700 }}>
              Showing {filtered.length} of {drivers.length} drivers
            </span>
            <button
              className="btn btn-primary"
              style={{ fontSize:'.85rem', padding:'.5rem 1.2rem' }}
              onClick={handleAddClick}
            >➕ Add New Driver</button>
          </div>
        )}
      </div>
    </div>
  );
}