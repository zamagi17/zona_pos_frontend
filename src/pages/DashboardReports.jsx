import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  TrendingUp, DollarSign, ShoppingBag, Percent, RotateCcw, 
  AlertTriangle, Calendar, FileSpreadsheet, Printer, RefreshCw 
} from 'lucide-react';
import { exportToExcel, formatRupiah, formatDateIndo } from '../utils/exportUtils';
import { ReportPrintModal } from '../components/ReportPrintModal';

export function DashboardReports() {
  const { user, selectedOutletId } = useAuth();
  const [salesReport, setSalesReport] = useState(null);
  const [profitReport, setGrossProfitReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Date range filter
  const [datePreset, setDatePreset] = useState('30days');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Refund state
  const [refundTrxId, setRefundTrxId] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const outletId = selectedOutletId || user?.outletId;
  const isOwnerOrManager = user?.role === 'ROLE_TENANT_OWNER' || user?.role === 'ROLE_OUTLET_MANAGER';

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      const past = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      setStartDate(past);
      setEndDate(today);
    } else if (preset === '30days') {
      const past = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      setStartDate(past);
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(today);
    }
  };

  const loadReports = () => {
    if (!outletId) return;
    setLoading(true);

    Promise.all([
      api.getSalesReport(outletId, startDate, endDate),
      api.getGrossProfitReport(outletId, startDate, endDate),
      api.getTransactions(outletId),
    ])
      .then(([sales, profit, trxs]) => {
        setSalesReport(sales);
        setGrossProfitReport(profit);
        setTransactions(trxs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (outletId) {
      loadReports();
    }
  }, [outletId, startDate, endDate]);

  const handleExportExcel = () => {
    if (!salesReport && !profitReport) {
      alert('Data laporan belum siap untuk diekspor.');
      return;
    }

    const sheet1 = {
      name: 'Ringkasan Omset & Laba',
      data: [
        { 'PARAMETER': 'Periode Laporan', 'NILAI / JUMLAH': `${startDate} s/d ${endDate}` },
        { 'PARAMETER': 'Outlet ID / Cabang', 'NILAI / JUMLAH': user?.outletName || `Outlet ${outletId}` },
        { 'PARAMETER': 'Total Transaksi Selesai', 'NILAI / JUMLAH': salesReport?.totalTransactions || 0 },
        { 'PARAMETER': 'Total Omset Bersih (Net Sales)', 'NILAI / JUMLAH': salesReport?.totalNetSales || 0 },
        { 'PARAMETER': 'Total Laba Kotor (Gross Profit)', 'NILAI / JUMLAH': profitReport?.totalGrossProfit || 0 },
        { 'PARAMETER': 'Margin Laba Rata-rata (%)', 'NILAI / JUMLAH': `${profitReport?.grossProfitMarginPercentage?.toFixed(2) || 0}%` },
        { 'PARAMETER': 'Total Penjualan Tunai (CASH)', 'NILAI / JUMLAH': salesReport?.totalCashSales || 0 },
        { 'PARAMETER': 'Total Penjualan QRIS', 'NILAI / JUMLAH': salesReport?.totalQrisSales || 0 },
        { 'PARAMETER': 'Total Penjualan Debit EDC', 'NILAI / JUMLAH': salesReport?.totalDebitSales || 0 },
        { 'PARAMETER': 'Total Penjualan Transfer Bank', 'NILAI / JUMLAH': salesReport?.totalTransferSales || 0 },
      ]
    };

    const sheet2 = {
      name: 'Rincian Margin Produk (COGS)',
      data: (profitReport?.productBreakdown || []).map((p, idx) => ({
        'No': idx + 1,
        'Nama Produk': p.productName,
        'Qty Terjual': p.quantitySold,
        'Total Pendapatan (Rp)': p.totalRevenue || 0,
        'Biaya Modal HPP (Rp)': p.totalCost || 0,
        'Laba Kotor (Rp)': p.grossProfit || 0,
        'Margin (%)': Number(p.marginPercentage?.toFixed(1) || 0)
      }))
    };

    const sheet3 = {
      name: 'Audit Transaksi Kasir',
      data: transactions.map((t, idx) => ({
        'No': idx + 1,
        'No Transaksi': t.trxNo,
        'Waktu': t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : '-',
        'Kasir': t.cashierName || '-',
        'Pelanggan': t.customerName || 'Umum',
        'Subtotal (Rp)': t.subtotal || 0,
        'Diskon Nota (Rp)': t.orderDiscount || 0,
        'Kode Voucher': t.voucherCode || '-',
        'Diskon Voucher (Rp)': t.voucherDiscount || 0,
        'Pajak (Rp)': t.tax || 0,
        'Grand Total (Rp)': t.grandTotal || 0,
        'Status': t.status
      }))
    };

    exportToExcel([sheet1, sheet2, sheet3], `Laporan_Keuangan_ZonaPOS_Outlet${outletId}`);
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refundTrxId) return;
    try {
      setRefundLoading(true);
      await api.refund(refundTrxId, { reason: refundReason });
      alert('Transaksi berhasil di-refund. Stok telah dikembalikan ke inventaris.');
      setRefundTrxId(null);
      setRefundReason('');
      loadReports();
    } catch (err) {
      alert(err.message);
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      {/* Header & Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Laporan Penjualan & Performa</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
            Ringkasan omset penjualan, analisis laba kotor (gross profit), dan rincian margin per produk.
          </p>

          {/* Quick Date Presets Bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Periode:</span>
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              style={{
                background: datePreset === 'today' ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: datePreset === 'today' ? '#0f172a' : 'var(--text-muted)',
                fontWeight: datePreset === 'today' ? 700 : 500,
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('7days')}
              style={{
                background: datePreset === '7days' ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: datePreset === '7days' ? '#0f172a' : 'var(--text-muted)',
                fontWeight: datePreset === '7days' ? 700 : 500,
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('30days')}
              style={{
                background: datePreset === '30days' ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: datePreset === '30days' ? '#0f172a' : 'var(--text-muted)',
                fontWeight: datePreset === '30days' ? 700 : 500,
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              30 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('thisMonth')}
              style={{
                background: datePreset === 'thisMonth' ? '#10b981' : 'rgba(255,255,255,0.05)',
                color: datePreset === 'thisMonth' ? '#0f172a' : 'var(--text-muted)',
                fontWeight: datePreset === 'thisMonth' ? 700 : 500,
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Bulan Ini
            </button>

            {/* Custom Date Pickers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  padding: '4px 8px',
                  fontSize: '0.75rem'
                }}
              />
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  padding: '4px 8px',
                  fontSize: '0.75rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Excel, PDF, Refresh */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadReports}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Total Omset Bersih */}
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL OMSET BERSIH</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>
            Rp {salesReport?.totalNetSales?.toLocaleString('id-ID') || '0'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Dari {salesReport?.totalTransactions || 0} transaksi berhasil</span>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>LABA KOTOR (PROFIT)</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#818cf8' }}>
            Rp {profitReport?.totalGrossProfit?.toLocaleString('id-ID') || '0'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Margin: {profitReport?.grossProfitMarginPercentage?.toFixed(1) || 0}% dari omset</span>
        </div>

        {/* Pembayaran Tunai vs Digital */}
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>METODE PEMBAYARAN</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <ShoppingBag size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cash:</span>
              <strong>Rp {salesReport?.totalCashSales?.toLocaleString('id-ID') || '0'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>QRIS:</span>
              <strong>Rp {salesReport?.totalQrisSales?.toLocaleString('id-ID') || '0'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Debit/Transfer:</span>
              <strong>Rp {((salesReport?.totalDebitSales || 0) + (salesReport?.totalTransferSales || 0)).toLocaleString('id-ID')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Product Profit Margin Breakdown */}
      {profitReport?.productBreakdown && profitReport.productBreakdown.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>Rincian Profit Margin per Produk (COGS)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '10px 12px' }}>PRODUK</th>
                  <th style={{ padding: '10px 12px' }}>TERJUAL</th>
                  <th style={{ padding: '10px 12px' }}>TOTAL PENDAPATAN</th>
                  <th style={{ padding: '10px 12px' }}>BIAYA MODAL (COGS)</th>
                  <th style={{ padding: '10px 12px' }}>LABA KOTOR</th>
                  <th style={{ padding: '10px 12px' }}>MARGIN</th>
                </tr>
              </thead>
              <tbody>
                {profitReport.productBreakdown.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ padding: '10px 12px' }}>{item.quantitySold} unit</td>
                    <td style={{ padding: '10px 12px' }}>Rp {item.totalRevenue?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 12px' }}>Rp {item.totalCost?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#34d399' }}>
                      Rp {item.grossProfit?.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="badge badge-emerald">{item.marginPercentage?.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions List with Refund Feature */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>Riwayat Transaksi Penjualan</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '10px 12px' }}>NO. TRANSAKSI</th>
                <th style={{ padding: '10px 12px' }}>WAKTU</th>
                <th style={{ padding: '10px 12px' }}>PELANGGAN</th>
                <th style={{ padding: '10px 12px' }}>TOTAL</th>
                <th style={{ padding: '10px 12px' }}>STATUS</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{t.trxNo}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : '-'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{t.customerName || 'Umum'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 800 }}>Rp {t.grandTotal?.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${
                      t.status === 'COMPLETED' ? 'badge-emerald' :
                      t.status === 'DRAFT' ? 'badge-indigo' :
                      t.status === 'REFUNDED' ? 'badge-rose' : 'badge-amber'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    {t.status === 'COMPLETED' && isOwnerOrManager && (
                      <button
                        onClick={() => setRefundTrxId(t.id)}
                        className="btn btn-rose"
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      >
                        <RotateCcw size={13} />
                        <span>Refund</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REFUND MODAL */}
      {refundTrxId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <AlertTriangle size={20} color="#f43f5e" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Konfirmasi Refund Transaksi</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Status transaksi akan diubah menjadi <strong>REFUNDED</strong> dan seluruh kuantitas item akan secara otomatis dikembalikan ke stok outlet.
            </p>

            <form onSubmit={handleRefund}>
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Alasan Pembatalan / Refund</label>
                <textarea
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '80px' }}
                  placeholder="Contoh: Kesalahan pesanan pelanggan / barang ditukar"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setRefundTrxId(null)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" disabled={refundLoading} className="btn btn-rose">
                  {refundLoading ? 'Memproses...' : 'Proses Refund Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT PRINT MODAL (A4 & PDF) */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Laporan Kinerja Penjualan & Laba Kotor Toko"
        subtitle="Ringkasan Omset, Laba Kotor (Gross Profit), dan Rincian Margin Produk (COGS)"
        dateRange={`${startDate} s/d ${endDate}`}
        kpiSummary={[
          { label: 'Total Omset Bersih', value: formatRupiah(salesReport?.totalNetSales), highlight: true },
          { label: 'Laba Kotor (Gross Profit)', value: formatRupiah(profitReport?.totalGrossProfit), highlight: true },
          { label: 'Margin Rata-rata', value: `${profitReport?.grossProfitMarginPercentage?.toFixed(1) || 0}%` },
          { label: 'Total Transaksi', value: `${salesReport?.totalTransactions || 0} Trx` }
        ]}
        columns={[
          { header: 'NAMA PRODUK', key: 'productName', isBold: true },
          { header: 'QTY TERJUAL', key: 'quantitySold', align: 'center', formatter: v => `${v} unit` },
          { header: 'TOTAL OMSET', key: 'totalRevenue', align: 'right', formatter: formatRupiah },
          { header: 'MODAL (HPP)', key: 'totalCost', align: 'right', formatter: formatRupiah },
          { header: 'LABA KOTOR', key: 'grossProfit', align: 'right', formatter: formatRupiah, isBold: true },
          { header: 'MARGIN', key: 'marginPercentage', align: 'right', formatter: v => `${Number(v || 0).toFixed(1)}%` }
        ]}
        data={profitReport?.productBreakdown || []}
        footerSummary={[
          { label: 'TOTAL PRODUK', value: `${profitReport?.productBreakdown?.length || 0} Item Terjual`, colSpan: 2 },
          { label: 'OMSET', value: formatRupiah(salesReport?.totalNetSales), align: 'right' },
          { label: 'HPP', value: formatRupiah(profitReport?.totalGrossProfit ? (salesReport?.totalNetSales - profitReport?.totalGrossProfit) : 0), align: 'right' },
          { label: 'LABA', value: formatRupiah(profitReport?.totalGrossProfit), align: 'right' },
          { value: `${profitReport?.grossProfitMarginPercentage?.toFixed(1) || 0}%`, align: 'right' }
        ]}
        onExportExcel={handleExportExcel}
      />
    </div>
  );
}
