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

  // Stock Report states
  const [reportCategory, setReportCategory] = useState('all');
  const [reportSortBy, setReportSortBy] = useState('stock');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Image upload states
  // eslint-disable-next-line no-unused-vars
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

  // Fetch products from backend
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/products/all`;
      
      console.log('Fetching products from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Products response:', data);
      
      if (data && data.success === true) {
        let productsArray = data.data || [];
        
        // Filter by search term
        if (searchTerm) {
          productsArray = productsArray.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        console.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error connecting to backend. Make sure backend is running on port 8080');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  // Fetch report data
  const fetchReportData = async () => {
    console.log('=== FETCHING REPORT DATA ===');
    setGeneratingReport(true);
    
    try {
      const response = await fetch(`${API_URL}/api/products/all`);
      const data = await response.json();
      
      if (data && data.success === true) {
        let reportProducts = data.data || [];
        
        // Filter by category
        if (reportCategory !== 'all') {
          reportProducts = reportProducts.filter(p => p.category === reportCategory);
        }
        
        // Sort products
        if (reportSortBy === 'stock') {
          reportProducts = [...reportProducts].sort((a, b) => (b.stock || 0) - (a.stock || 0));
        } else {
          reportProducts = [...reportProducts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        
        // Calculate category stock totals
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
      alert('Error loading report data');
    } finally {
      setGeneratingReport(false);
    }
  };

  const closeReport = () => {
    setShowReport(false);
    setReportData(null);
  };

  // Generate and Download PDF using browser print
  const downloadPDFReport = () => {
    if (!reportData) {
      alert('Please view the report first before downloading PDF.');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    
    // Logo URL - replace with your actual logo path
    const logoUrl = '/zen.jpg'; // Place your logo in public folder or use URL
    
    // Find max stock for scaling
    const maxStockValue = Math.max(...Object.values(reportData.categoryStockMap), 1);
    const categories = Object.entries(reportData.categoryStockMap);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Count Report - Zenvora</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 30px;
            background: white;
            color: #1e293b;
          }
          
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          /* Header with Logo */
          .header {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            color: white;
            padding: 25px 35px;
            border-radius: 12px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .logo {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            object-fit: cover;
          }
          
          .company-info h1 {
            font-size: 28px;
            margin-bottom: 5px;
            font-weight: bold;
          }
          
          .company-info p {
            font-size: 12px;
            opacity: 0.8;
          }
          
          .report-info {
            text-align: right;
          }
          
          .report-info h2 {
            font-size: 20px;
            margin-bottom: 5px;
          }
          
          .report-info p {
            font-size: 11px;
            opacity: 0.8;
          }
          
          /* Summary Cards */
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .card {
            background: #f8fafc;
            padding: 18px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          
          .card-value {
            font-size: 26px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 5px;
          }
          
          .card-title {
            font-size: 12px;
            color: #64748b;
          }
          
          /* Graph Section */
          .graph-section {
            background: #ffffff;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          
          .graph-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 25px;
            color: #1e293b;
            text-align: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #4f46e5;
          }
          
          .graph-wrapper {
            display: flex;
            justify-content: center;
            padding: 20px 0;
          }
          
          .y-axis-container {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            margin-right: 15px;
            text-align: right;
            height: 250px;
          }
          
          .y-axis-label {
            font-size: 11px;
            color: #64748b;
            position: relative;
            line-height: 1;
          }
          
          .bars-container {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 30px;
            min-height: 250px;
          }
          
          .bar-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100px;
          }
          
          .bar-category {
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 10px;
            text-align: center;
          }
          
          .bar-outer {
            height: 220px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            position: relative;
            width: 100%;
          }
          
          .bar {
            width: 65px;
            background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 8px 8px 0 0;
            transition: height 0.3s ease;
            position: relative;
          }
          
          .bar-value {
            position: absolute;
            top: -22px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 11px;
            font-weight: bold;
            color: #4f46e5;
            white-space: nowrap;
          }
          
          .x-axis-label {
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
          }
          
          .graph-legend {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            flex-wrap: wrap;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #475569;
          }
          
          .legend-color {
            width: 14px;
            height: 14px;
            border-radius: 4px;
            background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
          }
          
          /* Table */
          .table-wrapper {
            overflow-x: auto;
            margin-bottom: 25px;
          }
          
          .table-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1e293b;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th {
            background: #4f46e5;
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
          }
          
          td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          .stock-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 11px;
            color: white;
          }
          
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 10px;
          }
          
          @media print {
            body {
              padding: 15px;
            }
            .header {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .bar {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            th {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Header with Logo -->
          <div class="header">
            <div class="header-left">
              <img src="${logoUrl}" alt="Zenvora Logo" class="logo" onerror="this.style.display='none'">
              <div class="company-info">
                <h1>ZENVORA</h1>
                <p>Inventory Management System</p>
              </div>
            </div>
            <div class="report-info">
              <h2>Stock Count Report</h2>
              <p>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
              <p>Category: ${reportData.category === 'all' ? 'All Categories' : reportData.category}</p>
              <p>Sorted by: ${reportData.sortBy === 'stock' ? 'Stock Level (Highest First)' : 'Product Name (A-Z)'}</p>
            </div>
          </div>
          
          <!-- Summary Cards -->
          <div class="summary-grid">
            <div class="card">
              <div class="card-value">${reportData.totalProducts}</div>
              <div class="card-title">Total Products</div>
            </div>
            <div class="card">
              <div class="card-value">${reportData.totalStock}</div>
              <div class="card-title">Total Stock</div>
            </div>
            <div class="card">
              <div class="card-value">Rs. ${reportData.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div class="card-title">Total Value</div>
            </div>
            <div class="card">
              <div class="card-value" style="color: #f59e0b">${reportData.lowStockCount}</div>
              <div class="card-title">Low Stock (&lt;20)</div>
            </div>
            <div class="card">
              <div class="card-value" style="color: #ef4444">${reportData.outOfStockCount}</div>
              <div class="card-title">Out of Stock</div>
            </div>
          </div>
          
          <!-- Bar Graph -->
          <div class="graph-section">
            <div class="graph-title">📊 Stock Distribution by Category</div>
            <div class="graph-wrapper">
              <div class="y-axis-container">
                <div class="y-axis-label">${maxStockValue}</div>
                <div class="y-axis-label">${Math.round(maxStockValue * 0.75)}</div>
                <div class="y-axis-label">${Math.round(maxStockValue * 0.5)}</div>
                <div class="y-axis-label">${Math.round(maxStockValue * 0.25)}</div>
                <div class="y-axis-label">0</div>
              </div>
              <div class="bars-container">
                ${categories.map(([category, stock]) => {
                  const barHeight = Math.max((stock / maxStockValue) * 200, 30);
                  return `
                    <div class="bar-item">
                      <div class="bar-category">${category}</div>
                      <div class="bar-outer">
                        <div class="bar" style="height: ${barHeight}px;">
                          <div class="bar-value">${stock}</div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            <div class="x-axis-label">Product Categories</div>
            <div class="graph-legend">
              ${categories.map(([category]) => `
                <div class="legend-item">
                  <div class="legend-color"></div>
                  <span>${category}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Products Table -->
          <div class="table-wrapper">
            <div class="table-title">📋 Product Details by Category</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Stock</th>
                  <th>Price (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.products.map((product, index) => {
                  let stockColor = '#3b82f6';
                  if (product.stock === 0) stockColor = '#ef4444';
                  else if (product.stock < 20) stockColor = '#f59e0b';
                  else if (product.stock > 100) stockColor = '#10b981';
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${product.id || '-'}</td>
                      <td>${product.name}</td>
                      <td>${product.category || '-'}</td>
                      <td>${product.brand || '-'}</td>
                      <td><span class="stock-badge" style="background: ${stockColor};">${product.stock || 0}</span></td>
                      <td>Rs. ${(product.price || 0).toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>Report generated by Zenvora Inventory System</p>
            <p style="margin-top: 5px;">${new Date().toLocaleString()}</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          };
        </script>
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

  // ✅ FIXED: Handle form submission with auto-generated ID
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (isAdding) {
        // ✅ Remove id field for new products (let backend generate it)
        const { id, ...productData } = formData;
        
        response = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else {
        // ✅ For editing, include the id
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
        alert('Error saving product: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
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

  return (
    <div className="main-container">
      {/* Report Modal Overlay */}
      {showReport && reportData && (
        <div className="report-modal-overlay">
          <div className="report-modal-content">
            <div className="report-modal-header">
              <h2>📊 Stock Count Report</h2>
              <button className="close-report-btn" onClick={closeReport}>×</button>
            </div>
            
            <div className="report-content">
              <div className="report-header">
                <h3>STOCK COUNT REPORT</h3>
                <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
                <p>Category: {reportData.category === 'all' ? 'All Categories' : reportData.category}</p>
                <p>Sorted by: {reportData.sortBy === 'stock' ? 'Stock Level (Highest First)' : 'Product Name (A-Z)'}</p>
              </div>

              <div className="report-summary-cards">
                <div className="report-card">
                  <div className="report-card-title">Total Products</div>
                  <div className="report-card-value">{reportData.totalProducts}</div>
                </div>
                <div className="report-card">
                  <div className="report-card-title">Total Stock</div>
                  <div className="report-card-value">{reportData.totalStock}</div>
                </div>
                <div className="report-card">
                  <div className="report-card-title">Total Value</div>
                  <div className="report-card-value">Rs. {reportData.totalValue.toFixed(2)}</div>
                </div>
                <div className="report-card">
                  <div className="report-card-title">Low Stock</div>
                  <div className="report-card-value" style={{ color: '#f59e0b' }}>{reportData.lowStockCount}</div>
                </div>
                <div className="report-card">
                  <div className="report-card-title">Out of Stock</div>
                  <div className="report-card-value" style={{ color: '#ef4444' }}>{reportData.outOfStockCount}</div>
                </div>
              </div>

              <div className="report-chart-section">
                <h4>Stock Distribution by Category</h4>
                <div className="category-bars">
                  {Object.entries(reportData.categoryStockMap).map(([category, stock]) => {
                    const percentage = (stock / reportData.maxStock) * 100;
                    return (
                      <div key={category} className="category-bar-item">
                        <div className="category-bar-label">{category}</div>
                        <div className="category-bar-container">
                          <div 
                            className="category-bar-fill" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: '#4f46e5'
                            }}
                          >
                            <span className="category-bar-value">{stock}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Stock</th>
                      <th>Price (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.products.map((product, index) => (
                      <tr key={product.id}>
                        <td>{index + 1}</td>
                        <td>{product.name}</td>
                        <td>{product.category || '-'}</td>
                        <td>{product.brand || '-'}</td>
                        <td>
                          <span className="stock-badge" style={{ backgroundColor: getStatusColor(product.stock || 0) }}>
                            {product.stock || 0}
                          </span>
                        </td>
                        <td>Rs. {(product.price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="report-footer">
                <p>Report generated by Zenvora Inventory System</p>
              </div>
            </div>

            <div className="report-modal-footer">
              <button className="download-pdf-btn" onClick={downloadPDFReport}>📄 Download as PDF</button>
              <button className="close-report-btn-bottom" onClick={closeReport}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="top-selling-panel">
          <h3>📊 Stock Count Report</h3>
          
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
              {generatingReport ? 'Loading...' : '👁️ View Report'}
            </button>
            <button className="download-report-btn" onClick={downloadPDFReport} disabled={generatingReport}>
              📄 Download PDF
            </button>
          </div>
          
          <h4>🏆 Top Stocked Products</h4>
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
                <div key={product.id} className={`product-item ${selectedProduct?.id === product.id ? 'active' : ''}`} onClick={() => handleSelectProduct(product)}>
                  <img src={product.photo || 'https://via.placeholder.com/150'} alt={product.name} className="product-thumb" />
                  <div className="product-info">
                    <div className="product-id">{product.id}</div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">RS. {product.price?.toFixed(2)}</div>
                    <div className="product-stock">Stock: {product.stock}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No products found</div>
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
                <select name="category" value={formData.category} onChange={handleFormChange} className="date-picker">
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
                      <p>Click or drag another image to change</p>
                    </div>
                  ) : formData.photo && !imagePreview ? (
                    <div>
                      <img src={formData.photo} alt="Current" style={{ maxWidth: '200px', maxHeight: '200px', marginBottom: '1rem' }} />
                      <p>Click or drag image to change</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📸</div>
                      <p>Drag & drop an image here or click to browse</p>
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
                <p><strong>Stock:</strong> {selectedProduct.stock}</p>
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