import React, { useState } from 'react';
import { X, Printer, CheckSquare, Square, Tag, Settings, LayoutGrid, FileText } from 'lucide-react';

// Code 128 Pattern Table (0 to 106)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

function generateCode128Modules(text) {
  if (!text) return [];
  const clean = String(text).trim();
  const startCode = 104; // START B
  const codes = [startCode];
  let checkSum = startCode;

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const codeVal = (charCode >= 32 && charCode <= 126) ? (charCode - 32) : 0;
    codes.push(codeVal);
    checkSum += codeVal * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(106); // STOP pattern

  const modules = [];
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      modules.push({ isBar, width: parseInt(pattern[j], 10) });
      isBar = !isBar;
    }
  }
  return modules;
}

// Standalone SVG Barcode component
export function BarcodeSvg({ text, height = 40, showText = true, className = '' }) {
  const code = String(text || '000000').toUpperCase();
  const modules = generateCode128Modules(code);
  const totalUnits = modules.reduce((sum, m) => sum + m.width, 0);

  let currentX = 0;
  const rects = [];
  modules.forEach((m, idx) => {
    if (m.isBar) {
      rects.push(
        <rect
          key={idx}
          x={currentX}
          y={0}
          width={m.width}
          height={height}
          fill="#000000"
        />
      );
    }
    currentX += m.width;
  });

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }} className={className}>
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
        preserveAspectRatio="none"
      >
        {rects}
      </svg>
      {showText && (
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', fontFamily: 'monospace', color: '#111827', marginTop: '2px' }}>
          {code}
        </span>
      )}
    </div>
  );
}

