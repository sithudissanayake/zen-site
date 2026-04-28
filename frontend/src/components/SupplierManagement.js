import React, { useState, useEffect } from 'react';
import './SupplierManagement.css';
import axios from 'axios';
import PurchaseOrderReport from './PurchaseOrderReport';
import MonthlyPurchaseReport from './MonthlyPurchaseReport';

const SupplierManagement = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    supplierName: '',
    itemName: '',
    companyName: '',
    email: '',
    contactNumber: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);
  const [showPurchaseReport, setShowPurchaseReport] = useState(false);
  const [selectedSupplierForPO, setSelectedSupplierForPO] = useState(null);

  const API_BASE_URL = 'http://localhost:8080/api';

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Helper function to extract data from response
  const extractDataFromResponse = (response) => {
    console.log('Raw response:', response.data);
    
    if (response.data && response.data.success === true && response.data.data) {
      return response.data.data;
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching suppliers from:', `${API_BASE_URL}/suppliers`);
      const response = await api.get('/suppliers');
      console.log('Response data:', response.data);
      
      const suppliersData = extractDataFromResponse(response);
      console.log('Processed suppliers data:', suppliersData);
      
      setSuppliers(suppliersData);
      
      if (suppliersData.length > 0) {
        setSelectedSupplier(suppliersData[0]);
      } else {
        setSelectedSupplier(null);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please check if the backend is running on http://localhost:8080');
      } else if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
      } else if (err.request) {
        setError('No response from server. Please check if the backend is running.');
      } else {
        setError('Failed to fetch suppliers. Please try again.');
      }
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSupplier = async () => {
    if (!formData.supplierName || !formData.companyName || !formData.email) {
      alert('Please fill required fields: Supplier Name, Company Name, and Email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/suppliers', formData);
      await fetchSuppliers();
      resetForm();
      alert('Supplier added successfully!');
    } catch (err) {
      console.error('Error adding supplier:', err);
      alert('Failed to add supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier to update');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.put(`/suppliers/${selectedSupplier.id}`, formData);
      const updatedData = extractDataFromResponse(response);
      await fetchSuppliers();
      setSelectedSupplier(updatedData);
      setIsEditing(false);
      resetForm();
      alert('Supplier updated successfully!');
    } catch (err) {
      console.error('Error updating supplier:', err);
      alert('Failed to update supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedSupplier.supplierName}?`)) {
      setLoading(true);
      setError('');
      try {
        await api.delete(`/suppliers/${selectedSupplier.id}`);
        await fetchSuppliers();
        setSelectedSupplier(null);
        resetForm();
        alert('Supplier deleted successfully!');
      } catch (err) {
        console.error('Error deleting supplier:', err);
        alert('Failed to delete supplier. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = (keyword) => {
    setSearchTerm(keyword);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(async () => {
      if (keyword.trim()) {
        setLoading(true);
        setError('');
        try {
          const response = await api.get('/suppliers/search', {
            params: { keyword: keyword.trim() }
          });
          
          const searchResults = extractDataFromResponse(response);
          setSuppliers(searchResults);
        } catch (err) {
          console.error('Error searching suppliers:', err);
          setError('Failed to search suppliers. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        fetchSuppliers();
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleEditClick = () => {
    if (selectedSupplier) {
      setFormData({
        supplierName: selectedSupplier.supplierName || '',
        itemName: selectedSupplier.itemName || '',
        companyName: selectedSupplier.companyName || '',
        email: selectedSupplier.email || '',
        contactNumber: selectedSupplier.contactNumber || '',
        address: selectedSupplier.address || ''
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      itemName: '',
      companyName: '',
      email: '',
      contactNumber: '',
      address: ''
    });
    setIsEditing(false);
  };

  // Purchase Order handler
  const handlePurchaseOrder = () => {
    if (!selectedSupplier) {
      alert('Please select a supplier first to create a purchase order');
      return;
    }
    setSelectedSupplierForPO(selectedSupplier);
    setShowPurchaseOrder(true);
  };

  // Close Purchase Order modal
  const closePurchaseOrder = () => {
    setShowPurchaseOrder(false);
    setSelectedSupplierForPO(null);
  };

  // Purchase Report handler - Opens Monthly Purchase Report
  const handlePurchaseReport = () => {
    setShowPurchaseReport(true);
  };

  // Close Purchase Report modal
  const closePurchaseReport = () => {
    setShowPurchaseReport(false);
  };

  

  return (
    <div className="app-container">
      {/* Purchase Order Modal */}
      {showPurchaseOrder && selectedSupplierForPO && (
        <div className="modal-overlay">
          <div className="modal-container large">
            <div className="modal-header">
              <h2>Purchase Order</h2>
              <button className="modal-close" onClick={closePurchaseOrder}>×</button>
            </div>
            <div className="modal-body">
              <PurchaseOrderReport 
                selectedSupplier={selectedSupplierForPO}
                onClose={closePurchaseOrder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Monthly Purchase Report Modal */}
      {showPurchaseReport && (
        <div className="modal-overlay">
          <div className="modal-container extra-large">
            <div className="modal-header">
              <h2>Monthly Purchase Report</h2>
              <button className="modal-close" onClick={closePurchaseReport}>×</button>
            </div>
            <div className="modal-body">
              <MonthlyPurchaseReport onClose={closePurchaseReport} />
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {error && (
          <div className="error-message">
            <span>❌ {error}</span>
            <button onClick={() => fetchSuppliers()}>Retry</button>
          </div>
        )}
        
        <div className="header-section">
          <div className="action-buttons">
            <button 
              className={`action-btn ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
              disabled={loading}
            >
               View Suppliers
            </button>
            <button 
              className={`action-btn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
              disabled={loading}
            >
               Manage
            </button>
            <button 
              className="action-btn" 
              onClick={handlePurchaseOrder} 
              disabled={loading || !selectedSupplier}
              title={!selectedSupplier ? "Please select a supplier first" : "Create Purchase Order"}
            >
               Purchase Order
            </button>
            <button 
              className="action-btn" 
              onClick={handlePurchaseReport} 
              disabled={loading}
            >
               Purchase Report
            </button>
           
          </div>
        </div>

        {activeTab === 'view' && (
          <div className="view-container">
            <div className="search-section">
              <div className="search-box">
                <span className="search-icon"></span>
                <input
                  type="text"
                  placeholder="Search for suppliers..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="refresh-btn"
                  onClick={() => {
                    setSearchTerm('');
                    fetchSuppliers();
                  }}
                  disabled={loading}
                  title="Refresh suppliers list"
                >
                  🔄
                </button>
              </div>
            </div>

            <div className="supplier-view-layout">
              <div className="suppliers-list">
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>Supplier Name</th>
                        <th>Company Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className={selectedSupplier?.id === supplier.id ? 'selected' : ''}
                            onClick={() => setSelectedSupplier(supplier)}
                          >
                            <td>{supplier.supplierName || '-'}</td>
                            <td>{supplier.companyName || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        !loading && (
                          <tr>
                            <td colSpan="2" className="empty-message">
                              No suppliers found. Add a new supplier in Manage tab.
                            </td>
                          </tr>
                        )
                      )}
                      {loading && (
                        <tr>
                          <td colSpan="2" className="loading-message">
                            Loading suppliers...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="supplier-details">
                <h3 className="details-title">Supplier Details</h3>
                {selectedSupplier ? (
                  <div className="details-grid">
                    <div className="detail-card">
                      <label>Supplier Name</label>
                      <p>{selectedSupplier.supplierName || '-'}</p>
                    </div>
                    <div className="detail-card">
                      <label>Item Name</label>
                      <p>{selectedSupplier.itemName || '-'}</p>
                    </div>
                    <div className="detail-card">
                      <label>Company Name</label>
                      <p>{selectedSupplier.companyName || '-'}</p>
                    </div>
                    <div className="detail-card">
                      <label>Email Address</label>
                      <p>{selectedSupplier.email || '-'}</p>
                    </div>
                    <div className="detail-card">
                      <label>Contact Number</label>
                      <p>{selectedSupplier.contactNumber || '-'}</p>
                    </div>
                    <div className="detail-card full-width">
                      <label>Address</label>
                      <p>{selectedSupplier.address || '-'}</p>
                    </div>
                    <div className="detail-card full-width">
                      <button 
                        className="btn-create-po"
                        onClick={handlePurchaseOrder}
                      >
                         Create Purchase Order for {selectedSupplier.supplierName}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-supplier">No supplier selected</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="manage-container">
            <div className="manage-layout">
              <div className="suppliers-list">
                <div className="list-header">
                  <h3 className="section-title">Suppliers List</h3>
                  <button
                    className="refresh-btn-small"
                    onClick={fetchSuppliers}
                    disabled={loading}
                    title="Refresh suppliers list"
                  >
                     Refresh
                  </button>
                </div>
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>Supplier Name</th>
                        <th>Company Name</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <tr key={supplier.id}>
                            <td>{supplier.supplierName || '-'}</td>
                            <td>{supplier.companyName || '-'}</td>
                            <td>
                              <button
                                className="select-btn"
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setFormData({
                                    supplierName: supplier.supplierName || '',
                                    itemName: supplier.itemName || '',
                                    companyName: supplier.companyName || '',
                                    email: supplier.email || '',
                                    contactNumber: supplier.contactNumber || '',
                                    address: supplier.address || ''
                                  });
                                }}
                                disabled={loading}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        !loading && (
                          <tr>
                            <td colSpan="3" className="empty-message">
                              No suppliers found. Add your first supplier using the form.
                            </td>
                          </tr>
                        )
                      )}
                      {loading && (
                        <tr>
                          <td colSpan="3" className="loading-message">
                            Loading suppliers...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="manage-form">
                <h3 className="section-title">
                  {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                
                {selectedSupplier && !isEditing && (
                  <div className="info-message">
                    Selected: <strong>{selectedSupplier.supplierName}</strong>
                    <button className="edit-btn-small" onClick={handleEditClick} disabled={loading}>
                       Edit
                    </button>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Supplier Name *</label>
                    <input
                      type="text"
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      placeholder="Enter supplier name"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Item Name</label>
                    <input
                      type="text"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      placeholder="Enter item name"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      placeholder="Enter contact number"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter address"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  {isEditing ? (
                    <>
                      <button className="btn-save" onClick={handleUpdateSupplier} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn-cancel" onClick={handleCancelEdit} disabled={loading}>
                         Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-add" onClick={handleAddSupplier} disabled={loading}>
                        {loading ? 'Adding...' : ' Add Supplier'}
                      </button>
                      <button className="btn-update" onClick={handleUpdateSupplier} disabled={!selectedSupplier || loading}>
                        {loading ? 'Updating...' : 'Update Supplier'}
                      </button>
                      <button className="btn-delete" onClick={handleDeleteSupplier} disabled={!selectedSupplier || loading}>
                        {loading ? 'Deleting...' : ' Delete Supplier'}
                      </button>
                      <button className="btn-clear" onClick={resetForm} disabled={loading}>
                         Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;