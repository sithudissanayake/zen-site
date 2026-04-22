import React, { useState, useEffect, useCallback } from 'react';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topProducts, setTopProducts] = useState([]);
  const productsPerPage = 5;

  // Low Stock Alert States
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [lowStockThreshold] = useState(20);
  const [showAlert, setShowAlert] = useState(true);

  // Stock Report states
  const [reportCategory, setReportCategory] = useState('all');
  const [reportSortBy, setReportSortBy] = useState('stock');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manufactured_country: '',
    brand: '',
    price: '',
    stock: '',
    photo: '',
    category: ''
  });

  const API_URL = 'http://localhost:8080';

  // Helper functions for low stock
  const getLowStockCount = () => {
    return products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= lowStockThreshold).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => (p.stock || 0) === 0).length;
  };

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/products/all`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.success === true) {
        let productsArray = data.data || [];
        
        // Filter by search term
        if (searchTerm) {
          productsArray = productsArray.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        // Apply low stock filter if enabled
        if (showLowStockOnly) {
          productsArray = productsArray.filter(p => 
            (p.stock || 0) > 0 && (p.stock || 0) <= lowStockThreshold
          );
        }
        
        // Pagination
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = productsArray.slice(startIndex, endIndex);
        
        setProducts(paginatedProducts);
        setTotalPages(Math.ceil(productsArray.length / productsPerPage));
        
        // Get top 5 products by stock
        const sortedByStock = [...productsArray].sort((a, b) => (b.stock || 0) - (a.stock || 0));
        setTopProducts(sortedByStock.slice(0, 5));
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, showLowStockOnly]);

  // Fetch report data
  const fetchReportData = async () => {
    setGeneratingReport(true);
    
    try {
      const response = await fetch(`${API_URL}/api/products/all`);
      const data = await response.json();
      
      if (data && data.success === true) {
        let reportProducts = data.data || [];
        
        if (reportCategory !== 'all') {
          reportProducts = reportProducts.filter(p => p.category === reportCategory);
        }
        
        if (reportSortBy === 'stock') {
          reportProducts = [...reportProducts].sort((a, b) => (b.stock || 0) - (a.stock || 0));
        } else {
          reportProducts = [...reportProducts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        
        const categoryStockMap = {};
        reportProducts.forEach(product => {
          const cat = product.category || 'Uncategorized';
          categoryStockMap[cat] = (categoryStockMap[cat] || 0) + (product.stock || 0);
        });
        
        const maxStock = Math.max(...Object.values(categoryStockMap), 1);
        
        setReportData({
          products: reportProducts,
          category: reportCategory,
          sortBy: reportSortBy,
          generatedAt: new Date().toISOString(),
          totalProducts: reportProducts.length,
          totalStock: reportProducts.reduce((sum, p) => sum + (p.stock || 0), 0),
          totalValue: reportProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0),
          lowStockCount: reportProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 20).length,
          outOfStockCount: reportProducts.filter(p => (p.stock || 0) === 0).length,
          categoryStockMap: categoryStockMap,
          maxStock: maxStock
        });
        
        setShowReport(true);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const closeReport = () => {
    setShowReport(false);
    setReportData(null);
  };

  const downloadPDFReport = () => {
    if (!reportData) {
      alert('Please view the report first before downloading PDF.');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    const logoUrl = '/zen.jpg';
    const maxStockValue = Math.max(...Object.values(reportData.categoryStockMap), 1);
    const categories = Object.entries(reportData.categoryStockMap);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Count Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 30px; }
          .header { background: #1e3c72; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }
          .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 20px; }
          .card { background: #f0f0f0; padding: 15px; text-align: center; border-radius: 8px; }
          .card-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #4f46e5; color: white; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ZENVORA</h1>
          <p>Stock Count Report</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="summary">
          <div class="card"><div class="card-value">${reportData.totalProducts}</div><div>Total Products</div></div>
          <div class="card"><div class="card-value">${reportData.totalStock}</div><div>Total Stock</div></div>
          <div class="card"><div class="card-value">Rs. ${reportData.totalValue.toFixed(2)}</div><div>Total Value</div></div>
          <div class="card"><div class="card-value">${reportData.lowStockCount}</div><div>Low Stock</div></div>
          <div class="card"><div class="card-value">${reportData.outOfStockCount}</div><div>Out of Stock</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Product Name</th><th>Category</th><th>Stock</th><th>Price</th></tr></thead>
          <tbody>
            ${reportData.products.map((p, i) => `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.category || '-'}</td><td>${p.stock}</td><td>Rs. ${p.price}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">Generated by Zenvora Inventory System</div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Image upload handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    processImageFile(file);
  };

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData(prev => ({
        ...prev,
        photo: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setIsEditing(false);
    setIsAdding(false);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
      setImageFile(null);
    }
  };

  const handleAddProduct = () => {
    setIsAdding(true);
    setIsEditing(false);
    setSelectedProduct(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
      setImageFile(null);
    }
    setFormData({
      name: '',
      description: '',
      manufactured_country: '',
      brand: '',
      price: '',
      stock: '',
      photo: '',
      category: ''
    });
  };

  const handleEditProduct = () => {
    if (selectedProduct) {
      setIsEditing(true);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview('');
        setImageFile(null);
      }
      setFormData({
        id: selectedProduct.id,
        name: selectedProduct.name,
        description: selectedProduct.description || '',
        manufactured_country: selectedProduct.manufactured_country || '',
        brand: selectedProduct.brand || '',
        price: selectedProduct.price,
        stock: selectedProduct.stock,
        photo: selectedProduct.photo || '',
        category: selectedProduct.category || ''
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct && window.confirm(`Are you sure you want to delete ${selectedProduct.name}?`)) {
      try {
        const response = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success === true) {
          alert('Product deleted successfully!');
          setSelectedProduct(null);
          fetchProducts();
        } else {
          alert('Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : name === 'stock' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (isAdding) {
        const { id, ...productData } = formData;
        response = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else {
        response = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      
      const data = await response.json();
      
      if (data.success === true) {
        alert(isAdding ? 'Product added successfully!' : 'Product updated successfully!');
        setIsAdding(false);
        setIsEditing(false);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview('');
          setImageFile(null);
        }
        fetchProducts();
      } else {
        alert('Error saving product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const cancelForm = () => {
    setIsAdding(false);
    setIsEditing(false);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
      setImageFile(null);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (stock) => {
    if (stock === 0) return '#ef4444';
    if (stock < 20) return '#f59e0b';
    if (stock > 100) return '#10b981';
    return '#3b82f6';
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const lowStockCount = getLowStockCount();
  const outOfStockCount = getOutOfStockCount();

  return (
    <div className="main-container">
      {/* Report Modal */}
      {showReport && reportData && (
        <div className="report-modal-overlay">
          <div className="report-modal-content">
            <div className="report-modal-header">
              <h2>Stock Count Report</h2>
              <button className="close-report-btn" onClick={closeReport}>×</button>
            </div>
            <div className="report-content">
              <div className="report-header">
                <h3>STOCK COUNT REPORT</h3>
                <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
              </div>
              <div className="report-summary-cards">
                <div className="report-card"><div className="report-card-title">Total Products</div><div className="report-card-value">{reportData.totalProducts}</div></div>
                <div className="report-card"><div className="report-card-title">Total Stock</div><div className="report-card-value">{reportData.totalStock}</div></div>
                <div className="report-card"><div className="report-card-title">Total Value</div><div className="report-card-value">Rs. {reportData.totalValue.toFixed(2)}</div></div>
                <div className="report-card"><div className="report-card-value" style={{ color: '#f59e0b' }}>{reportData.lowStockCount}</div><div className="report-card-title">Low Stock</div></div>
                <div className="report-card"><div className="report-card-value" style={{ color: '#ef4444' }}>{reportData.outOfStockCount}</div><div className="report-card-title">Out of Stock</div></div>
              </div>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead><tr><th>#</th><th>Product Name</th><th>Category</th><th>Stock</th><th>Price</th></tr></thead>
                  <tbody>
                    {reportData.products.map((product, index) => (
                      <tr key={product.id}>
                        <td>{index + 1}</td>
                        <td>{product.name}</td>
                        <td>{product.category || '-'}</td>
                        <td><span className="stock-badge" style={{ backgroundColor: getStatusColor(product.stock) }}>{product.stock}</span></td>
                        <td>Rs. {(product.price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="report-modal-footer">
              <button className="download-pdf-btn" onClick={downloadPDFReport}>Download PDF</button>
              <button className="close-report-btn-bottom" onClick={closeReport}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="top-selling-panel">
          <h3>Stock Count Report</h3>
          
          {/* SIMPLE ALERT BOX - ONE CLEAN BOX AT THE TOP */}
          {(lowStockCount > 0 || outOfStockCount > 0) && showAlert && (
            <div style={{
              background: '#fef3c7',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span style={{ fontWeight: '500', color: '#92400e' }}>
                  {outOfStockCount > 0 && `${outOfStockCount} out of stock, `}
                  {lowStockCount > 0 && `${lowStockCount} products low on stock`}
                </span>
                <button 
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showLowStockOnly ? 'Show All' : 'View Low Stock'}
                </button>
              </div>
              <button 
                onClick={() => setShowAlert(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#92400e' }}
              >
                ×
              </button>
            </div>
          )}
          
          <div className="date-range">
            <div className="date-input">
              <label>Category:</label>
              <select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)} className="date-picker">
                <option value="all">All Categories</option>
                <option value="Switches">Switches</option>
                <option value="Cables">Cables</option>
                <option value="Sockets">Sockets</option>
                <option value="General">General</option>
              </select>
            </div>
            
            <div className="date-input">
              <label>Sort by:</label>
              <select value={reportSortBy} onChange={(e) => setReportSortBy(e.target.value)} className="date-picker">
                <option value="stock">Stock Level (Highest First)</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
          
          <div className="report-buttons">
            <button className="view-report-btn" onClick={fetchReportData} disabled={generatingReport}>
              {generatingReport ? 'Loading...' : 'View Report'}
            </button>
            <button className="download-report-btn" onClick={downloadPDFReport} disabled={generatingReport}>
              Download PDF
            </button>
          </div>
          
          <h4>Top Stocked Products</h4>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : topProducts.length > 0 ? (
            topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="top-product-item">
                <span className="top-rank">{index + 1}.</span>
                <span className="top-product-name">{product.name}</span>
                <span className="top-product-sales" style={{ color: getStatusColor(product.stock) }}>
                  Stock: {product.stock}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">No products available</div>
          )}
        </div>

        <div className="products-panel">
          <div className="search-bar">
            <input type="text" placeholder="Search by product name..." value={searchTerm} onChange={handleSearch} />
            <button className="view-products-btn" onClick={() => fetchProducts()}>View products</button>
          </div>

          <div className="product-list">
            {loading ? (
              <div className="loading">Loading products...</div>
            ) : products.length > 0 ? (
              products.map(product => (
                <div 
                  key={product.id} 
                  className={`product-item ${selectedProduct?.id === product.id ? 'active' : ''}`} 
                  onClick={() => handleSelectProduct(product)}
                  style={{
                    borderLeft: (product.stock <= 20 && product.stock > 0) ? '3px solid #f59e0b' : 
                               (product.stock === 0) ? '3px solid #ef4444' : 'none'
                  }}
                >
                  <img src={product.photo || 'https://via.placeholder.com/150'} alt={product.name} className="product-thumb" />
                  <div className="product-info">
                    <div className="product-id">{product.id}</div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">RS. {product.price?.toFixed(2)}</div>
                    <div className="product-stock" style={{ color: getStatusColor(product.stock) }}>
                      Stock: {product.stock}
                      {product.stock <= 20 && product.stock > 0 && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f59e0b' }}>⚠️ Low</span>}
                      {product.stock === 0 && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#ef4444' }}>❌ Out</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                {showLowStockOnly ? 'No low stock products' : 'No products found'}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </div>
      </div>

      <div className="details-panel">
        {isAdding || isEditing ? (
          <div className="product-form-container">
            <h2>{isAdding ? 'Add New Product' : 'Edit Product'}</h2>
            <form onSubmit={handleSubmitForm} className="product-form">
              <div className="form-group">
                <label>Product Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Category:</label>
                <select name="category" value={formData.category} onChange={handleFormChange}>
                  <option value="">Select Category</option>
                  <option value="Switches">Switches</option>
                  <option value="Cables">Cables</option>
                  <option value="Sockets">Sockets</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" />
              </div>
              <div className="form-group">
                <label>Manufactured Country:</label>
                <input type="text" name="manufactured_country" value={formData.manufactured_country} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Brand:</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Price (RS):</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Stock:</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleFormChange} required />
              </div>
              
              <div className="form-group">
                <label>Product Image:</label>
                <div className="drag-drop-area" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById('fileInput').click()} style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9f9f9' }}>
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', marginBottom: '1rem' }} />
                      <p>Click or drag another image</p>
                    </div>
                  ) : formData.photo && !imagePreview ? (
                    <div>
                      <img src={formData.photo} alt="Current" style={{ maxWidth: '200px', maxHeight: '200px', marginBottom: '1rem' }} />
                      <p>Click or drag to change</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📸</div>
                      <p>Drag & drop image here or click</p>
                    </div>
                  )}
                </div>
                <input id="fileInput" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="save-btn">{isAdding ? 'Add Product' : 'Save Changes'}</button>
                <button type="button" onClick={cancelForm} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        ) : selectedProduct ? (
          <div className="product-details">
            <h2>Product Details</h2>
            <div className="details-content">
              <div className="details-photo">
                <img src={selectedProduct.photo || 'https://via.placeholder.com/200'} alt={selectedProduct.name} />
              </div>
              <div className="details-info">
                <p><strong>Product ID:</strong> {selectedProduct.id}</p>
                <p><strong>Product Name:</strong> {selectedProduct.name}</p>
                <p><strong>Category:</strong> {selectedProduct.category || 'Not specified'}</p>
                <p><strong>Description:</strong> {selectedProduct.description || 'No description'}</p>
                <p><strong>Manufactured Country:</strong> {selectedProduct.manufactured_country || 'Not specified'}</p>
                <p><strong>Brand:</strong> {selectedProduct.brand || 'Not specified'}</p>
                <p><strong>Price:</strong> RS. {selectedProduct.price?.toFixed(2)}</p>
                <p><strong>Stock:</strong> 
                  <span style={{ color: getStatusColor(selectedProduct.stock), fontWeight: 'bold' }}>
                    {selectedProduct.stock}
                  </span>
                  {selectedProduct.stock <= 20 && selectedProduct.stock > 0 && <span style={{ marginLeft: '10px', color: '#f59e0b' }}>⚠️ Low Stock!</span>}
                  {selectedProduct.stock === 0 && <span style={{ marginLeft: '10px', color: '#ef4444' }}>❌ Out of Stock!</span>}
                </p>
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={handleAddProduct} className="add-btn">ADD</button>
              <button onClick={handleEditProduct} className="edit-btn">Edit</button>
              <button onClick={handleDeleteProduct} className="delete-btn">Delete</button>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <p>Select a product to view details</p>
            <button onClick={handleAddProduct} className="add-btn" style={{ marginTop: '1rem' }}>Add New Product</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsManagement;