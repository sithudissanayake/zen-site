import React, { useState, useEffect } from 'react';
import './PurchaseOrderReport.css';

const PurchaseOrderReport = ({ onClose }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([
    { id: 1, itemName: '', unit: 'Nos.', quantity: '', discount: '', amount: '' }
  ]);
  const [purchaseOrder, setPurchaseOrder] = useState({
    poNumber: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: '',
  });

  useEffect(() => {
    fetchSuppliers();
    generatePONumber();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/suppliers');
      const data = await response.json();
      let suppliersData = [];
      if (data.success && Array.isArray(data.data)) {
        suppliersData = data.data;
      } else if (Array.isArray(data)) {
        suppliersData = data;
      }
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('Error fetching suppliers. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const generatePONumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setPurchaseOrder(prev => ({
      ...prev,
      poNumber: `PO-${year}${month}-${random}`
    }));
  };

  const handleSupplierSelect = (e) => {
    const supplierId = parseInt(e.target.value);
    const supplier = suppliers.find(s => s.id === supplierId);
    setSelectedSupplier(supplier);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { 
        id: Date.now(), 
        itemName: '', 
        unit: 'Nos.', 
        quantity: '', 
        discount: '', 
        amount: '' 
      }
    ]);
  };

  const removeItemRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const amount = parseFloat(item.amount) || 0;
      const discount = parseFloat(item.discount) || 0;
      const discountedAmount = amount - (amount * discount / 100);
      return total + (quantity * discountedAmount);
    }, 0);
  };

  // Save Purchase Order to Database
  const savePurchaseOrder = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier');
      return false;
    }

    const totalAmount = calculateTotal();
    const validItems = items.filter(item => item.itemName && item.quantity && item.amount);
    
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return false;
    }

    setSaving(true);

    const purchaseOrderData = {
      poNumber: purchaseOrder.poNumber,
      date: purchaseOrder.date,
      supplierName: selectedSupplier.supplierName,
      supplierCompany: selectedSupplier.companyName,
      supplierAddress: selectedSupplier.address || '',
      supplierPhone: selectedSupplier.contactNumber || '',
      supplierEmail: selectedSupplier.email || '',
      itemName: validItems.map(item => item.itemName).join(', '),
      unit: validItems[0].unit,
      quantity: validItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
      discount: parseFloat(validItems[0].discount) || 0,
      unitPrice: parseFloat(validItems[0].amount) || 0,
      totalAmount: totalAmount,
      deliveryDate: purchaseOrder.deliveryDate,
      preparedBy: 'System',
      approvedBy: 'System'
    };

    try {
      const response = await fetch('http://localhost:8080/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseOrderData)
      });

      const data = await response.json();
      if (data.success) {
        console.log('Purchase order saved successfully:', data.data);
        return true;
      } else {
        console.error('Failed to save purchase order:', data.message);
        alert('Failed to save purchase order: ' + data.message);
        return false;
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Error saving purchase order. Please check if backend is running on port 8080');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    // Save to database first
    const saved = await savePurchaseOrder();
    if (!saved) {
      if (!window.confirm('Failed to save purchase order. Do you want to print anyway?')) {
        return;
      }
    }
    
    const printWindow = window.open('', '_blank');
    const totalAmount = calculateTotal();
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '__________';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB');
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order - ${purchaseOrder.poNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; padding: 40px; background: white; }
            .po-container { max-width: 1000px; margin: 0 auto; }
            .logo-section { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
            .logo-icon { font-size: 48px; margin-bottom: 10px; }
            .logo-text { font-size: 24px; font-weight: bold; color: #1e293b; }
            .logo-tagline { font-size: 12px; color: #64748b; }
            .supplier-box { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background: #f9fafb; }
            .supplier-info, .po-info { width: 48%; }
            .supplier-info p, .po-info p { margin: 8px 0; font-size: 14px; }
            .supplier-info strong, .po-info strong { width: 80px; display: inline-block; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            td { text-align: center; }
            td:first-child, td:nth-child(2) { text-align: left; }
            .delivery-date { margin: 20px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f9f9f9; }
            .total-section { text-align: right; margin: 20px 0; padding: 15px; border-top: 2px solid #000; }
            .total-label { font-size: 18px; font-weight: bold; margin-right: 20px; }
            .total-value { font-size: 20px; font-weight: bold; color: #10b981; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .signature-line { text-align: center; width: 250px; }
            .signature-line p { margin-bottom: 10px; font-weight: bold; }
            .line { border-top: 1px solid #000; width: 100%; margin-bottom: 10px; }
            .print-footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="po-container">
            <div class="logo-section">
              <div class="logo-icon">⚡</div>
              <div class="logo-text">ZENVORA</div>
              <div class="logo-tagline">Trading & Industries (Pvt) Ltd</div>
            </div>
            
            <div class="supplier-box">
              <div class="supplier-info">
                <p><strong>Supplier:</strong> ${selectedSupplier?.supplierName || ''}</p>
                <p><strong>Company:</strong> ${selectedSupplier?.companyName || ''}</p>
                <p><strong>Address:</strong> ${selectedSupplier?.address || ''}</p>
                <p><strong>Phone:</strong> ${selectedSupplier?.contactNumber || ''}</p>
                <p><strong>Email:</strong> ${selectedSupplier?.email || ''}</p>
              </div>
              <div class="po-info">
                <p><strong>Date:</strong> ${formatDate(purchaseOrder.date)}</p>
                <p><strong>PO No:</strong> ${purchaseOrder.poNumber}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr><th>No</th><th>Item</th><th>Unit</th><th>Qty</th><th>Disc.%</th><th>Amount (Rs)</th></tr>
              </thead>
              <tbody>
                ${items.filter(item => item.itemName).map((item, index) => {
                  const quantity = parseFloat(item.quantity) || 0;
                  const amount = parseFloat(item.amount) || 0;
                  const discount = parseFloat(item.discount) || 0;
                  const discountedAmount = amount - (amount * discount / 100);
                  const total = quantity * discountedAmount;
                  return `<tr><td>${index + 1}</td><td>${item.itemName}</td><td>${item.unit}</td><td>${quantity}</td><td>${discount}%</td><td>${total.toFixed(2)}</td></tr>`;
                }).join('')}
              </tbody>
            </table>

            <div class="delivery-date"><p><strong>Delivery Date:</strong> ${formatDate(purchaseOrder.deliveryDate)}</p></div>
            <div class="total-section"><span class="total-label">Total Amount (Rs):</span><span class="total-value">${totalAmount.toFixed(2)}</span></div>
            <div class="signatures"><div class="signature-line"><div class="line"></div><p>Prepared By</p></div><div class="signature-line"><div class="line"></div><p>Approved By</p></div></div>
            <div class="print-footer"><p>Generated by Zenvora Inventory System</p></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    
    if (saved) {
      alert('Purchase order saved and printed successfully!');
      if (onClose) onClose();
    }
  };

  const totalAmount = calculateTotal();

  return (
    <div className="purchase-order-container">
      <div className="po-header no-print">
        <div className="header-buttons">
          <button className="btn-print" onClick={handlePrint} disabled={saving}>
            {saving ? 'Saving...' : '🖨️ Save & Print'}
          </button>
          {onClose && <button className="btn-close-modal" onClick={onClose}>✕ Close</button>}
        </div>
      </div>

      <div className="company-logo-section">
        <div className="logo-icon">⚡</div>
        <div className="company-name">ZENVORA</div>
        <div className="company-tagline">Trading & Industries (Pvt) Ltd</div>
      </div>

      <div className="screen-view">
        <div className="supplier-section no-print">
          <label>Select Supplier:</label>
          <select onChange={handleSupplierSelect} className="supplier-select" value={selectedSupplier?.id || ''}>
            <option value="">-- Select Supplier --</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.supplierName} - {supplier.companyName}</option>
            ))}
          </select>
          {loading && <span>Loading suppliers...</span>}
        </div>

        {selectedSupplier && (
          <>
            <div className="supplier-details">
              <div className="supplier-info">
                <p><strong>Supplier:</strong> {selectedSupplier.supplierName}</p>
                <p><strong>Company:</strong> {selectedSupplier.companyName}</p>
                {selectedSupplier.address && <p><strong>Address:</strong> {selectedSupplier.address}</p>}
                {selectedSupplier.contactNumber && <p><strong>Phone:</strong> {selectedSupplier.contactNumber}</p>}
                {selectedSupplier.email && <p><strong>Email:</strong> {selectedSupplier.email}</p>}
              </div>
              <div className="po-info">
                <p><strong>Date:</strong> <input type="date" value={purchaseOrder.date} onChange={(e) => setPurchaseOrder({...purchaseOrder, date: e.target.value})} className="po-input" /></p>
                <p><strong>PO No:</strong> <input type="text" value={purchaseOrder.poNumber} onChange={(e) => setPurchaseOrder({...purchaseOrder, poNumber: e.target.value})} className="po-input" /></p>
              </div>
            </div>

            <table className="items-table">
              <thead><tr><th>No</th><th>Item</th><th>Unit</th><th>Qty</th><th>Disc.%</th><th>Amount (Rs)</th><th>Action</th></tr></thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td><input type="text" value={item.itemName} onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)} placeholder="Item name" /></td>
                    <td><select value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}><option value="Nos.">Nos.</option><option value="Pcs">Pcs</option><option value="Box">Box</option><option value="Roll">Roll</option><option value="Meter">Meter</option></select></td>
                    <td><input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} placeholder="Qty" /></td>
                    <td><input type="number" value={item.discount} onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)} placeholder="%" /></td>
                    <td><input type="number" value={item.amount} onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)} placeholder="Price" /></td>
                    <td><button className="btn-remove" onClick={() => removeItemRow(item.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-item-row"><button className="btn-add-item" onClick={addItemRow}>+ Add Item</button></div>
            <div className="delivery-date"><p><strong>Delivery Date:</strong> <input type="date" value={purchaseOrder.deliveryDate} onChange={(e) => setPurchaseOrder({...purchaseOrder, deliveryDate: e.target.value})} /></p></div>
            <div className="total-section"><div className="total-row"><span className="total-label">Total Amount (Rs):</span><span className="total-value">{totalAmount.toFixed(2)}</span></div></div>
            <div className="signatures"><div className="signature-line"><div className="line"></div><p>Prepared By</p></div><div className="signature-line"><div className="line"></div><p>Approved By</p></div></div>
          </>
        )}

        {!selectedSupplier && !loading && <div className="no-supplier-message"><p>Please select a supplier to create purchase order</p></div>}
      </div>
    </div>
  );
};

export default PurchaseOrderReport;