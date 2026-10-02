import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { api } from '../services/api';
import { 
  Clock, DollarSign, CheckCircle2, AlertCircle, ArrowUpDown, 
  Eye, X, History, Printer, FileSpreadsheet, RefreshCw 
} from 'lucide-react';
import { exportToExcel, formatRupiah, formatDateIndo } from '../utils/exportUtils';
import { ReportPrintModal } from '../components/ReportPrintModal';

export function ShiftsPage({ onOpenShiftModal, onCloseShiftModal, onOpenCashMovementModal, onPrintShiftReceipt }) {
  const { user, selectedOutletId } = useAuth();
  const { activeShift } = useShift();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState(null);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const outletId = selectedOutletId || user?.outletId;

  const loadShifts = () => {
    if (!outletId) return;
    setLoading(true);
    api.getShiftsByOutlet(outletId)
      .then(setShifts)
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadShifts();
  }, [outletId, activeShift]);

  const handleExportExcel = () => {
    if (shifts.length === 0) {
      alert('Tidak ada riwayat shift untuk diekspor.');
      return;
    }

    const columns = [
      { header: 'ID Shift', key: 'id', formatter: v => `SHF-${String(v).padStart(4, '0')}` },
      { header: 'Nama Kasir', key: 'cashierName' },
      { header: 'Waktu Buka', key: 'openedAt', formatter: v => v ? new Date(v).toLocaleString('id-ID') : '-' },
      { header: 'Waktu Tutup', key: 'closedAt', formatter: v => v ? new Date(v).toLocaleString('id-ID') : 'Sedang Buka (Aktif)' },
      { header: 'Modal Awal (Rp)', key: 'startCash' },
      { header: 'Total Kas Masuk (Rp)', key: 'totalCashIn', formatter: v => v || 0 },
      { header: 'Total Kas Keluar (Rp)', key: 'totalCashOut', formatter: v => v || 0 },
      { header: 'Estimasi Kas Laci (Rp)', key: 'expectedCash', formatter: v => v || 0 },
      { header: 'Kas Aktual Fisik (Rp)', key: 'actualCash', formatter: v => v !== null && v !== undefined ? v : '-' },
      { header: 'Selisih Kas (Rp)', key: 'difference', formatter: (_, row) => (row.actualCash !== null && row.expectedCash !== null) ? (row.actualCash - row.expectedCash) : 0 },
      { header: 'Status Shift', key: 'status' }
    ];

    exportToExcel({
      name: 'Rekap Shift Kasir',
      columns,
      data: shifts
    }, `Rekap_Shift_Kasir_Outlet${outletId}`);
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Manajemen & Riwayat Shift Kasir</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lacak modal awal, omset, kas masuk/keluar laci (petty cash), dan rekonsiliasi kas fisik</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={loadShifts} className="btn btn-outline" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
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
            <FileSpreadsheet size={15} />
            <span>Download Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#0f172a',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Printer size={15} />
            <span>Cetak Laporan PDF</span>
          </button>

          {activeShift && onOpenCashMovementModal && (
            <button
              onClick={onOpenCashMovementModal}
              className="btn btn-outline"
              style={{
                borderColor: 'rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#a5b4fc',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ArrowUpDown size={16} color="#818cf8" />
              <span>Kas Masuk / Keluar</span>
            </button>
          )}

          {activeShift ? (
            <button onClick={onCloseShiftModal} className="btn btn-amber">
              <Clock size={16} />
              <span>Tutup Shift Aktif</span>
            </button>
          ) : (
            <button onClick={onOpenShiftModal} className="btn btn-primary">
              <Clock size={16} />
              <span>Buka Shift Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SHIFT STATUS CARD */}
      {activeShift && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-emerald">SEDANG BERLANGSUNG</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Dibuka sejak: {activeShift.openedAt ? new Date(activeShift.openedAt).toLocaleString('id-ID') : '-'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Kasir Bertugas: {activeShift.cashierName || user?.name}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>MODAL AWAL:</span>
              <strong style={{ fontSize: '1.05rem' }}>Rp {activeShift.startCash?.toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>PENJUALAN TUNAI:</span>
              <strong style={{ fontSize: '1.05rem', color: '#34d399' }}>+Rp {activeShift.totalCashSales?.toLocaleString('id-ID') || '0'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>KAS MASUK (+):</span>
              <strong style={{ fontSize: '1.05rem', color: '#34d399' }}>+Rp {(activeShift.totalCashIn || 0).toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>KAS KELUAR (-):</span>
              <strong style={{ fontSize: '1.05rem', color: '#fb7185' }}>-Rp {(activeShift.totalCashOut || 0).toLocaleString('id-ID')}</strong>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px 14px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <span style={{ fontSize: '0.72rem', color: '#6ee7b7', display: 'block', fontWeight: 700 }}>ESTIMASI LACI (EXPECTED):</span>
              <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>
                Rp {(activeShift.expectedCash || ((activeShift.startCash || 0) + (activeShift.totalCashSales || 0) + (activeShift.totalCashIn || 0) - (activeShift.totalCashOut || 0))).toLocaleString('id-ID')}
              </strong>
            </div>

            {onPrintShiftReceipt && (
              <button
                onClick={() => onPrintShiftReceipt(activeShift)}
                className="btn btn-outline"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8'
                }}
                title="Cetak struk pembacaan kas saat ini (X-Report)"
              >
                <Printer size={15} />
                <span>Cetak X-Report</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SHIFTS TABLE */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>Daftar Sesi Shift Kasir</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>WAKTU SHIFT</th>
                <th style={{ padding: '12px' }}>KASIR</th>
                <th style={{ padding: '12px' }}>MODAL AWAL</th>
                <th style={{ padding: '12px' }}>PENJUALAN CASH</th>
                <th style={{ padding: '12px' }}>KAS MASUK</th>
                <th style={{ padding: '12px' }}>KAS KELUAR</th>
                <th style={{ padding: '12px' }}>ESTIMASI LACI</th>
                <th style={{ padding: '12px' }}>KAS AKTUAL</th>
                <th style={{ padding: '12px' }}>SELISIH</th>
                <th style={{ padding: '12px' }}>STATUS</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => {
                const diff = s.cashDifference || 0;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>
                        {s.openedAt ? new Date(s.openedAt).toLocaleDateString('id-ID') : '-'}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {s.openedAt ? new Date(s.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''} -{' '}
                        {s.closedAt ? new Date(s.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Sekarang'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{s.cashierName}</td>
                    <td style={{ padding: '12px' }}>Rp {s.startCash?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px', color: '#34d399' }}>+Rp {s.totalCashSales?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px', color: '#34d399' }}>
                      {(s.totalCashIn || 0) > 0 ? `+Rp ${s.totalCashIn.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#fb7185' }}>
                      {(s.totalCashOut || 0) > 0 ? `-Rp ${s.totalCashOut.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Rp {s.expectedCash?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      {s.actualCash ? `Rp ${s.actualCash.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {s.status === 'CLOSED' ? (
                        <span style={{ fontWeight: 800, color: diff === 0 ? '#34d399' : diff < 0 ? '#fb7185' : '#fbbf24' }}>
                          {diff === 0 ? 'Pas (Rp 0)' : diff > 0 ? `+Rp ${diff.toLocaleString('id-ID')}` : `Rp ${diff.toLocaleString('id-ID')}`}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${s.status === 'OPEN' ? 'badge-emerald' : 'badge-indigo'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedShiftForDetail(s)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px', fontSize: '0.75rem', borderRadius: '8px' }}
                          title="Lihat Rincian Mutasi Kas Shift"
                        >
                          <Eye size={13} />
                          <span>Rincian</span>
                        </button>
                        {onPrintShiftReceipt && (
                          <button
                            onClick={() => onPrintShiftReceipt(s)}
                            className="btn btn-outline"
                            style={{
                              padding: '5px 8px',
                              fontSize: '0.75rem',
                              borderRadius: '8px',
                              color: '#34d399',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              background: 'rgba(16, 185, 129, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title={`Cetak Struk Rekap Shift (${s.status === 'CLOSED' ? 'Z-Report' : 'X-Report'})`}
                          >
                            <Printer size={13} />
                            <span>Cetak</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL SHIFT MODAL */}
      {selectedShiftForDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <History size={20} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Rincian Shift Kasir #{selectedShiftForDetail.id}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Kasir: {selectedShiftForDetail.cashierName} • {selectedShiftForDetail.openedAt ? new Date(selectedShiftForDetail.openedAt).toLocaleDateString('id-ID') : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedShiftForDetail(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Financial Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              marginBottom: '20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Modal Awal:</span>
                <strong style={{ fontSize: '0.95rem' }}>Rp {selectedShiftForDetail.startCash?.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Penjualan Cash:</span>
                <strong style={{ fontSize: '0.95rem', color: '#34d399' }}>+Rp {selectedShiftForDetail.totalCashSales?.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Kas Masuk (+):</span>
                <strong style={{ fontSize: '0.95rem', color: '#34d399' }}>+Rp {(selectedShiftForDetail.totalCashIn || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Kas Keluar (-):</span>
                <strong style={{ fontSize: '0.95rem', color: '#fb7185' }}>-Rp {(selectedShiftForDetail.totalCashOut || 0).toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Kas Aktual Laci:</span>
                <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>Rp {selectedShiftForDetail.actualCash?.toLocaleString('id-ID') || '-'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Selisih Fisik:</span>
                <strong style={{
                  fontSize: '0.95rem',
                  color: (selectedShiftForDetail.cashDifference || 0) === 0 ? '#34d399' : '#fb7185'
                }}>
                  {(selectedShiftForDetail.cashDifference || 0) === 0
                    ? 'Rp 0 (Pas)'
                    : `Rp ${selectedShiftForDetail.cashDifference?.toLocaleString('id-ID')}`}
                </strong>
              </div>
            </div>

            {/* Cash Movements List */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>
                Audit Mutasi Kas Kecil (Petty Cash)
              </h4>
              {(!selectedShiftForDetail.cashMovements || selectedShiftForDetail.cashMovements.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Tidak ada pengeluaran kas kecil atau penambahan modal pada shift ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {selectedShiftForDetail.cashMovements.map(m => (
                    <div
                      key={m.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${m.type === 'CASH_IN' ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.7rem' }}>
                            {m.type === 'CASH_IN' ? '+ KAS MASUK' : '- KAS KELUAR'}
                          </span>
                          <strong>{m.category}</strong>
                        </div>
                        {m.notes && (
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '3px' }}>
                            Keterangan: "{m.notes}"
                          </div>
                        )}
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '2px' }}>
                          Oleh: {m.userName || 'Kasir'} • {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>

                      <div style={{
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: m.type === 'CASH_IN' ? '#34d399' : '#fb7185'
                      }}>
                        {m.type === 'CASH_IN' ? '+' : '-'}Rp {m.amount?.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {onPrintShiftReceipt && (
                <button
                  onClick={() => onPrintShiftReceipt(selectedShiftForDetail)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <Printer size={16} />
                  <span>Cetak Struk Rekap ({selectedShiftForDetail.status === 'CLOSED' ? 'Z-Report' : 'X-Report'})</span>
                </button>
              )}
              <button onClick={() => setSelectedShiftForDetail(null)} className="btn btn-outline">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT PRINT MODAL (A4 & PDF) */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Laporan Rekonsiliasi Kas & Akuntabilitas Shift Kasir"
        subtitle={`Audit Mutasi Kas Kecil, Modal Awal, dan Selisih Kas Fisik • ${shifts.length} Sesi Shift`}
        dateRange={shifts.length > 0 ? `${formatDateIndo(shifts[shifts.length - 1]?.openedAt)} s/d ${formatDateIndo(shifts[0]?.openedAt)}` : '-'}
        kpiSummary={[
          { label: 'Total Sesi Shift', value: `${shifts.length} Sesi` },
          { label: 'Total Modal Awal', value: formatRupiah(shifts.reduce((sum, s) => sum + (s.startCash || 0), 0)) },
          { label: 'Total Kas Masuk', value: formatRupiah(shifts.reduce((sum, s) => sum + (s.totalCashIn || 0), 0)) },
          { label: 'Total Kas Keluar', value: formatRupiah(shifts.reduce((sum, s) => sum + (s.totalCashOut || 0), 0)) }
        ]}
        columns={[
          { header: 'ID SHIFT', key: 'id', formatter: v => `SHF-${String(v).padStart(4, '0')}`, isBold: true },
          { header: 'KASIR', key: 'cashierName' },
          { header: 'BUKA SHIFT', key: 'openedAt', formatter: v => v ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-' },
          { header: 'TUTUP SHIFT', key: 'closedAt', formatter: v => v ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Aktif' },
          { header: 'MODAL AWAL', key: 'startCash', align: 'right', formatter: formatRupiah },
          { header: 'KAS MASUK', key: 'totalCashIn', align: 'right', formatter: formatRupiah },
          { header: 'KAS KELUAR', key: 'totalCashOut', align: 'right', formatter: formatRupiah },
          { header: 'ESTIMASI KAS', key: 'expectedCash', align: 'right', formatter: formatRupiah },
          { header: 'FISIK KAS', key: 'actualCash', align: 'right', formatter: v => v !== null && v !== undefined ? formatRupiah(v) : '-', isBold: true },
          { header: 'STATUS', key: 'status', align: 'center' }
        ]}
        data={shifts}
        onExportExcel={handleExportExcel}
      />
    </div>
  );
}