export function BarcodePrintModal({ products = [], initialSelectedProduct = null, onClose }) {
  // Label Template: 'shelf_tag' (60x40mm) | 'product_sticker' (40x30mm) | 'a4_grid'
  const [template, setTemplate] = useState('shelf_tag');
  const [storeName, setStoreName] = useState('ZONA MART & RETAIL');

  // Multi-item quantities state: { [productId]: quantity }
  const [itemQuantities, setItemQuantities] = useState(() => {
    const initial = {};
    if (initialSelectedProduct) {
      initial[initialSelectedProduct.id] = 1;
    } else {
      // Default: select first 6 products with qty 1
      products.slice(0, 8).forEach(p => {
        initial[p.id] = 1;
      });
    }
    return initial;
  });

  const handleToggleItem = (productId) => {
    setItemQuantities(prev => {
      const copy = { ...prev };
      if (copy[productId]) {
        delete copy[productId];
      } else {
        copy[productId] = 1;
      }
      return copy;
    });
  };

  const handleQtyChange = (productId, qty) => {
    const val = Math.max(1, parseInt(qty, 10) || 1);
    setItemQuantities(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const handleSelectAll = () => {
    if (Object.keys(itemQuantities).length === products.length) {
      setItemQuantities({});
    } else {
      const all = {};
      products.forEach(p => { all[p.id] = 1; });
      setItemQuantities(all);
    }
  };

  // Build the list of labels to render based on quantities
  const labelItems = [];
  products.forEach(p => {
    const qty = itemQuantities[p.id];
    if (qty && qty > 0) {
      for (let i = 0; i < qty; i++) {
        labelItems.push({
          id: `${p.id}-${i}`,
          sku: p.barcode || p.sku,
          name: p.name,
          categoryName: p.categoryName || 'General',
          unitName: p.unitName || 'Pcs',
          price: p.sellingPrice || 0,
        });
      }
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #barcode-print-canvas, #barcode-print-canvas * {
            visibility: visible !important;
          }
          #barcode-print-canvas {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 4mm;
          }
        }
      `}</style>

      <div className="modal-content" style={{ maxWidth: '980px', width: '95vw', height: '90vh', display: 'flex', flexDirection: 'column', padding: '0', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Tag size={20} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Generator Barcode & Price Tag Rak Toko</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Cetak label rak minimarket presisi dengan Code 128 & harga jual mencolok
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Body: Left Sidebar (Controls) & Right Canvas (Print Preview) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Controls Sidebar */}
          <div style={{ width: '340px', borderRight: '1px solid var(--border-subtle)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.2)', overflowY: 'auto' }}>
            {/* Format Selection */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>Format Template Cetak</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setTemplate('shelf_tag')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: template === 'shelf_tag' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    background: template === 'shelf_tag' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: template === 'shelf_tag' ? '#34d399' : 'var(--text-dim)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Tag size={16} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Price Tag Rak Minimarket</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ukuran 60 x 40 mm (Harga Besar & Barcode)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('product_sticker')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: template === 'product_sticker' ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                    background: template === 'product_sticker' ? 'rgba(129, 140, 248, 0.12)' : 'transparent',
                    color: template === 'product_sticker' ? '#818cf8' : 'var(--text-dim)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <FileText size={16} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Stiker Barcode Produk</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ukuran 40 x 30 mm (Label Tempel Kemasan)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('a4_grid')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: template === 'a4_grid' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                    background: template === 'a4_grid' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    color: template === 'a4_grid' ? '#fbbf24' : 'var(--text-dim)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <LayoutGrid size={16} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Lembar Kertas A4 (Grid Stiker)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stiker Tom & Jerry / 24 Label per Halaman</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Nama Toko di Label */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Header Toko Pada Label</label>
              <input
                type="text"
                className="form-input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: ZONA MART"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Product Selection List */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '180px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Pilih Produk & Jumlah Label</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {Object.keys(itemQuantities).length === products.length ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', paddingRight: '4px' }}>
                {products.map(p => {
                  const isSelected = !!itemQuantities[p.id];
                  const qty = itemQuantities[p.id] || 1;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div
                        onClick={() => handleToggleItem(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, overflow: 'hidden' }}
                      >
                        {isSelected ? <CheckSquare size={15} color="#10b981" /> : <Square size={15} color="var(--text-muted)" />}
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{p.sku} | Rp {p.sellingPrice?.toLocaleString('id-ID')}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Jml:</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={qty}
                            onChange={(e) => handleQtyChange(p.id, e.target.value)}
                            style={{
                              width: '45px',
                              padding: '2px 4px',
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '0.75rem',
                              textAlign: 'center'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Stiker Indicator */}
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Label Tercetak:</span>
              <strong style={{ fontSize: '0.95rem', color: '#34d399' }}>{labelItems.length} Label</strong>
            </div>

            {/* Print Action Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={labelItems.length === 0}
              className="btn btn-primary"
              style={{ padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}
            >
              <Printer size={18} />
              <span>Cetak Label Sekarang</span>
            </button>
          </div>

          {/* Right Canvas / Print Preview Area */}
          <div style={{ flex: 1, background: '#1e293b', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '14px', textAlign: 'center' }} className="no-print">
              Pratinjau Kertas Stiker (WYSIWYG) — Klik <strong>"Cetak Label Sekarang"</strong> untuk mengirim ke printer thermal/laser.
            </div>

            {/* Actual Printable Canvas */}
            <div
              id="barcode-print-canvas"
              style={{
                background: '#ffffff',
                color: '#000000',
                padding: template === 'a4_grid' ? '12mm' : '8mm',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                borderRadius: '4px',
                width: template === 'a4_grid' ? '210mm' : 'auto',
                minHeight: template === 'a4_grid' ? '297mm' : 'auto',
                boxSizing: 'border-box'
              }}
            >
              {labelItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Silakan pilih minimal satu produk di panel kiri untuk melihat pratinjau stiker.
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: template === 'shelf_tag' ? '6mm' : template === 'product_sticker' ? '4mm' : '3mm',
                    justifyContent: 'flex-start'
                  }}
                >
                  {labelItems.map((item) => {
                    if (template === 'shelf_tag') {
                      // 60mm x 40mm Shelf Price Tag Layout
                      return (
                        <div
                          key={item.id}
                          style={{
                            width: '60mm',
                            height: '40mm',
                            border: '1px dashed #cbd5e1',
                            padding: '3mm',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            pageBreakInside: 'avoid',
                            fontFamily: 'Arial, sans-serif'
                          }}
                        >
                          {/* Store Name & Date */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1mm' }}>
                            <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', color: '#475569' }}>
                              {storeName}
                            </span>
                            <span style={{ fontSize: '7px', color: '#94a3b8' }}>
                              {todayStr}
                            </span>
                          </div>

                          {/* Product Name */}
                          <div style={{ margin: '1mm 0' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, lineHeight: 1.15, color: '#0f172a', maxHeight: '2.4em', overflow: 'hidden' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '0.5mm' }}>
                              Satuan: {item.unitName} | {item.categoryName}
                            </div>
                          </div>

                          {/* Price Tag Row (Highlight) */}
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', background: '#f8fafc', padding: '1mm 2mm', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '8px', fontWeight: 700, color: '#334155' }}>HARGA:</span>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                              <span style={{ fontSize: '9px', fontWeight: 700, marginRight: '1px' }}>Rp</span>
                              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.5px', color: '#047857' }}>
                                {item.price.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          {/* Barcode & SKU Row */}
                          <div style={{ textAlign: 'center', marginTop: '1mm' }}>
                            <BarcodeSvg text={item.sku} height={22} showText={true} />
                          </div>
                        </div>
                      );
                    } else if (template === 'product_sticker') {
                      // 40mm x 30mm Mini Product Sticker Layout
                      return (
                        <div
                          key={item.id}
                          style={{
                            width: '40mm',
                            height: '30mm',
                            border: '1px dashed #cbd5e1',
                            padding: '2mm',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            pageBreakInside: 'avoid',
                            fontFamily: 'Arial, sans-serif'
                          }}
                        >
                          <div style={{ fontSize: '8.5px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#0f172a' }}>
                            {item.name}
                          </div>

                          <div style={{ textAlign: 'center', margin: '1mm 0' }}>
                            <BarcodeSvg text={item.sku} height={20} showText={false} />
                            <div style={{ fontSize: '7.5px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                              {item.sku}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1mm' }}>
                            <span style={{ fontSize: '6.5px', color: '#64748b' }}>{storeName}</span>
                            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#047857' }}>
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      // A4 Grid Format (Tom & Jerry 108 Style: ~38x19mm)
                      return (
                        <div
                          key={item.id}
                          style={{
                            width: '63mm',
                            height: '34mm',
                            border: '1px dotted #cbd5e1',
                            padding: '2.5mm',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            pageBreakInside: 'avoid',
                            fontFamily: 'Arial, sans-serif'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '7px', fontWeight: 700, color: '#64748b' }}>{storeName}</span>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#047857' }}>
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div style={{ fontSize: '8.5px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0f172a' }}>
                            {item.name}
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <BarcodeSvg text={item.sku} height={18} showText={true} />
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
