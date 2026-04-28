import React, { useEffect, useState } from 'react';
import { getAllDrivers, deleteDriver } from '../services/api';

export default function ViewAllDrivers({ onNavigate }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState({ msg: '', type: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await getAllDrivers();
      const driversData = Array.isArray(res.data) ? res.data : [];
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      showAlert('Could not load drivers. Is the backend running?', 'error');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg: '', type: '' }), 3500);
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver "${driver.name}"? This cannot be undone.`)) return;
    try {
      await deleteDriver(driver.id);
      showAlert(`${driver.name} deleted.`, 'success');
      fetchDrivers();
    } catch {
      showAlert('Error deleting driver. They may have linked delivery orders.', 'error');
    }
  };

  const handleAddClick = () => {
    if (onNavigate) {
      onNavigate('ManageDrivers');
    }
  };

  const handleBackClick = () => {
    if (onNavigate) {
      onNavigate('DeliveryHome');
    }
  };

  const filtered = drivers.filter(driver => {
    const name = (driver.name || '').toLowerCase();
    const id = (driver.driverId || '').toLowerCase();
    const vehicleNo = (driver.vehicleNo || '').toLowerCase();
    const searchLower = search.toLowerCase();
    return name.includes(searchLower) || id.includes(searchLower) || vehicleNo.includes(searchLower);
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>View All Drivers</h1>
        <button 
          onClick={handleBackClick}
          style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          ← Back to Delivery
        </button>
      </div>

      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>{alert.msg}</div>
      )}

      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.2rem',
        flexWrap: 'wrap', alignItems: 'center'
      }}>
        <input
          className="form-input"
          style={{ maxWidth: '320px', flex: 1 }}
          type="text"
          placeholder=" Search by name, ID or vehicle…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAddClick}>
          Add Driver
        </button>
        <button className="btn btn-secondary" onClick={fetchDrivers}>
          🔄 Refresh
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"/><p>Loading drivers…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <span className="empty-icon">{search ? '🔍' : '🚗'}</span>
            <p>{search ? `No drivers match "${search}"` : 'No drivers found.'}</p>
            {!search && (
              <button className="btn btn-primary" onClick={handleAddClick}>
                Add Driver
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
                {filtered.map((driver, i) => (
                  <tr key={driver.id}>
                    <td style={{ fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 800, textAlign: 'left' }}>{driver.name}</td>
                    <td><span className="badge badge-navy">{driver.driverId}</span></td>
                    <td>{driver.vehicleType || '—'}</td>
                    <td>{driver.vehicleNo || '—'}</td>
                    <td>{driver.phone || '—'}</td>
                    <td style={{ textAlign: 'left', fontSize: '.85rem', maxWidth: 160 }}>{driver.address || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '.45rem', justifyContent: 'center' }}>
                        <button className="btn btn-edit" onClick={() => handleAddClick()}>✏️</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(driver)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '.9rem 1.5rem',
            borderTop: '1px solid rgba(168,196,232,.35)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(232,240,248,.4)', flexWrap: 'wrap', gap: '.5rem'
          }}>
            <span style={{ fontSize: '.88rem', color: 'var(--steel)', fontWeight: 700 }}>
              Showing {filtered.length} of {drivers.length} drivers
            </span>
            <button className="btn btn-primary" onClick={handleAddClick}>
               Add New Driver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}