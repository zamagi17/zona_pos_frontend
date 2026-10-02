import React, { useEffect, useState } from 'react';
import { Printer, Download, X, FileSpreadsheet, Building2, Calendar, User, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { exportToExcel } from '../utils/exportUtils';

export function ReportPrintModal({
  isOpen,
  onClose,
  title = 'Laporan Resmi Zona POS',
  subtitle = 'Dokumen Rekapitulasi Finansial & Operasional',
  dateRange = '-',
  kpiSummary = [],
  columns = [],
  data = [],
  footerSummary = [],
  onExportExcel = null,
  excelFilename = 'laporan-akuntansi'
}) {
  const { user } = useAuth();
  const [storeSetting, setStoreSetting] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.getReceiptSetting(user?.activeOutletId)
        .then(res => {
          if (res) setStoreSetting(res);
        })
        .catch(() => {});
    }
  }, [isOpen, user?.activeOutletId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExcel = () => {
    if (typeof onExportExcel === 'function') {
      onExportExcel();
    } else {
      exportToExcel({
        name: title.slice(0, 30),
        columns,
        data
      }, excelFilename);
    }
  };

  const storeName = storeSetting?.businessName || user?.outletName || 'ZONA POS UMKM';
  const storeAddress = storeSetting?.address || 'Outlet Utama';
  const storePhone = storeSetting?.phone || '-';
  const printedAt = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, overflowY: 'auto', padding: '20px 10px' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-a4-report, #printable-a4-report * {
            visibility: visible !important;
          }
          #printable-a4-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 10pt !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

      <div className="modal-content" style={{
        maxWidth: '920px',
        width: '100%',
        padding: '0',
        background: 'var(--bg-surface)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={20} color="#10b981" />
              Pratinjau Cetak Laporan PDF & Dokumen Resmi
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Format standar Letter / A4 siap cetak ke printer dokumen atau disimpan sebagai PDF.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={16} />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#0f172a',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Printer size={16} />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable A4 Sheet Body */}
        <div style={{ padding: '24px', maxHeight: 'calc(85vh - 70px)', overflowY: 'auto' }}>
          <div
            id="printable-a4-report"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '36px 40px',
              borderRadius: '8px',
              fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontSize: '13px',
              lineHeight: 1.45,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              margin: '0 auto',
              maxWidth: '840px'
            }}
          >
            {/* Header: Kop Surat Resmi Toko */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  {storeName}
                </h1>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                  {storeAddress} {storePhone !== '-' ? `• Telp: ${storePhone}` : ''}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', letterSpacing: '0.04em' }}>
                  SISTEM INFORMASI POS & AKUNTANSI ENTERPRISE
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#334155'
                }}>
                  DOKUMEN RESMI
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                  Waktu Cetak: {printedAt}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Dicetak Oleh: {user?.name || 'Administrator'}
                </div>
              </div>
            </div>

            {/* Title & Metadata Banner */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  {title}
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {subtitle}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f766e',
                background: '#ccfbf1',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                <Calendar size={14} />
                <span>Periode: {dateRange}</span>
              </div>
            </div>

            {/* KPI Summary Cards Grid (if available) */}
            {kpiSummary && kpiSummary.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(kpiSummary.length, 4)}, 1fr)`,
                gap: '10px',
                marginBottom: '20px'
              }}>
                {kpiSummary.map((kpi, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    background: kpi.highlight ? '#f0fdf4' : '#ffffff'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      {kpi.label}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: kpi.highlight ? '#15803d' : '#0f172a',
                      marginTop: '3px'
                    }}>
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Main Table */}
            <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11.5px',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        style={{
                          padding: '8px 10px',
                          fontWeight: 700,
                          textAlign: col.align || 'left',
                          fontSize: '10.5px',
                          letterSpacing: '0.03em'
                        }}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data && data.length > 0 ? (
                    data.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          pageBreakInside: 'avoid'
                        }}
                      >
                        {columns.map((col, colIdx) => {
                          const val = typeof col.formatter === 'function'
                            ? col.formatter(row[col.key], row)
                            : row[col.key];
                          return (
                            <td
                              key={colIdx}
                              style={{
                                padding: '8px 10px',
                                textAlign: col.align || 'left',
                                color: '#334155',
                                fontWeight: col.isBold ? 700 : 400
                              }}
                            >
                              {val !== undefined && val !== null ? val : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada data yang tersedia untuk periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
                {footerSummary && footerSummary.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1', fontWeight: 800 }}>
                      {footerSummary.map((fItem, fIdx) => (
                        <td
                          key={fIdx}
                          colSpan={fItem.colSpan || 1}
                          style={{
                            padding: '10px',
                            textAlign: fItem.align || 'left',
                            color: '#0f172a',
                            fontSize: '11.5px'
                          }}
                        >
                          {fItem.label ? <span style={{ color: '#64748b', marginRight: '6px' }}>{fItem.label}:</span> : null}
                          <span>{fItem.value}</span>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Audit & Legal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginTop: '40px',
              paddingTop: '20px',
              borderTop: '1px dashed #cbd5e1',
              fontSize: '11px',
              pageBreakInside: 'avoid'
            }}>
              <div style={{ maxWidth: '380px', color: '#64748b' }}>
                <p style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Catatan Akuntansi & Perpajakan:</p>
                <p style={{ lineHeight: 1.4 }}>
                  Dokumen ini merupakan catatan ringkasan buku kas dan transaksi resmi yang di-generate langsung oleh sistem ZONA POS. Seluruh angka rupiah telah tervalidasi dengan audit trail database.
                </p>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', gap: '40px', textAlign: 'center' }}>
                <div>
                  <div style={{ color: '#64748b', marginBottom: '45px' }}>Disiapkan Oleh,</div>
                  <div style={{ fontWeight: 700, borderTop: '1px solid #94a3b8', paddingTop: '4px', minWidth: '110px' }}>
                    {user?.name || 'Petugas Kasir'}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>Kasir / Akuntan</div>
                </div>

                <div>
                  <div style={{ color: '#64748b', marginBottom: '45px' }}>Disetujui Oleh,</div>
                  <div style={{ fontWeight: 700, borderTop: '1px solid #94a3b8', paddingTop: '4px', minWidth: '110px' }}>
                    ( ............................ )
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>Manajer / Pemilik</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
