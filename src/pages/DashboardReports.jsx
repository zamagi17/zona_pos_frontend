import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TrendingUp, DollarSign, ShoppingBag, Percent, RotateCcw, AlertTriangle, Calendar } from 'lucide-react';

export function DashboardReports() {
  const { user, selectedOutletId } = useAuth();
  const [salesReport, setSalesReport] = useState(null);
  const [profitReport, setGrossProfitReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Refund state
  const [refundTrxId, setRefundTrxId] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const outletId = selectedOutletId || user?.outletId;
  const isOwnerOrManager = user?.role === 'ROLE_TENANT_OWNER' || user?.role === 'ROLE_OUTLET_MANAGER';

  const loadReports = () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    Promise.all([
      api.getSalesReport(outletId, thirtyDaysAgo, today),
      api.getGrossProfitReport(outletId, thirtyDaysAgo, today),
      api.getTransactions(outletId),
    ])
      .then(([sales, profit, trxs]) => {
        setSalesReport(sales);
        setGrossProfitReport(profit);
        setTransactions(trxs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (outletId) {
      loadReports();
    }
  }, [outletId]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Laporan Penjualan & Performa</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ringkasan omset penjualan dan analisis laba kotor 30 hari terakhir</p>
        </div>
        <button onClick={loadReports} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>
          Perbarui Data
        </button>
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
    </div>
  );
}
