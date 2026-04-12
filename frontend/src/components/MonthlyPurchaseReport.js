import React, { useState, useEffect } from 'react';
import './MonthlyPurchaseReport.css';

const MonthlyPurchaseReport = ({ onClose }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedItem, setSelectedItem] = useState('all');
  const [items, setItems] = useState(['all']);
  const [filteredData, setFilteredData] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [reportSummary, setReportSummary] = useState({
    totalQty: 0,
    totalAmount: 0,
    orderCount: 0
  });
  const [chartData, setChartData] = useState([]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2023, 2024, 2025, 2026, 2027, 2028];

  const chartColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/purchase-orders');
      const data = await response.json();
      let ordersData = [];
      if (data.success && Array.isArray(data.data)) {
        ordersData = data.data;
      } else if (Array.isArray(data)) {
        ordersData = data;
      }
      setPurchaseOrders(ordersData);
      const uniqueItems = [...new Set(ordersData.map(order => order.itemName).filter(Boolean))];
      setItems(['all', ...uniqueItems]);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    let filtered = [...purchaseOrders];
    
    filtered = filtered.filter(order => {
      if (!order.date) return false;
      const orderDate = new Date(order.date);
      return orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
    });
    
    if (selectedItem !== 'all') {
      filtered = filtered.filter(order => order.itemName === selectedItem);
    }
    
    const totalQty = filtered.reduce((sum, order) => sum + (order.quantity || 0), 0);
    const totalAmount = filtered.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const supplierMap = new Map();
    filtered.forEach(order => {
      const supplier = order.supplierCompany || 'Unknown';
      const amount = order.totalAmount || 0;
      supplierMap.set(supplier, (supplierMap.get(supplier) || 0) + amount);
    });
    
    setChartData(Array.from(supplierMap.entries()).map(([name, value]) => ({ name, value })));
    setFilteredData(filtered);
    setReportSummary({ totalQty, totalAmount, orderCount: filtered.length });
    setShowReport(true);
  };

  const PieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -90;
    
    const getCoordinates = (angle, radius) => {
      const radian = (angle * Math.PI) / 180;
      return { x: 150 + radius * Math.cos(radian), y: 150 + radius * Math.sin(radian) };
    };
    
    return (
      <div className="pie-chart-container">
        <h3>Purchase Distribution by Supplier</h3>
        <div className="pie-chart-wrapper">
          <svg width="350" height="350" viewBox="0 0 350 350">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const endAngle = startAngle + angle;
              const start = getCoordinates(startAngle, 120);
              const end = getCoordinates(endAngle, 120);
              const largeArcFlag = angle > 180 ? 1 : 0;
              const pathData = `M 150 150 L ${start.x} ${start.y} A 120 120 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
              const pathElement = <path key={index} d={pathData} fill={chartColors[index % chartColors.length]} stroke="white" strokeWidth="2" />;
              startAngle = endAngle;
              return pathElement;
            })}
            <circle cx="150" cy="150" r="60" fill="white" />
            <text x="150" y="145" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">Total</text>
            <text x="150" y="165" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#10b981">Rs. {total.toLocaleString()}</text>
          </svg>
          <div className="pie-chart-legend">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: chartColors[index % chartColors.length] }}></div>
                  <div className="legend-text"><strong>{item.name}</strong><span>Rs. {item.value.toLocaleString()} ({percentage}%)</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -90;
    let pieChartPaths = '';
    
    chartData.forEach((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const endAngle = startAngle + angle;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const startX = 150 + 120 * Math.cos(startRad);
      const startY = 150 + 120 * Math.sin(startRad);
      const endX = 150 + 120 * Math.cos(endRad);
      const endY = 150 + 120 * Math.sin(endRad);
      const largeArcFlag = angle > 180 ? 1 : 0;
      pieChartPaths += `<path d="M 150 150 L ${startX} ${startY} A 120 120 0 ${largeArcFlag} 1 ${endX} ${endY} Z" fill="${chartColors[index % chartColors.length]}" stroke="white" stroke-width="2"/>`;
      startAngle = endAngle;
    });
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Monthly Purchase Report - ${months[selectedMonth]} ${selectedYear}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Arial', sans-serif; padding: 40px; background: white; }
          .report-container { max-width: 1200px; margin: 0 auto; }
          .logo-section { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
          .logo-image { max-width: 150px; height: auto; margin-bottom: 10px; }
          .logo-text { font-size: 24px; font-weight: bold; color: #1e293b; }
          .logo-tagline { font-size: 12px; color: #64748b; }
          .report-header h1 { text-align: center; font-size: 28px; color: #1e293b; margin-bottom: 20px; }
          .filter-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 30px; flex-wrap: wrap; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          td { text-align: center; }
          .total-row { background: #f0f0f0; font-weight: bold; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .summary { margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; display: flex; justify-content: space-between; flex-wrap: wrap; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
          .pie-chart-section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 10px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .pie-chart-section h3 { text-align: center; margin-bottom: 20px; }
          .pie-chart-wrapper { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 40px; }
          .pie-chart-legend { display: flex; flex-direction: column; gap: 10px; }
          .legend-item { display: flex; align-items: center; gap: 10px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .legend-color { width: 20px; height: 20px; border-radius: 4px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          svg { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          svg path { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @media print { body { padding: 20px; } }
        </style>
        </head>
        <body>
          <div class="report-container">
            <div class="logo-section">
              <img src="/zen.jpg" alt="Zenvora Logo" class="logo-image" />
              <div class="logo-text">ZENVORA</div>
              <div class="logo-tagline">Trading & Industries (Pvt) Ltd</div>
            </div>
            <div class="report-header"><h1>MONTHLY PURCHASE REPORT</h1></div>
            <div class="filter-info"><p><strong>Month:</strong> ${months[selectedMonth]}</p><p><strong>Year:</strong> ${selectedYear}</p><p><strong>Item:</strong> ${selectedItem === 'all' ? 'All Items' : selectedItem}</p></div>
            ${chartData.length > 0 ? `<div class="pie-chart-section"><h3>Purchase Distribution by Supplier</h3><div class="pie-chart-wrapper"><svg width="350" height="350" viewBox="0 0 350 350">${pieChartPaths}<circle cx="150" cy="150" r="60" fill="white" /><text x="150" y="145" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">Total</text><text x="150" y="165" text-anchor="middle" font-size="16" font-weight="bold" fill="#10b981">Rs. ${total.toLocaleString()}</text></svg><div class="pie-chart-legend">${chartData.map((item, index) => { const percentage = ((item.value / total) * 100).toFixed(1); return `<div class="legend-item"><div class="legend-color" style="background-color: ${chartColors[index % chartColors.length]}"></div><div class="legend-text"><strong>${item.name}</strong><span>Rs. ${item.value.toLocaleString()} (${percentage}%)</span></div></div>`; }).join('')}</div></div></div>` : ''}
            <table><thead><tr><th>PO No</th><th>Date</th><th>Supplier Company</th><th>Qty</th><th>Amount (Rs)</th></tr></thead><tbody>${filteredData.map(order => `<tr><td>${order.poNumber || '-'}</td><td>${order.date ? new Date(order.date).toLocaleDateString('en-GB') : '-'}</td><td>${order.supplierCompany || '-'}</td><td>${order.quantity || 0}</td><td>${(order.totalAmount || 0).toLocaleString()}.00</td></tr>`).join('')}</tbody>
            ${filteredData.length > 0 ? `<tfoot><tr class="total-row"><td colspan="3"><strong>Total</strong></td><td><strong>${reportSummary.totalQty}</strong></td><td><strong>${reportSummary.totalAmount.toLocaleString()}.00</strong></td></tr></tfoot>` : ''}</table>
            <div class="summary"><span>Total Orders: ${reportSummary.orderCount}</span><span>Total Quantity: ${reportSummary.totalQty}</span><span>Total Amount: Rs. ${reportSummary.totalAmount.toLocaleString()}.00</span></div>
            <div class="footer"><p>Generated by Zenvora Inventory System | ${new Date().toLocaleString()}</p></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="monthly-report-container">
      <div className="report-header no-print">
        <h1>Monthly Purchase Report</h1>
        <div className="header-buttons">
          {showReport && <button className="btn-print" onClick={handlePrint}>🖨️ Print Report</button>}
          {onClose && <button className="btn-close-modal" onClick={onClose}>✕ Close</button>}
        </div>
      </div>

      <div className="filter-section no-print">
        <div className="filter-row">
          <div className="filter-group"><label>Month</label><select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select></div>
          <div className="filter-group"><label>Year</label><select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div className="filter-group"><label>Item</label><select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>{items.map(item => <option key={item} value={item}>{item === 'all' ? 'All Items' : item}</option>)}</select></div>
          <div className="filter-group"><button className="btn-generate" onClick={generateReport}>Generate Report</button></div>
        </div>
      </div>

      {showReport && (
        <div className="report-view-section">
          <div className="company-header">
            <img src="/zen.jpg" alt="Zenvora Logo" className="company-logo" />
            <div className="company-name">ZENVORA</div>
            <div className="company-tagline">Trading & Industries (Pvt) Ltd</div>
          </div>
          <div className="report-title"><h2>MONTHLY PURCHASE REPORT</h2></div>
          <div className="report-details"><span><strong>Month:</strong> {months[selectedMonth]}</span><span><strong>Year:</strong> {selectedYear}</span><span><strong>Item:</strong> {selectedItem === 'all' ? 'All Items' : selectedItem}</span></div>
          {chartData.length > 0 && <PieChart data={chartData} />}
          <div className="table-wrapper"><table className="data-table"><thead><tr><th>PO No</th><th>Date</th><th>Supplier Company</th><th>Qty</th><th>Amount (Rs)</th></tr></thead><tbody>{filteredData.map((order, i) => <tr key={i}><td>{order.poNumber || '-'}</td><td>{order.date ? new Date(order.date).toLocaleDateString('en-GB') : '-'}</td><td>{order.supplierCompany || '-'}</td><td>{order.quantity || 0}</td><td>{order.totalAmount?.toLocaleString() || '0'}.00</td></tr>)}</tbody>{filteredData.length > 0 && <tfoot><tr className="total-row"><td colSpan="3" style={{ textAlign: 'right' }}><strong>Total</strong></td><td><strong>{reportSummary.totalQty}</strong></td><td><strong>Rs. {reportSummary.totalAmount.toLocaleString()}.00</strong></td></tr></tfoot>}</table></div>
          <div className="summary-section"><div className="summary-item">Total Orders: {reportSummary.orderCount}</div><div className="summary-item">Total Quantity: {reportSummary.totalQty}</div><div className="summary-item">Total Amount: Rs. {reportSummary.totalAmount.toLocaleString()}.00</div></div>
          <div className="report-footer"><p>Generated on: {new Date().toLocaleString()}</p></div>
        </div>
      )}

      {!showReport && !loading && <div className="empty-state"><p>Select month, year, and item, then click "Generate Report"</p></div>}
      {loading && <div className="loading-state"><div className="spinner"></div><p>Loading purchase orders...</p></div>}
    </div>
  );
};

export default MonthlyPurchaseReport;