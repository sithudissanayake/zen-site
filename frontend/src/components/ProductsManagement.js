/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from 'react';

const CATEGORY_COLORS = {
  Switches: '#378ADD',
  Cables:   '#1D9E75',
  Sockets:  '#D85A30',
  General:  '#EF9F27',
  Uncategorized: '#888780',
};

const getStatusColor = (stock) => {
  if (stock === 0) return '#ef4444';
  if (stock < 20)  return '#f59e0b';
  if (stock > 100) return '#10b981';
  return '#3b82f6';
};

// ─── Bar chart drawn on a <canvas> (no external lib needed) ──────────────────
const StockBarChart = ({ categoryStockMap }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !categoryStockMap) return;
    const ctx = canvas.getContext('2d');
    const entries = Object.entries(categoryStockMap);
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    const W = canvas.width;
    const H = canvas.height;
    const padL = 55, padR = 20, padT = 20, padB = 36;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    ctx.clearRect(0, 0, W, H);

    // grid lines
    const gridLines = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = padT + chartH - (i / gridLines) * chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((i / gridLines) * maxVal).toLocaleString(), padL - 6, y + 4);
    }

    // bars
    const barW = Math.min(70, chartW / entries.length * 0.55);
    const gap   = chartW / entries.length;
    entries.forEach(([cat, val], i) => {
      const x    = padL + gap * i + gap / 2 - barW / 2;
      const barH = (val / maxVal) * chartH;
      const y    = padT + chartH - barH;
      ctx.fillStyle = CATEGORY_COLORS[cat] || '#378ADD';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // value label
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val.toLocaleString(), x + barW / 2, y - 6);

      // x label
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.fillText(cat, x + barW / 2, padT + chartH + 20);
    });
  }, [categoryStockMap]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={220}
      style={{ width: '100%', height: 220 }}
      role="img"
      aria-label="Bar chart showing stock distribution by category"
    />
  );
};

// ─── Stock badge ─────────────────────────────────────────────────────────────
const StockBadge = ({ stock }) => {
  let bg = '#e1f5ee', color = '#085041', label = stock;
  if (stock === 0)       { bg = '#fcebeb'; color = '#791f1f'; }
  else if (stock < 20)   { bg = '#faeeda'; color = '#633806'; }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 500, background: bg, color
    }}>{label}</span>
  );
};

