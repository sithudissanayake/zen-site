import React, { useState, useEffect } from 'react';
import {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../services/api';
import './ManageDrivers.css';

const EMPTY = {
  driverId: '', driverName: '', vehicleType: '',
  vehicleNo: '', contactNo: '', address: '',
};

const FIELDS = [
  { num:1, label:'Driver Name',  name:'driverName',  ph:'e.g. T. Perera'      },
  { num:2, label:'Driver ID',    name:'driverId',    ph:'e.g. D001'            },
  { num:3, label:'Vehicle Type', name:'vehicleType', ph:'e.g. Lorry'           },
  { num:4, label:'Vehicle No',   name:'vehicleNo',   ph:'e.g. WP GA-1234'      },
  { num:5, label:'Contact No',   name:'contactNo',   ph:'e.g. 0708956456'      },
  { num:6, label:'Address',      name:'address',     ph:'e.g. 56/B, Payagala'  },
];

export default function ManageDrivers() {
  const [form,       setForm]       = useState(EMPTY);
  const [isEditing,  setIsEditing]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [tblLoading, setTblLoading] = useState(true);
  const [drivers,    setDrivers]    = useState([]);
  const [alert,      setAlert]      = useState({ msg:'', type:'' });

  useEffect(() => {
    fetchDrivers();
  }, []); // eslint-disable-line

  const fetchDrivers = async () => {
    setTblLoading(true);
    try {
      const res = await getAllDrivers();
      setDrivers(res.data);
    } catch {
      showAlert('Could not load drivers. Is the backend running?', 'error');
    } finally {
      setTblLoading(false);
    }
  };

  const showAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg:'', type:'' }), 3500);
  };

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.driverId.trim())   { showAlert('Driver ID is required.',   'error'); return false; }
    if (!form.driverName.trim()) { showAlert('Driver Name is required.', 'error'); return false; }
    return true;
  };

  /* ── Save (create) ── */
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createDriver(form);
      showAlert('✅ Driver saved successfully!', 'success');
      setForm(EMPTY); setIsEditing(false);
      fetchDrivers();
    } catch (err) {
      showAlert(
        err.response?.status === 409
          ? 'Driver ID already exists. Use a different ID.'
          : 'Error saving driver. Please try again.',
        'error'
      );
    } finally { setLoading(false); }
  };

  /* ── Update ── */
  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateDriver(form.driverId, form);
      showAlert('✅ Driver updated successfully!', 'success');
      setForm(EMPTY); setIsEditing(false);
      fetchDrivers();
    } catch {
      showAlert('Error updating driver. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!form.driverId.trim()) {
      showAlert('Select a driver from the table first, or enter a Driver ID.', 'error');
      return;
    }
    if (!window.confirm(`Delete driver "${form.driverName || form.driverId}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteDriver(form.driverId);
      showAlert('🗑️ Driver deleted successfully.', 'success');
      setForm(EMPTY); setIsEditing(false);
      fetchDrivers();
    } catch {
      showAlert('Error deleting driver. They may have linked orders.', 'error');
    } finally { setLoading(false); }
  };

  /* ── Edit row ── */
  const handleEditRow = (driver) => {
    setForm(driver); setIsEditing(true);
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const handleClear = () => { setForm(EMPTY); setIsEditing(false); };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Driver Details</h1>

      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>{alert.msg}</div>
      )}

      {/* ── Form card ── */}
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
              {loading ? <><span className="btn-spinner"/>Saving…</> : '💾 Save'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
              {loading ? <><span className="btn-spinner"/>Updating…</> : '💾 Update'}
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

      {/* ── Drivers table ── */}
      <div className="card" style={{ marginTop:'2rem', padding:0, overflow:'hidden' }}>
        <div className="manage-tbl-header">
          <h2 className="manage-tbl-title">All Drivers — click to edit</h2>
          <span className="manage-count-badge">{drivers.length} drivers</span>
        </div>

        {tblLoading ? (
          <div className="loading-state"><div className="spinner"/><p>Loading…</p></div>
        ) : drivers.length === 0 ? (
          <div className="empty-state" style={{ padding:'3rem' }}>
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
                  <tr key={d.driverId}>
                    <td style={{ fontWeight:800, textAlign:'left' }}>{d.driverName}</td>
                    <td><span className="badge badge-navy">{d.driverId}</span></td>
                    <td>{d.vehicleType || '—'}</td>
                    <td>{d.vehicleNo   || '—'}</td>
                    <td>{d.contactNo   || '—'}</td>
                    <td style={{ textAlign:'left', fontSize:'.85rem', maxWidth:160 }}>{d.address || '—'}</td>
                    <td>
                      <button
                        className="btn btn-edit"
                        style={{ padding:'.35rem .9rem', fontSize:'.82rem' }}
                        onClick={() => handleEditRow(d)}
                      >✏️ Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding:'1rem 1.5rem', display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-secondary"
            onClick={fetchDrivers}>
            👁️ View Full List
          </button>
        </div>
      </div>
    </div>
  );
}