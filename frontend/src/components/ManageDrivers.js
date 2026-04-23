import React, { useState, useEffect } from 'react';
import {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../services/api';
import './ManageDrivers.css';

const EMPTY = {
  driverId: '', 
  name: '',
  vehicleType: '',
  vehicleNo: '', 
  phone: '',
  address: '',
  status: 'ACTIVE'
};

const FIELDS = [
  { num: 1, label: 'Driver Name', name: 'name', ph: 'e.g. T. Perera' },
  { num: 2, label: 'Driver ID', name: 'driverId', ph: 'e.g. D001' },
  { num: 3, label: 'Vehicle Type', name: 'vehicleType', ph: 'e.g. Lorry' },
  { num: 4, label: 'Vehicle No', name: 'vehicleNo', ph: 'e.g. WP GA-1234' },
  { num: 5, label: 'Contact No', name: 'phone', ph: 'e.g. 0708956456' },
  { num: 6, label: 'Address', name: 'address', ph: 'e.g. 56/B, Payagala' },
];

export default function ManageDrivers({ onNavigate }) {
  const [form, setForm] = useState(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tblLoading, setTblLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [alert, setAlert] = useState({ msg: '', type: '' });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setTblLoading(true);
    try {
      const res = await getAllDrivers();
      const driversData = Array.isArray(res.data) ? res.data : [];
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      showAlert('Could not load drivers. Is the backend running?', 'error');
      setDrivers([]);
    } finally {
      setTblLoading(false);
    }
  };

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg: '', type: '' }), 3500);
  };

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.driverId.trim()) { showAlert('Driver ID is required.', 'error'); return false; }
    if (!form.name.trim()) { showAlert('Driver Name is required.', 'error'); return false; }
    return true;
  };

  const handleBackClick = () => {
    if (onNavigate) {
      onNavigate('DeliveryHome');
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createDriver(form);
      showAlert('✅ Driver saved successfully!', 'success');
      setForm(EMPTY);
      setIsEditing(false);
      fetchDrivers();
    } catch (err) {
      showAlert(
        err.response?.status === 409
          ? 'Driver ID already exists. Use a different ID.'
          : 'Error saving driver. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateDriver(form.id, form);
      showAlert('✅ Driver updated successfully!', 'success');
      setForm(EMPTY);
      setIsEditing(false);
      fetchDrivers();
    } catch {
      showAlert('Error updating driver. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id && !form.driverId) {
      showAlert('Select a driver from the table first.', 'error');
      return;
    }
    if (!window.confirm(`Delete driver "${form.name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteDriver(form.id || form.driverId);
      showAlert('🗑️ Driver deleted successfully.', 'success');
      setForm(EMPTY);
      setIsEditing(false);
      fetchDrivers();
    } catch {
      showAlert('Error deleting driver. They may have linked orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = (driver) => {
    setForm(driver);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setForm(EMPTY);
    setIsEditing(false);
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Driver Details</h1>
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

      <div className="card manage-card">
        {isEditing && (
          <div className="manage-edit-badge">✏️ Editing: {form.driverId}</div>
        )}

        <div className="manage-card-header">
          <p className="manage-card-copy">
            Add a new driver, or select one from the table below to edit or delete.
          </p>
        </div>

        <div className="manage-form-grid">
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
                disabled={f.name === 'driverId' && isEditing}
              />
            </div>
          ))}
        </div>

        <div className="manage-btn-row">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '💾 Saving...' : '💾 Save'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
              {loading ? '💾 Updating...' : '💾 Update'}
            </button>
          )}
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            🗑️ Delete
          </button>
          <button className="btn btn-secondary" onClick={handleClear}>
            ✖ Clear
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', padding: 0, overflow: 'hidden' }}>
        <div className="manage-tbl-header">
          <h2 className="manage-tbl-title">All Drivers — click to edit</h2>
          <span className="manage-count-badge">{drivers.length} drivers</span>
        </div>

        {tblLoading ? (
          <div className="loading-state"><div className="spinner"/><p>Loading…</p></div>
        ) : drivers.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <span className="empty-icon">🚗</span>
            <p>No drivers yet. Add your first driver above.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Driver ID</th>
                  <th>Vehicle Type</th>
                  <th>Vehicle No</th>
                  <th>Contact No</th>
                  <th>Address</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 800, textAlign: 'left' }}>{d.name}</td>
                    <td><span className="badge badge-navy">{d.driverId}</span></td>
                    <td>{d.vehicleType || '—'}</td>
                    <td>{d.vehicleNo || '—'}</td>
                    <td>{d.phone || '—'}</td>
                    <td style={{ textAlign: 'left', fontSize: '.85rem', maxWidth: 160 }}>{d.address || '—'}</td>
                    <td>
                      <button
                        className="btn btn-edit"
                        style={{ padding: '.35rem .9rem', fontSize: '.82rem' }}
                        onClick={() => handleEditRow(d)}
                      >✏️ Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('ViewAllDrivers')}>
            👁️ View All Drivers
          </button>
          <button className="btn btn-secondary" onClick={fetchDrivers}>
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
}