// ─── Report Modal ─────────────────────────────────────────────────────────────
const ReportModal = ({ reportData, onClose, onDownload }) => {
  if (!reportData) return null;

  const categories = Object.entries(reportData.categoryStockMap || {});

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: '24px 16px', overflowY: 'auto'
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 860,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden',
        fontFamily: 'Arial, sans-serif'
      }}>

        {/* ── Modal top bar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb'
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1e3c72' }}>Stock Count Report</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onDownload} style={{
              background: '#1e3c72', color: '#fff', border: 'none',
              padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500
            }}>Download PDF</button>
            <button onClick={onClose} style={{
              background: 'none', border: '1px solid #d1d5db',
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#555'
            }}>×</button>
          </div>
        </div>

        {/* ── Scrollable report body ── */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 64px)' }}>

          {/* Header banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #1a6fa8 100%)',
            borderRadius: 10, padding: '22px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 18, position: 'relative', overflow: 'hidden'
          }}>
            {/* decorative circle accents */}
            <div style={{ position:'absolute', top:-30, right:120, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
            <div style={{ position:'absolute', bottom:-40, right:40,  width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
            <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>
              <img
                src="/zen.jpg"
                alt="Zenvora Logo"
                style={{ width:54, height:54, borderRadius:10, objectFit:'cover', border:'2px solid rgba(255,255,255,0.35)' }}
                onError={e => { e.target.style.display='none'; }}
              />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>ZENVORA</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                  Inventory System — Stock Count Report
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,.7)', position:'relative' }}>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                {new Date(reportData.generatedAt).toLocaleString()}
              </div>
              Generated Date
            </div>
          </div>

          {/* Meta bar */}
          <div style={{
            display: 'flex', gap: 24, background: '#f3f4f6', borderRadius: 8,
            padding: '10px 18px', marginBottom: 18, fontSize: 13, color: '#555'
          }}>
            <span>Category: <strong style={{ color: '#111' }}>
              {reportData.category === 'all' ? 'All Categories' : reportData.category}
            </strong></span>
            <span>Sorted By: <strong style={{ color: '#111' }}>
              {reportData.sortBy === 'stock' ? 'Stock Level (Highest First)' : 'Product Name (A-Z)'}
            </strong></span>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Products',      value: reportData.totalProducts,                                                                                                                                              bg: '#e8f0fe', accent: '#1e3c72' },
              { label: 'Total Stock',         value: reportData.totalStock.toLocaleString(),                                                                                                                                bg: '#e0f7ef', accent: '#0f6e56' },
              { label: 'Inventory Value',     value: `Rs. ${reportData.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,                                                       bg: '#fff7e0', accent: '#b45309',  small: true },
              { label: 'Healthy / Low / Out', value: `${reportData.totalProducts - reportData.lowStockCount - reportData.outOfStockCount} / ${reportData.lowStockCount} / ${reportData.outOfStockCount}`,                   bg: '#fef0f0', accent: '#991b1b'},
            ].map(({ label, value, bg, accent, icon, small }) => (
              <div key={label} style={{
                background: bg, borderRadius: 10, padding: '14px 16px',
                border: `1.5px solid ${accent}22`, position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position:'absolute', top:8, right:10, fontSize:22, opacity:0.18 }}>{icon}</div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: .6, color: accent, marginBottom: 4, fontWeight:600 }}>{label}</div>
                <div style={{ fontSize: small ? 15 : 24, fontWeight: 700, color: accent }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: .5, color: '#9ca3af', marginBottom: 8 }}>
            Stock Distribution by Category
          </div>
          <div style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
            <StockBarChart categoryStockMap={reportData.categoryStockMap} />
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {Object.entries(reportData.categoryStockMap).map(([cat]) => (
                <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CATEGORY_COLORS[cat] || '#888', display: 'inline-block' }} />
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Per-category tables */}
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: .5, color: '#9ca3af', marginBottom: 12 }}>
            Product Details by Category
          </div>
          {categories.map(([cat, totalStock]) => {
            const catProducts = reportData.products.filter(p => (p.category || 'Uncategorized') === cat);
            const catValue    = catProducts.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);
            return (
              <div key={cat} style={{ marginBottom: 18, borderRadius: 8, overflow: 'hidden', border: '0.5px solid #e5e7eb' }}>
                <div style={{
                  background: '#1e3c72', padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#fff' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{cat.toUpperCase()}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {[
                      `Products: ${catProducts.length}`,
                      `Stock: ${totalStock.toLocaleString()}`,
                      `Value: Rs. ${catValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    ].map(pill => (
                      <span key={pill} style={{
                        fontSize: 11, padding: '2px 10px', borderRadius: 20,
                        background: 'rgba(255,255,255,.18)', color: '#fff'
                      }}>{pill}</span>
                    ))}
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      {['#', 'Product Name', 'Category', 'Brand', 'Stock', 'Price (RS)'].map(h => (
                        <th key={h} style={{
                          padding: '8px 12px', fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: .5,
                          color: '#6b7280', textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catProducts.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                        <td style={{ padding: '9px 12px', fontSize: 13, color: '#555' }}>{i + 1}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, color: '#111', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, color: '#555' }}>{p.category || '-'}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, color: '#555' }}>{p.brand || '-'}</td>
                        <td style={{ padding: '9px 12px' }}><StockBadge stock={p.stock} /></td>
                        <td style={{ padding: '9px 12px', fontSize: 13, color: '#555' }}>Rs. {(p.price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 16, paddingTop: 12, borderTop: '0.5px solid #e5e7eb' }}>
            Report generated by Zenvora Inventory System &nbsp;|&nbsp; © 2026 All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ProductsManagement = () => {
  const [products, setProducts]           = useState([]);
  const [searchTerm, setSearchTerm]       = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing]         = useState(false);
  const [isAdding, setIsAdding]           = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [loading, setLoading]             = useState(false);
  const [topProducts, setTopProducts]     = useState([]);
  const productsPerPage = 5;

  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [lowStockThreshold]                     = useState(20);
  const [showAlert, setShowAlert]               = useState(true);

  const [reportCategory, setReportCategory] = useState('all');
  const [reportSortBy, setReportSortBy]     = useState('stock');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReport, setShowReport]         = useState(false);
  const [reportData, setReportData]         = useState(null);

  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', manufactured_country: '',
    brand: '', price: '', stock: '', photo: '', category: ''
  });

  const API_URL = 'http://localhost:8080';

  const getLowStockCount  = () => products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= lowStockThreshold).length;
  const getOutOfStockCount = () => products.filter(p => (p.stock || 0) === 0).length;

  // ── Fetch products ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/products/all`);
      const data     = await response.json();
      if (data?.success === true) {
        let arr = data.data || [];
        if (searchTerm)      arr = arr.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (showLowStockOnly) arr = arr.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= lowStockThreshold);
        const start = (currentPage - 1) * productsPerPage;
        setProducts(arr.slice(start, start + productsPerPage));
        setTotalPages(Math.ceil(arr.length / productsPerPage));
        setTopProducts([...arr].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 5));
      } else {
        setProducts([]);
      }
    } catch { setProducts([]); }
    finally  { setLoading(false); }
  }, [currentPage, searchTerm, showLowStockOnly]);

  // ── Fetch report data ───────────────────────────────────────────────────────
  const fetchReportData = async () => {
    setGeneratingReport(true);
    try {
      const response = await fetch(`${API_URL}/api/products/all`);
      const data     = await response.json();
      if (data?.success === true) {
        let arr = data.data || [];
        if (reportCategory !== 'all') arr = arr.filter(p => p.category === reportCategory);
        arr = reportSortBy === 'stock'
          ? [...arr].sort((a, b) => (b.stock || 0) - (a.stock || 0))
          : [...arr].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const categoryStockMap = {};
        arr.forEach(p => {
          const cat = p.category || 'Uncategorized';
          categoryStockMap[cat] = (categoryStockMap[cat] || 0) + (p.stock || 0);
        });

        setReportData({
          products:        arr,
          category:        reportCategory,
          sortBy:          reportSortBy,
          generatedAt:     new Date().toISOString(),
          totalProducts:   arr.length,
          totalStock:      arr.reduce((s, p) => s + (p.stock || 0), 0),
          totalValue:      arr.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0),
          lowStockCount:   arr.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 20).length,
          outOfStockCount: arr.filter(p => (p.stock || 0) === 0).length,
          categoryStockMap,
          maxStock:        Math.max(...Object.values(categoryStockMap), 1),
        });
        setShowReport(true);
      }
    } catch (e) { console.error(e); }
    finally     { setGeneratingReport(false); }
  };

  const closeReport = () => { setShowReport(false); setReportData(null); };

  // ── PDF download ────────────────────────────────────────────────────────────
  const downloadPDFReport = () => {
    if (!reportData) { alert('Please view the report first.'); return; }
    const win = window.open('', '_blank');

    const categories = Object.entries(reportData.categoryStockMap || {});
    const maxVal     = Math.max(...Object.values(reportData.categoryStockMap), 1);

    // Colorful SVG bar chart
    const svgBars = (() => {
      const W = 700, H = 200, padL = 55, padR = 20, padT = 24, padB = 36;
      const chartW = W - padL - padR, chartH = H - padT - padB;
      const gap    = chartW / categories.length;
      const barW   = Math.min(80, gap * 0.55);
      let bars = '';
      categories.forEach(([cat, val], i) => {
        const bH  = (val / maxVal) * chartH;
        const x   = padL + gap * i + gap / 2 - barW / 2;
        const y   = padT + chartH - bH;
        const col = CATEGORY_COLORS[cat] || '#378ADD';
        bars += `<rect x="${x}" y="${y}" width="${barW}" height="${bH}" rx="5" fill="${col}" opacity="0.92"/>`;
        bars += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.min(bH, 14)}" rx="5" fill="rgba(255,255,255,0.22)"/>`;
        bars += `<text x="${x + barW / 2}" y="${y - 7}" text-anchor="middle" font-size="12" font-weight="bold" fill="${col}">${val.toLocaleString()}</text>`;
        bars += `<text x="${x + barW / 2}" y="${H - 5}" text-anchor="middle" font-size="11" fill="#555">${cat}</text>`;
      });
      let grid = '';
      for (let i = 0; i <= 4; i++) {
        const gy = padT + chartH - (i / 4) * chartH;
        grid += `<line x1="${padL}" y1="${gy}" x2="${padL + chartW}" y2="${gy}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="${i === 0 ? '0' : '4,3'}"/>`;
        grid += `<text x="${padL - 6}" y="${gy + 4}" text-anchor="end" font-size="10" fill="#aaa">${Math.round((i / 4) * maxVal).toLocaleString()}</text>`;
      }
      return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${grid}${bars}</svg>`;
    })();

    const CAT_HEADER_COLORS = {
      Switches:     { bg: '#1e3c72', stripe: '#2a5298' },
      Cables:       { bg: '#065f46', stripe: '#0f6e56' },
      Sockets:      { bg: '#7c2d12', stripe: '#9a3412' },
      General:      { bg: '#78350f', stripe: '#92400e' },
      Uncategorized:{ bg: '#374151', stripe: '#4b5563' },
    };

    const CAT_ROW_STRIPE = {
      Switches: '#eef4fd', Cables: '#ecfdf5', Sockets: '#fff7ed', General: '#fffbeb', Uncategorized: '#f9fafb',
    };

    const catTablesHtml = categories.map(([cat, totalStock]) => {
      const catProducts = reportData.products.filter(p => (p.category || 'Uncategorized') === cat);
      const catValue    = catProducts.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);
      const hdr = CAT_HEADER_COLORS[cat] || CAT_HEADER_COLORS.Uncategorized;
      const stripe = CAT_ROW_STRIPE[cat] || '#f9fafb';
      const rows = catProducts.map((p, i) => {
        const badgeBg    = p.stock === 0 ? '#fee2e2' : p.stock < 20 ? '#fef3c7' : '#d1fae5';
        const badgeColor = p.stock === 0 ? '#991b1b' : p.stock < 20 ? '#92400e' : '#065f46';
        return `<tr style="background:${i % 2 === 0 ? '#fff' : stripe}">
          <td style="padding:9px 12px;font-size:12px;color:#555;border-bottom:1px solid #f0f0f0">${i + 1}</td>
          <td style="padding:9px 12px;font-size:12px;color:#111;font-weight:600;border-bottom:1px solid #f0f0f0">${p.name}</td>
          <td style="padding:9px 12px;font-size:12px;border-bottom:1px solid #f0f0f0">
            <span style="background:${CATEGORY_COLORS[cat] || '#888'}22;color:${CATEGORY_COLORS[cat] || '#888'};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">${p.category || '-'}</span>
          </td>
          <td style="padding:9px 12px;font-size:12px;color:#555;border-bottom:1px solid #f0f0f0">${p.brand || '-'}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0">
            <span style="background:${badgeBg};color:${badgeColor};padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700">${p.stock}</span>
          </td>
          <td style="padding:9px 12px;font-size:12px;color:#111;font-weight:500;border-bottom:1px solid #f0f0f0">Rs. ${(p.price || 0).toFixed(2)}</td>
        </tr>`;
      }).join('');
      return `
        <div style="margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
          <div style="background:${hdr.bg};padding:11px 16px;display:flex;align-items:center;gap:12px">
            <span style="width:10px;height:10px;border-radius:50%;background:${CATEGORY_COLORS[cat]||'#fff'};display:inline-block;border:2px solid rgba(255,255,255,0.5)"></span>
            <strong style="color:#fff;font-size:13px;letter-spacing:.5px">${cat.toUpperCase()}</strong>
            <span style="margin-left:auto;display:flex;gap:8px">
              <span style="font-size:11px;padding:3px 11px;border-radius:20px;background:rgba(255,255,255,0.18);color:#fff">Products: ${catProducts.length}</span>
              <span style="font-size:11px;padding:3px 11px;border-radius:20px;background:rgba(255,255,255,0.18);color:#fff">Stock: ${totalStock.toLocaleString()}</span>
              <span style="font-size:11px;padding:3px 11px;border-radius:20px;background:rgba(255,255,255,0.18);color:#fff">Value: Rs. ${catValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </span>
          </div>
          <table style="width:100%;border-collapse:collapse;background:#fff">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;font-weight:700;text-align:left;border-bottom:2px solid #e5e7eb">#</th>
                <th style="padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;font-weight:700;text-align:left;border-bottom:2px solid #e5e7eb">Product Name</th>
                <th style="padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;font-weight:700;text-align:left;border-bottom:2px solid #e5e7eb">Category</th>
                <th style="padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;font-weight:700;text-align:left;border-bottom:2px solid #e5e7eb">Brand</th>
                <th style="padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;font-weight:700;text-align:left;border-bottom:2px solid #e5e7eb">Stock</th>
                <th style="padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;font-weight:700;text-align:left;border-bottom:2px solid #e5e7eb">Price (RS)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    const summaryCards = [
      { label: 'Total Products',      value: reportData.totalProducts,                                                                                                                                             bg: '#e8f0fe', accent: '#1e3c72', border: '#b3c9f9' },
      { label: 'Total Stock',         value: reportData.totalStock.toLocaleString(),                                                                                                                               bg: '#d1fae5', accent: '#065f46', border: '#6ee7b7' },
      { label: 'Inventory Value',     value: `Rs. ${reportData.totalValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`,                                                            bg: '#fef3c7', accent: '#92400e', border: '#fcd34d', small: true },
      { label: 'Healthy / Low / Out', value: `${reportData.totalProducts - reportData.lowStockCount - reportData.outOfStockCount} / ${reportData.lowStockCount} / ${reportData.outOfStockCount}`,                 bg: '#fee2e2', accent: '#991b1b', border: '#fca5a5' },
    ].map(({ label, value, bg, accent, border, small }) =>
      `<div style="background:${bg};border-radius:10px;padding:14px 16px;border:1.5px solid ${border}">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:${accent};margin-bottom:5px;font-weight:700">${label}</div>
        <div style="font-size:${small ? '15px' : '24px'};font-weight:800;color:${accent}">${value}</div>
      </div>`
    ).join('');

    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Zenvora Stock Count Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; padding:28px; color:#111; font-size:13px; background:#fff; }
  @media print { body { padding:16px; } }
</style></head><body>

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1e3c72 0%,#2a5298 55%,#1a6fa8 100%);border-radius:12px;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;position:relative;overflow:hidden">
    <div style="position:absolute;top:-30px;right:130px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,0.07)"></div>
    <div style="position:absolute;bottom:-50px;right:40px;width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,0.05)"></div>
    <div style="display:flex;align-items:center;gap:16px;position:relative">
      <img src="/zen.jpg" alt="Zenvora Logo" style="width:56px;height:56px;border-radius:10px;object-fit:cover;border:2px solid rgba(255,255,255,0.35)" onerror="this.style.display='none'"/>
      <div>
        <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:1.5px">ZENVORA</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:3px">Inventory System — Stock Count Report</div>
      </div>
    </div>
    <div style="text-align:right;font-size:12px;color:rgba(255,255,255,.7);position:relative">
      <div style="font-size:13px;color:#fff;font-weight:600">${new Date(reportData.generatedAt).toLocaleString()}</div>
      Generated Date
    </div>
  </div>

  <!-- META BAR -->
  <div style="display:flex;gap:24px;background:#f3f4f6;border-radius:8px;padding:10px 18px;margin-bottom:16px;font-size:12px;color:#555">
    <span>Category: <strong style="color:#111">${reportData.category === 'all' ? 'All Categories' : reportData.category}</strong></span>
    <span>Sorted By: <strong style="color:#111">${reportData.sortBy === 'stock' ? 'Stock Level (Highest First)' : 'Product Name (A-Z)'}</strong></span>
  </div>

  <!-- SUMMARY CARDS -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
    ${summaryCards}
  </div>

  <!-- CHART -->
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:8px;font-weight:600">Stock Distribution by Category</div>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;margin-bottom:20px">
    ${svgBars}
    <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">
      ${categories.map(([cat]) => `<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#555"><span style="width:10px;height:10px;border-radius:2px;background:${CATEGORY_COLORS[cat]||'#888'};display:inline-block"></span>${cat}</span>`).join('')}
    </div>
  </div>

  <!-- PRODUCT TABLES -->
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:12px;font-weight:600">Product Details by Category</div>
  ${catTablesHtml}

  <!-- FOOTER -->
  <div style="text-align:center;font-size:11px;color:#aaa;margin-top:18px;padding-top:12px;border-top:1px solid #e5e7eb">
    Report generated by Zenvora Inventory System &nbsp;|&nbsp; © 2026 All Rights Reserved
  </div>

  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},600);}</script>
</body></html>`);
    win.document.close();
  };

  // ── Image handlers ──────────────────────────────────────────────────────────
  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024)              { alert('Image size should be less than 5MB'); return; }
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };
  const handleFileSelect = e  => processImageFile(e.target.files[0]);
  const handleDragOver   = e  => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const handleDragLeave  = e  => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); };
  const handleDrop       = e  => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); processImageFile(e.dataTransfer.files[0]); };

  const clearImage = () => { if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(''); setImageFile(null); };

  const handleSearch        = e  => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleSelectProduct = p  => { setSelectedProduct(p); setIsEditing(false); setIsAdding(false); clearImage(); };

  const handleAddProduct = () => {
    setIsAdding(true); setIsEditing(false); setSelectedProduct(null); clearImage();
    setFormData({ name:'', description:'', manufactured_country:'', brand:'', price:'', stock:'', photo:'', category:'' });
  };

  const handleEditProduct = () => {
    if (!selectedProduct) return;
    setIsEditing(true); clearImage();
    setFormData({
      id: selectedProduct.id, name: selectedProduct.name,
      description: selectedProduct.description || '',
      manufactured_country: selectedProduct.manufactured_country || '',
      brand: selectedProduct.brand || '', price: selectedProduct.price,
      stock: selectedProduct.stock, photo: selectedProduct.photo || '',
      category: selectedProduct.category || ''
    });
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct || !window.confirm(`Delete ${selectedProduct.name}?`)) return;
    try {
      const res  = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success === true) { alert('Product deleted!'); setSelectedProduct(null); fetchProducts(); }
      else alert('Failed to delete product');
    } catch { alert('Error deleting product'); }
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : name === 'stock' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (isAdding) {
        const { id, ...body } = formData;
        res = await fetch(`${API_URL}/api/products`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      } else {
        res = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
          method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
        });
      }
      const data = await res.json();
      if (data.success === true) {
        alert(isAdding ? 'Product added!' : 'Product updated!');
        setIsAdding(false); setIsEditing(false); clearImage(); fetchProducts();
      } else alert('Error saving product');
    } catch { alert('Error saving product'); }
  };

  const cancelForm = () => { setIsAdding(false); setIsEditing(false); clearImage(); };

  useEffect(() => { return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }; }, [imagePreview]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const lowStockCount  = getLowStockCount();
  const outOfStockCount = getOutOfStockCount();

  return (
    <div className="main-container">

      {/* ── Report Modal ── */}
      {showReport && reportData && (
        <ReportModal
          reportData={reportData}
          onClose={closeReport}
          onDownload={downloadPDFReport}
        />
      )}

      <div>
        {/* ── Left panel: Stock Count Report controls ── */}
        <div className="top-selling-panel">
          <h3>Stock Count Report</h3>

          {(lowStockCount > 0 || outOfStockCount > 0) && showAlert && (
            <div style={{
              background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: 8,
              padding: '12px 16px', marginBottom: 15,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <span style={{ fontWeight: 500, color: '#92400e' }}>
                  {outOfStockCount > 0 && `${outOfStockCount} out of stock, `}
                  {lowStockCount   > 0 && `${lowStockCount} products low on stock`}
                </span>
                <button onClick={() => setShowLowStockOnly(!showLowStockOnly)} style={{
                  background: '#f59e0b', color: '#fff', border: 'none',
                  padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12
                }}>
                  {showLowStockOnly ? 'Show All' : 'View Low Stock'}
                </button>
              </div>
              <button onClick={() => setShowAlert(false)} style={{
                background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#92400e'
              }}>×</button>
            </div>
          )}

          <div className="date-range">
            <div className="date-input">
              <label>Category:</label>
              <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="date-picker">
                <option value="all">All Categories</option>
                <option value="Switches">Switches</option>
                <option value="Cables">Cables</option>
                <option value="Sockets">Sockets</option>
                <option value="General">General</option>
              </select>
            </div>
            <div className="date-input">
              <label>Sort by:</label>
              <select value={reportSortBy} onChange={e => setReportSortBy(e.target.value)} className="date-picker">
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
            topProducts.map((product, index) => (
              <div key={product.id} className="top-product-item">
                <span className="top-rank">{index + 1}.</span>
                <span className="top-product-name" style={{ color: '#111111' }} >{product.name}</span>
                <span className="top-product-sales" style={{ color: getStatusColor(product.stock) }}>
                  Stock: {product.stock}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">No products available</div>
          )}
        </div>

        {/* ── Middle panel: Product list ── */}
        <div className="products-panel">
          <div className="search-bar">
            <input
              type="text" placeholder="Search by product name..."
              value={searchTerm} onChange={handleSearch}
            />
            <button className="view-products-btn" onClick={fetchProducts}>View products</button>
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
                    borderLeft: product.stock === 0
                      ? '3px solid #ef4444'
                      : product.stock <= 20
                        ? '3px solid #f59e0b'
                        : 'none'
                  }}
                >
                  <img src={product.photo || 'https://via.placeholder.com/150'} alt={product.name} className="product-thumb" />
                  <div className="product-info">
                    <div className="product-id">{product.id}</div>
                    <div className="product-name" style={{ color: '#ec3f3f' }}>{product.name}</div>
                    <div className="product-price">RS. {product.price?.toFixed(2)}</div>
                    <div className="product-stock" style={{ color: getStatusColor(product.stock) }}>
                      Stock: {product.stock}
                      {product.stock <= 20 && product.stock > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b' }}>⚠️ Low</span>}
                      {product.stock === 0 && <span style={{ marginLeft: 8, fontSize: 11, color: '#ef4444' }}>❌ Out</span>}
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
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: Product details / form ── */}
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
                <div
                  className="drag-drop-area"
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                  style={{ border: '2px dashed #ccc', borderRadius: 8, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: '#f9f9f9' }}
                >
                  {imagePreview ? (
                    <div><img src={imagePreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, marginBottom: '1rem' }} /><p>Click or drag another image</p></div>
                  ) : formData.photo ? (
                    <div><img src={formData.photo} alt="Current" style={{ maxWidth: 200, maxHeight: 200, marginBottom: '1rem' }} /><p>Click or drag to change</p></div>
                  ) : (
                    <div><div style={{ fontSize: 48, marginBottom: '1rem' }}>📸</div><p>Drag & drop image here or click</p></div>
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
                <p>
                  <strong>Stock:</strong>
                  <span style={{ color: getStatusColor(selectedProduct.stock), fontWeight: 'bold' }}> {selectedProduct.stock}</span>
                  {selectedProduct.stock <= 20 && selectedProduct.stock > 0 && <span style={{ marginLeft: 10, color: '#f59e0b' }}>⚠️ Low Stock!</span>}
                  {selectedProduct.stock === 0 && <span style={{ marginLeft: 10, color: '#ef4444' }}>❌ Out of Stock!</span>}
                </p>
              </div>
            </div>
            <div className="action-buttons">
              <button onClick={handleAddProduct}    className="add-btn">ADD</button>
              <button onClick={handleEditProduct}   className="edit-btn">Edit</button>
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