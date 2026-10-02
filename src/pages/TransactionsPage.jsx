import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ReceiptModal } from '../components/ReceiptModal';
import { 
  Search, RotateCcw, Printer, FileText, CheckCircle2, 
  AlertTriangle, Clock, RefreshCw, X, ChevronRight, FileSpreadsheet 
} from 'lucide-react';
import { exportToExcel, formatRupiah, formatDateIndo } from '../utils/exportUtils';
import { ReportPrintModal } from '../components/ReportPrintModal';

export function TransactionsPage() {
  const { user, selectedOutletId } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState(null);

  // Print Report Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedTrxForRefund, setSelectedTrxForRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  // Detail Modal State
  const [detailModalTrx, setDetailModalTrx] = useState(null);

  const isOwnerOrManager = user?.role === 'ROLE_TENANT_OWNER' || user?.role === 'ROLE_OUTLET_MANAGER';
  const outletId = selectedOutletId || user?.outletId;

  const loadTransactions = () => {
    if (!outletId) return;
    setLoading(true);
    api.getTransactions(outletId, statusFilter)
      .then(res => setTransactions(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions();
  }, [outletId, statusFilter]);

  const handleOpenRefund = (trx) => {
    setSelectedTrxForRefund(trx);
    setRefundReason('Permintaan retur pelanggan / salah input');
    setIsRefundModalOpen(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedTrxForRefund) return;
    try {
      setRefundLoading(true);
      await api.refund(selectedTrxForRefund.id, { reason: refundReason });
      alert(`Transaksi ${selectedTrxForRefund.trxNo} berhasil di-refund! Stok telah dikembalikan ke inventaris outlet secara otomatis.`);
      setIsRefundModalOpen(false);
      loadTransactions();
    } catch (err) {
      alert(err.message || 'Gagal memproses refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (t.trxNo && t.trxNo.toLowerCase().includes(q)) ||
           (t.customerName && t.customerName.toLowerCase().includes(q)) ||
           (t.cashierName && t.cashierName.toLowerCase().includes(q));
  });

  const totalOmset = filteredTransactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  const totalCount = filteredTransactions.length;
  const completedCount = filteredTransactions.filter(t => t.status === 'COMPLETED').length;
  const refundedCount = filteredTransactions.filter(t => t.status === 'REFUNDED').length;

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const columns = [
      { header: 'No. Transaksi', key: 'trxNo' },
      { header: 'Waktu Transaksi', key: 'createdAt', formatter: v => v ? new Date(v).toLocaleString('id-ID') : '-' },
      { header: 'Nama Kasir', key: 'cashierName' },
      { header: 'Pelanggan', key: 'customerName', formatter: v => v || 'Pelanggan Umum' },
      { header: 'Subtotal (Rp)', key: 'subtotal' },
      { header: 'Diskon Nota (Rp)', key: 'orderDiscount' },
      { header: 'Kode Voucher', key: 'voucherCode', formatter: v => v || '-' },
      { header: 'Diskon Voucher (Rp)', key: 'voucherDiscount' },
      { header: 'Pajak (Rp)', key: 'tax' },
      { header: 'Grand Total (Rp)', key: 'grandTotal' },
      { header: 'Status', key: 'status' }
    ];

    exportToExcel({
      name: 'Buku Jurnal Penjualan',
      columns,
      data: filteredTransactions
    }, `Buku_Jurnal_Penjualan_Outlet${outletId}`);
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Riwayat Penjualan & Transaksi Kasir</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Audit trail transaksi, cetak ulang struk kasir, dan penanganan refund / retur produk</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={loadTransactions} className="btn btn-outline" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
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
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>TOTAL PENJUALAN BERSIH</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
            Rp {totalOmset.toLocaleString('id-ID')}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status COMPLETED</span>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>JUMLAH TRANSAKSI</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalCount}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{completedCount} Sukses · {refundedCount} Refund</span>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>TRANSAKSI REFUND</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>
            {refundedCount}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stok dipulihkan otomatis</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari No. Trx (misal TRX-...), pelanggan, atau kasir..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: '', label: 'Semua Status' },
            { id: 'COMPLETED', label: 'Sukses (COMPLETED)' },
            { id: 'REFUNDED', label: 'Refund' },
            { id: 'DRAFT', label: 'Draft (Parkir)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: statusFilter === f.id ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: statusFilter === f.id ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: '20px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>NO. TRANSAKSI</th>
                <th style={{ padding: '12px' }}>WAKTU TRANSAKSI</th>
                <th style={{ padding: '12px' }}>KASIR / OPERATOR</th>
                <th style={{ padding: '12px' }}>PELANGGAN</th>
                <th style={{ padding: '12px' }}>METODE PEMBAYARAN</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>GRAND TOTAL</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const isCompleted = t.status === 'COMPLETED';
                  const isRefunded = t.status === 'REFUNDED';
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#38bdf8' }}>
                        {t.trxNo}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: 600 }}>{t.cashierName || 'Kasir'}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: t.customerName ? '#a78bfa' : 'var(--text-dim)' }}>
                          {t.customerName || 'Umum'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                          {t.paymentMethod || 'CASH'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, fontSize: '0.92rem', color: isRefunded ? '#f43f5e' : '#34d399' }}>
                        {isRefunded && '- '}Rp {(t.grandTotal || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span className={`badge ${isCompleted ? 'badge-emerald' : isRefunded ? 'badge-rose' : 'badge-amber'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* Struk / Detail Button */}
                          <button
                            onClick={() => setSelectedTrxForReceipt(t)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            title="Cetak Ulang Struk Thermal"
                          >
                            <Printer size={13} color="#10b981" />
                            <span>Struk</span>
                          </button>

                          {/* Detail Items Button */}
                          <button
                            onClick={() => setDetailModalTrx(t)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            title="Lihat Detail Item"
                          >
                            <FileText size={13} />
                            <span>Item</span>
                          </button>

                          {/* Refund Button for Completed Trx */}
                          {isCompleted && isOwnerOrManager && (
                            <button
                              onClick={() => handleOpenRefund(t)}
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e' }}
                              title="Refund / Batalkan Transaksi dan Kembalikan Stok"
                            >
                              <RotateCcw size={13} color="#f43f5e" />
                              <span>Refund</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL ITEMS MODAL */}
      {detailModalTrx && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Detail Transaksi: {detailModalTrx.trxNo}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(detailModalTrx.createdAt).toLocaleString('id-ID')} · Kasir: {detailModalTrx.cashierName}
                </span>
              </div>
              <button onClick={() => setDetailModalTrx(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '8px' }}>ITEM PRODUK</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>QTY</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>HARGA</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModalTrx.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 700 }}>{item.productName}</div>
                        {item.variantName && <div style={{ fontSize: '0.7rem', color: '#6366f1' }}>Varian: {item.variantName}</div>}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>Rp {item.unitPrice?.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span>Rp {(detailModalTrx.subtotal || 0).toLocaleString('id-ID')}</span>
              </div>
              {detailModalTrx.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                  <span>Diskon:</span>
                  <span>- Rp {detailModalTrx.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {detailModalTrx.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Pajak (PPN):</span>
                  <span>+ Rp {detailModalTrx.tax.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: '#10b981', marginTop: '4px' }}>
                <span>Grand Total:</span>
                <span>Rp {(detailModalTrx.grandTotal || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setDetailModalTrx(null)} className="btn btn-outline">
                Tutup
              </button>
              <button
                onClick={() => {
                  setSelectedTrxForReceipt(detailModalTrx);
                  setDetailModalTrx(null);
                }}
                className="btn btn-primary"
              >
                <Printer size={15} />
                <span>Cetak Struk Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND CONFIRMATION MODAL */}
      {isRefundModalOpen && selectedTrxForRefund && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(244,63,94,0.2)', padding: '6px', borderRadius: '8px' }}>
                  <RotateCcw size={18} color="#f43f5e" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f43f5e' }}>Konfirmasi Refund Transaksi</h3>
              </div>
              <button onClick={() => setIsRefundModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', padding: '12px', fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Nomor Transaksi: {selectedTrxForRefund.trxNo}</div>
                <div>Total Dana yang Dikembalikan: <strong style={{ color: '#f43f5e' }}>Rp {(selectedTrxForRefund.grandTotal || 0).toLocaleString('id-ID')}</strong></div>
                <div style={{ marginTop: '6px', color: 'var(--text-dim)' }}>
                  Perhatian: Aksi ini akan mengembalikan seluruh stok barang pada transaksi ini ke inventaris outlet dengan locking aman (`SELECT FOR UPDATE`).
                </div>
              </div>

              <div>
                <label className="form-label">Alasan Pengembalian (Refund Reason)</label>
                <textarea
                  required
                  rows="3"
                  className="form-input"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Contoh: Barang cacat pabrik, salah beli varian, dsb..."
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsRefundModalOpen(false)} className="btn btn-outline" disabled={refundLoading}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#f43f5e', borderColor: '#f43f5e' }}
                  disabled={refundLoading}
                >
                  {refundLoading ? 'Memproses...' : 'Eksekusi Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPRINT RECEIPT MODAL */}
      {selectedTrxForReceipt && (
        <ReceiptModal
          isOpen={true}
          transaction={selectedTrxForReceipt}
          onClose={() => setSelectedTrxForReceipt(null)}
        />
      )}

      {/* A4 REPORT PRINT MODAL (PDF & EXCEL) */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Buku Jurnal Penjualan Kasir (Sales Journal)"
        subtitle={`Rekapitulasi Transaksi Penjualan • ${filteredTransactions.length} Transaksi Terpilih`}
        dateRange={filteredTransactions.length > 0 ? `${formatDateIndo(filteredTransactions[filteredTransactions.length - 1]?.createdAt)} s/d ${formatDateIndo(filteredTransactions[0]?.createdAt)}` : '-'}
        kpiSummary={[
          { label: 'Total Penjualan Selesai', value: formatRupiah(totalOmset), highlight: true },
          { label: 'Total Transaksi', value: `${totalCount} Nota` },
          { label: 'Transaksi Selesai', value: `${completedCount} Nota` },
          { label: 'Transaksi Refund', value: `${refundedCount} Nota` }
        ]}
        columns={[
          { header: 'NO. TRX', key: 'trxNo', isBold: true },
          { header: 'WAKTU', key: 'createdAt', formatter: v => v ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-' },
          { header: 'KASIR', key: 'cashierName' },
          { header: 'PELANGGAN', key: 'customerName', formatter: v => v || 'Umum' },
          { header: 'SUBTOTAL', key: 'subtotal', align: 'right', formatter: formatRupiah },
          { header: 'DISKON', key: 'orderDiscount', align: 'right', formatter: v => v ? `-${formatRupiah(v)}` : '-' },
          { header: 'PAJAK', key: 'tax', align: 'right', formatter: formatRupiah },
          { header: 'TOTAL', key: 'grandTotal', align: 'right', formatter: formatRupiah, isBold: true },
          { header: 'STATUS', key: 'status', align: 'center' }
        ]}
        data={filteredTransactions}
        footerSummary={[
          { label: 'TOTAL TERPILIH', value: `${filteredTransactions.length} Transaksi`, colSpan: 4 },
          { label: 'TOTAL OMSET', value: formatRupiah(totalOmset), align: 'right', colSpan: 4 },
          { value: '', colSpan: 1 }
        ]}
        onExportExcel={handleExportExcel}
      />
    </div>
  );
}
