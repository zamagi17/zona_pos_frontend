import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../utils/exportUtils';
import { ReportPrintModal } from './ReportPrintModal';
import {
  FileText,
  Printer,
  Download,
  RefreshCw,
  Search,
  Calendar,
  Building2,
  Truck,
  Warehouse,
  Store,
  Receipt,
  Check,
  Copy,
  DollarSign,
  Clock,
  User,
  X,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react';

export function PurchaseOrderJournalModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [storages, setStorages] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL'); // 'ALL' | 'STORAGE_X' | 'OUTLET_X'
  const [quickDateFilter, setQuickDateFilter] = useState('ALL'); // 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH' | 'ALL' | 'CUSTOM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Single PO Detail Modal
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Feedback
  const [copiedNo, setCopiedNo] = useState(null);

  // Load Reference Data (Suppliers, Storages, Outlets)
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      api.getSuppliers().catch(() => []),
      api.getStorages().catch(() => []),
      api.getOutlets().catch(() => []),
    ]).then(([sups, strs, outs]) => {
      setSuppliers(sups || []);
      setStorages(strs || []);
      setOutlets(outs || []);
    });
  }, [isOpen]);

  // Load Purchase Orders
  const loadPurchaseOrders = async (isRefresh = false) => {
    if (!isOpen) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (supplierFilter !== 'ALL') params.supplierId = supplierFilter;
      if (locationFilter.startsWith('STORAGE_')) params.storageId = locationFilter.replace('STORAGE_', '');
      if (locationFilter.startsWith('OUTLET_')) params.outletId = locationFilter.replace('OUTLET_', '');
      if (startDate) params.startDate = `${startDate}T00:00:00`;
      if (endDate) params.endDate = `${endDate}T23:59:59`;
      if (search.trim()) params.search = search.trim();

      const data = await api.getAllPurchaseOrders(params);
      setPurchaseOrders(data || []);
    } catch (err) {
      console.error('Gagal memuat buku register PO:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPurchaseOrders();
    }
  }, [isOpen, supplierFilter, locationFilter, startDate, endDate]);

  // Handle Quick Date Change
  const handleQuickDateChange = (type) => {
    setQuickDateFilter(type);
    const now = new Date();
    const formatYMD = (d) => d.toISOString().slice(0, 10);

    if (type === 'TODAY') {
      const todayStr = formatYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7DAYS') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(now));
    } else if (type === '30DAYS') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(now));
    } else if (type === 'MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(now));
    } else if (type === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered List Client-Side (for instant search typing)
  const filteredList = useMemo(() => {
    if (!search.trim()) return purchaseOrders;
    const q = search.trim().toLowerCase();
    return purchaseOrders.filter(po =>
      po.poNo?.toLowerCase().includes(q) ||
      po.invoiceNo?.toLowerCase().includes(q) ||
      po.productName?.toLowerCase().includes(q) ||
      po.supplierName?.toLowerCase().includes(q) ||
      po.userName?.toLowerCase().includes(q) ||
      po.remarks?.toLowerCase().includes(q)
    );
  }, [purchaseOrders, search]);

  // Financial KPIs
  const kpis = useMemo(() => {
    let totalCostSum = 0;
    let totalQtySum = 0;
    filteredList.forEach(po => {
      totalCostSum += (po.totalCost || 0);
      totalQtySum += (po.quantity || 0);
    });
    const poCount = filteredList.length;
    const avgPOCost = poCount > 0 ? Math.round(totalCostSum / poCount) : 0;
    return {
      totalCost: totalCostSum,
      totalQty: totalQtySum,
      poCount,
      avgPOCost
    };
  }, [filteredList]);

  // Copy PO No
  const handleCopy = (poNo) => {
    navigator.clipboard.writeText(poNo);
    setCopiedNo(poNo);
    setTimeout(() => setCopiedNo(null), 2000);
  };

  // Format Currency
  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  // Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const columns = [
      { header: 'No. PO', key: 'poNo' },
      { header: 'Tanggal PO', key: 'createdAt', formatter: v => formatDate(v) },
      { header: 'Supplier / Vendor', key: 'supplierName' },
      { header: 'Lokasi Penerima', key: 'location', formatter: (_, item) => item.storageName || item.outletName || '-' },
      { header: 'Nama Produk', key: 'productName' },
      { header: 'Varian', key: 'variantName', formatter: v => v || '-' },
      { header: 'Jumlah (Qty)', key: 'quantity' },
      { header: 'Harga Modal / Unit (Rp)', key: 'purchasePrice' },
      { header: 'Total Biaya Pengadaan (Rp)', key: 'totalCost' },
      { header: 'No. Faktur / Invoice', key: 'invoiceNo', formatter: v => v || '-' },
      { header: 'Petugas / Penerima', key: 'userName', formatter: v => v || '-' },
      { header: 'Catatan Remarks', key: 'remarks', formatter: v => v || '-' },
    ];

    exportToExcel({
      name: 'Jurnal-Pembelian-PO',
      columns,
      data: filteredList
    }, `jurnal-pembelian-po-${new Date().toISOString().slice(0, 10)}`);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1240px',
          height: '92vh',
          background: '#0a101f',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)', padding: '10px', borderRadius: '12px' }}>
              <Receipt size={24} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Buku Register & Jurnal Pembelian (Purchase Orders)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                Rekapitulasi seluruh pengadaan barang masuk, monitoring biaya modal supplier, dan cetak lembar audit
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Download Excel */}
            <button
              onClick={handleExportExcel}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', borderColor: '#10b981', color: '#10b981', padding: '8px 12px' }}
              title="Ekspor seluruh data ke file Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>Download Excel</span>
            </button>

            {/* Cetak Rekap PO PDF */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              title="Cetak Laporan Rekapitulasi Pembelian Format A4"
            >
              <Printer size={15} />
              <span>Cetak Rekap PO</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadPurchaseOrders(true)}
              disabled={refreshing}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', padding: '8px 12px' }}
              title="Muat ulang data PO"
            >
              <RefreshCw size={15} className={refreshing ? 'spin-animation' : ''} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'var(--text-muted)',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
              }}
              title="Tutup Jurnal PO"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* 1. FINANCIAL SUMMARY KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {/* Total Belanja Pengadaan */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <DollarSign size={24} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>TOTAL MODAL PENGADAAN</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399' }}>
                  {formatRupiah(kpis.totalCost)}
                </div>
              </div>
            </div>

            {/* Total Dokumen PO */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <FileText size={24} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL DOKUMEN PO</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {kpis.poCount} Dokumen
                </div>
              </div>
            </div>

            {/* Total Barang Masuk */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <Truck size={24} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#fcd34d', fontWeight: 600 }}>TOTAL BARANG MASUK</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>
                  {kpis.totalQty.toLocaleString('id-ID')} Unit
                </div>
              </div>
            </div>

            {/* Rata-Rata Nilai PO */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <Clock size={24} color="#22d3ee" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#67e8f9', fontWeight: 600 }}>RATA-RATA NILAI PER PO</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#22d3ee' }}>
                  {formatRupiah(kpis.avgPOCost)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. FILTER & SEARCH TOOLBAR */}
          <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Cari No. PO, No. Faktur, Nama Barang, Supplier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Quick Date Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { id: 'ALL', label: 'Semua Waktu' },
                  { id: 'TODAY', label: 'Hari Ini' },
                  { id: '7DAYS', label: '7 Hari' },
                  { id: '30DAYS', label: '30 Hari' },
                  { id: 'MONTH', label: 'Bulan Ini' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleQuickDateChange(p.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: quickDateFilter === p.id ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      background: quickDateFilter === p.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                      color: quickDateFilter === p.id ? '#34d399' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Second Row Filters: Supplier, Location, Custom Dates */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {/* Supplier Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Supplier:</span>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">Semua Pemasok / Vendor</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Lokasi Penerima:</span>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">Semua Gudang & Toko</option>
                  {storages.map(st => (
                    <option key={`str_${st.id}`} value={`STORAGE_${st.id}`}>Gudang: {st.name}</option>
                  ))}
                  {outlets.map(ot => (
                    <option key={`out_${ot.id}`} value={`OUTLET_${ot.id}`}>Outlet: {ot.name}</option>
                  ))}
                </select>
              </div>

              {/* Custom Date Pickers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setQuickDateFilter('CUSTOM');
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.75rem',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>s/d:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setQuickDateFilter('CUSTOM');
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.75rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. MAIN PURCHASE ORDERS DATA TABLE */}
          <div className="glass-panel" style={{ padding: '16px', overflowX: 'auto', minHeight: '300px' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>
                <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 10px' }} />
                <div>Memuat buku register purchase order...</div>
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Receipt size={42} color="#64748b" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0' }}>Tidak Ada Dokumen PO Ditemukan</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto' }}>
                  {search || supplierFilter !== 'ALL' || startDate || endDate
                    ? 'Tidak ada purchase order yang cocok dengan kriteria filter yang Anda pilih.'
                    : 'Belum ada transaksi pengadaan barang masuk tercatat. Tekan "Barang Masuk (Supplier)" untuk mencatat PO baru.'}
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                    <th style={{ padding: '10px 12px' }}>NO. DOKUMEN PO</th>
                    <th style={{ padding: '10px 12px' }}>TANGGAL / WAKTU</th>
                    <th style={{ padding: '10px 12px' }}>SUPPLIER / VENDOR</th>
                    <th style={{ padding: '10px 12px' }}>LOKASI MASUK</th>
                    <th style={{ padding: '10px 12px' }}>PRODUK & VARIAN</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>JUMLAH (QTY)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>HARGA BELI</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>TOTAL BIAYA</th>
                    <th style={{ padding: '10px 12px' }}>NO. FAKTUR</th>
                    <th style={{ padding: '10px 12px' }}>PENERIMA</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((po, idx) => (
                    <tr
                      key={po.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* No. PO */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            onClick={() => setSelectedPOForDetail(po)}
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: '#34d399',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textUnderlineOffset: '3px',
                            }}
                            title="Klik untuk melihat faktur PO"
                          >
                            {po.poNo}
                          </span>
                          <button
                            onClick={() => handleCopy(po.poNo)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                            title="Salin No. PO"
                          >
                            {copiedNo === po.poNo ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(po.createdAt)}
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{po.supplierName || 'Vendor'}</div>
                      </td>

                      {/* Lokasi Masuk */}
                      <td style={{ padding: '10px 12px' }}>
                        {po.storageName ? (
                          <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '0.72rem' }}>
                            <Warehouse size={11} />
                            <span>Gudang: {po.storageName}</span>
                          </span>
                        ) : po.outletName ? (
                          <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '0.72rem' }}>
                            <Store size={11} />
                            <span>Toko: {po.outletName}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>-</span>
                        )}
                      </td>

                      {/* Produk */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{po.productName || 'Produk'}</div>
                        {po.variantName && (
                          <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600 }}>
                            Varian: {po.variantName}
                          </span>
                        )}
                      </td>

                      {/* Qty */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          +{po.quantity}
                        </span>
                      </td>

                      {/* Harga Satuan */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {formatRupiah(po.purchasePrice)}
                      </td>

                      {/* Total Biaya */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>
                          {formatRupiah(po.totalCost)}
                        </strong>
                      </td>

                      {/* No Faktur */}
                      <td style={{ padding: '10px 12px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {po.invoiceNo || '-'}
                      </td>

                      {/* Petugas */}
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                        {po.userName || '-'}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedPOForDetail(po)}
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            fontSize: '0.75rem',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                          title="Lihat Rincian Faktur PO"
                        >
                          <Eye size={13} />
                          <span>Faktur</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ color: 'var(--text-muted)' }}>
            Menampilkan <strong>{filteredList.length}</strong> dokumen PO • Total Belanja:{' '}
            <strong style={{ color: '#34d399' }}>{formatRupiah(kpis.totalCost)}</strong>
          </div>

          <button
            onClick={onClose}
            className="btn"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', padding: '6px 16px' }}
          >
            Tutup Jurnal
          </button>
        </div>
      </div>

      {/* 4. DETAIL FAKTUR PURCHASE ORDER MODAL */}
      {selectedPOForDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#0d1526',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header Dokumen PO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <span className="badge badge-emerald" style={{ fontSize: '0.72rem', marginBottom: '6px' }}>
                  PURCHASE ORDER RESMI
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'monospace', color: '#34d399', margin: '4px 0 0 0' }}>
                  {selectedPOForDetail.poNo}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Dibuat pada: {formatDate(selectedPOForDetail.createdAt)}
                </div>
              </div>

              <button
                onClick={() => setSelectedPOForDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Vendor & Lokasi Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>VENDOR / SUPPLIER</div>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {selectedPOForDetail.supplierName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>LOKASI PENERIMA</div>
                <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>
                  {selectedPOForDetail.storageName ? `Gudang: ${selectedPOForDetail.storageName}` : `Outlet: ${selectedPOForDetail.outletName}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>NO. INVOICE VENDOR</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                  {selectedPOForDetail.invoiceNo || '-'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>PETUGAS PENERIMA</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                  {selectedPOForDetail.userName || '-'}
                </div>
              </div>
            </div>

            {/* Rincian Barang */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                ITEM BARANG MASUK
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedPOForDetail.productName}</strong>
                    {selectedPOForDetail.variantName && (
                      <span style={{ fontSize: '0.75rem', color: '#818cf8', marginLeft: '6px' }}>
                        ({selectedPOForDetail.variantName})
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 800, color: '#fbbf24' }}>
                    +{selectedPOForDetail.quantity} Unit
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Harga Modal Beli / Satuan:</span>
                  <span>{formatRupiah(selectedPOForDetail.purchasePrice)}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: '#34d399',
                    borderTop: '1px dashed rgba(255,255,255,0.1)',
                    paddingTop: '8px',
                    marginTop: '4px',
                  }}
                >
                  <span>Total Biaya Pengadaan:</span>
                  <span>{formatRupiah(selectedPOForDetail.totalCost)}</span>
                </div>
              </div>
            </div>

            {/* Catatan Remarks */}
            {selectedPOForDetail.remarks && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--text-dim)' }}>Catatan:</strong> {selectedPOForDetail.remarks}
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setSelectedPOForDetail(null)}
                className="btn"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)' }}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={15} />
                <span>Cetak Faktur PO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CETAK REKAPITULASI PO MODAL (A4 PRINT ENGINE) */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Laporan Jurnal Rekapitulasi Purchase Order (PO)"
        subtitle="Daftar Pengadaan Barang Masuk dari Mitra Supplier / Vendor"
        dateRange={
          startDate && endDate
            ? `${formatDate(startDate)} s/d ${formatDate(endDate)}`
            : quickDateFilter === 'ALL'
            ? 'Seluruh Periode Pembelian'
            : quickDateFilter
        }
        kpiSummary={[
          { label: 'Total Modal Pengadaan', value: formatRupiah(kpis.totalCost), color: '#10b981' },
          { label: 'Total Dokumen PO', value: `${kpis.poCount} Dokumen`, color: '#6366f1' },
          { label: 'Total Barang Masuk', value: `${kpis.totalQty.toLocaleString('id-ID')} Unit`, color: '#f59e0b' },
          { label: 'Rata-rata Nilai PO', value: formatRupiah(kpis.avgPOCost), color: '#06b6d4' },
        ]}
        columns={[
          { header: 'No. PO', key: 'poNo' },
          { header: 'Tanggal', key: 'createdAt', formatter: v => formatDate(v) },
          { header: 'Supplier', key: 'supplierName' },
          { header: 'Lokasi', key: 'location', formatter: (_, item) => item.storageName || item.outletName || '-' },
          { header: 'Barang', key: 'productName' },
          { header: 'Qty', key: 'quantity' },
          { header: 'Harga Modal', key: 'purchasePrice', formatter: v => formatRupiah(v) },
          { header: 'Total Biaya', key: 'totalCost', formatter: v => formatRupiah(v) },
          { header: 'Faktur', key: 'invoiceNo', formatter: v => v || '-' },
          { header: 'Penerima', key: 'userName', formatter: v => v || '-' },
        ]}
        data={filteredList}
        footerSummary={[
          { label: 'Akumulasi Biaya Pengadaan', value: formatRupiah(kpis.totalCost) },
          { label: 'Total Kuantitas Masuk', value: `${kpis.totalQty.toLocaleString('id-ID')} Unit` },
        ]}
        excelFilename="laporan-rekap-purchase-orders"
      />
    </div>
  );
}
