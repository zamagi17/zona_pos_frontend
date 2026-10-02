import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  Store,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
  Table as TableIcon,
  HelpCircle
} from 'lucide-react';

export function PromotionsPage() {
  const { user, selectedOutletId } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE, EXPIRED, QUOTA_FULL
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, PERCENT, FIXED
  const [outletFilter, setOutletFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Feedback states
  const [copiedCode, setCopiedCode] = useState(null);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  // Default Form Structure
  const initialForm = {
    code: '',
    name: '',
    description: '',
    outletId: '',
    discountType: 'PERCENT',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    hasDateLimit: false,
    startDate: '',
    endDate: '',
    hasUsageLimit: false,
    usageLimit: '',
    isActive: true,
  };

  const [form, setForm] = useState(initialForm);

  // Load Data
  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [promoList, outletList] = await Promise.all([
        api.getAllPromotions(),
        api.getOutlets().catch(() => []),
      ]);
      setPromotions(promoList || []);
      setOutlets(outletList || []);
    } catch (err) {
      console.error('Gagal memuat data promosi:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to determine status and details
  const getPromoStatus = (promo) => {
    const now = new Date();
    const isExpired = promo.endDate && new Date(promo.endDate) < now;
    const notStarted = promo.startDate && new Date(promo.startDate) > now;
    const isQuotaFull = promo.usageLimit && (promo.timesUsed || 0) >= promo.usageLimit;

    if (!promo.isActive) {
      return { label: 'Non-Aktif', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', type: 'INACTIVE' };
    }
    if (isExpired) {
      return { label: 'Kedaluwarsa', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', type: 'EXPIRED' };
    }
    if (isQuotaFull) {
      return { label: 'Kuota Habis', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', type: 'QUOTA_FULL' };
    }
    if (notStarted) {
      return { label: 'Akan Datang', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', type: 'UPCOMING' };
    }
    return { label: 'Aktif', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', type: 'ACTIVE' };
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = promotions.length;
    let active = 0;
    let expiredOrFull = 0;
    let totalTimesUsed = 0;

    promotions.forEach(p => {
      totalTimesUsed += (p.timesUsed || 0);
      const status = getPromoStatus(p);
      if (status.type === 'ACTIVE') active++;
      if (status.type === 'EXPIRED' || status.type === 'QUOTA_FULL') expiredOrFull++;
    });

    return { total, active, expiredOrFull, totalTimesUsed };
  }, [promotions]);

  // Filtered List
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      // Search
      const searchMatch =
        !searchTerm ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Status Filter
      const status = getPromoStatus(p);
      if (statusFilter === 'ACTIVE' && status.type !== 'ACTIVE') return false;
      if (statusFilter === 'INACTIVE' && promo.isActive) return false;
      if (statusFilter === 'EXPIRED' && status.type !== 'EXPIRED') return false;
      if (statusFilter === 'QUOTA_FULL' && status.type !== 'QUOTA_FULL') return false;

      // Discount Type Filter
      if (typeFilter !== 'ALL' && p.discountType !== typeFilter) return false;

      // Outlet Filter
      if (outletFilter !== 'ALL') {
        if (outletFilter === 'GLOBAL' && p.outletId !== null) return false;
        if (outletFilter !== 'GLOBAL' && String(p.outletId) !== String(outletFilter)) return false;
      }

      return true;
    });
  }, [promotions, searchTerm, statusFilter, typeFilter, outletFilter]);

  // Copy code handler
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Instant Toggle Status
  const handleToggleStatus = async (promo) => {
    setToggleLoadingId(promo.id);
    try {
      const updated = await api.togglePromotionStatus(promo.id);
      setPromotions(prev => prev.map(p => (p.id === promo.id ? updated : p)));
    } catch (err) {
      alert(`Gagal mengubah status promo: ${err.message}`);
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPromo(null);
    setForm(initialForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code || '',
      name: promo.name || '',
      description: promo.description || '',
      outletId: promo.outletId ? String(promo.outletId) : '',
      discountType: promo.discountType || 'PERCENT',
      discountValue: promo.discountValue != null ? String(promo.discountValue) : '',
      minOrderAmount: promo.minOrderAmount != null && promo.minOrderAmount > 0 ? String(promo.minOrderAmount) : '',
      maxDiscountAmount: promo.maxDiscountAmount != null ? String(promo.maxDiscountAmount) : '',
      hasDateLimit: Boolean(promo.startDate || promo.endDate),
      startDate: promo.startDate ? promo.startDate.substring(0, 16) : '',
      endDate: promo.endDate ? promo.endDate.substring(0, 16) : '',
      hasUsageLimit: Boolean(promo.usageLimit && promo.usageLimit > 0),
      usageLimit: promo.usageLimit != null ? String(promo.usageLimit) : '',
      isActive: Boolean(promo.isActive),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Helper to generate quick promo code
  const handleGenerateCode = () => {
    const prefix = form.discountType === 'PERCENT' ? 'HEMAT' : 'POTONG';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, code: `${prefix}${rand}` }));
  };

  // Handle Form Submit
  const handleSavePromo = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validations
    if (!form.code.trim()) {
      setFormError('Kode kupon voucher wajib diisi.');
      return;
    }
    if (!form.name.trim()) {
      setFormError('Nama promosi wajib diisi.');
      return;
    }
    const val = Number(form.discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Nilai diskon harus berupa angka lebih besar dari 0.');
      return;
    }
    if (form.discountType === 'PERCENT' && val > 100) {
      setFormError('Diskon persentase tidak boleh lebih dari 100%.');
      return;
    }

    if (form.hasDateLimit && form.startDate && form.endDate) {
      if (new Date(form.endDate) <= new Date(form.startDate)) {
        setFormError('Tanggal berakhir harus lebih baru dari tanggal mulai.');
        return;
      }
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      outletId: form.outletId ? Number(form.outletId) : null,
      discountType: form.discountType,
      discountValue: val,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      maxDiscountAmount: form.discountType === 'PERCENT' && form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      startDate: form.hasDateLimit && form.startDate ? form.startDate : null,
      endDate: form.hasDateLimit && form.endDate ? form.endDate : null,
      usageLimit: form.hasUsageLimit && form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      isActive: form.isActive,
    };

    setFormSubmitting(true);
    try {
      if (editingPromo) {
        const updated = await api.updatePromotion(editingPromo.id, payload);
        setPromotions(prev => prev.map(p => (p.id === editingPromo.id ? updated : p)));
      } else {
        const created = await api.createPromotion(payload);
        setPromotions(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan voucher promosi.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (promo) => {
    setPromoToDelete(promo);
    setIsDeleteModalOpen(true);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!promoToDelete) return;
    try {
      await api.deletePromotion(promoToDelete.id);
      setPromotions(prev => prev.filter(p => p.id !== promoToDelete.id));
      setIsDeleteModalOpen(false);
      setPromoToDelete(null);
    } catch (err) {
      alert(`Gagal menghapus promo: ${err.message}`);
    }
  };

  // Format Helper for Currency
  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Format Helper for Date
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Outlet name resolver
  const getOutletName = (outletId) => {
    if (!outletId) return 'Semua Cabang (Nasional)';
    const found = outlets.find(o => o.id === outletId);
    return found ? found.name : `Cabang #${outletId}`;
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
      {/* 1. Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)', padding: '10px', borderRadius: '12px' }}>
              <Ticket size={24} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Manajemen Promosi & Voucher Diskon
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Kelola kupon belanja, kontrol plafon diskon & batas kuota pemakaian kasir secara real-time
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'cards' ? '#10b981' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Tampilan Kartu Kupon"
            >
              <LayoutGrid size={15} />
              <span>Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'table' ? '#10b981' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Tampilan Tabel Rinci"
            >
              <TableIcon size={15} />
              <span>Tabel</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
            title="Muat Ulang Data"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />
            <span style={{ fontSize: '0.85rem' }}>Refresh</span>
          </button>

          {/* Create Button */}
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={16} />
            <span>+ Buat Kupon Promo</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Kupon */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <Ticket size={24} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL VOUCHER PROMO</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)' }}>{stats.total} Kupon</div>
          </div>
        </div>

        {/* Kupon Aktif */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <CheckCircle2 size={24} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6ee7b7', fontWeight: 600 }}>KUPON AKTIF BERJALAN</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#34d399' }}>{stats.active} Kupon</div>
          </div>
        </div>

        {/* Total Pemakaian */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <TrendingUp size={24} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#fcd34d', fontWeight: 600 }}>TOTAL DIGUNAKAN (KLAIM)</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fbbf24' }}>
              {stats.totalTimesUsed.toLocaleString('id-ID')}x Transaksi
            </div>
          </div>
        </div>

        {/* Habis Kuota / Kedaluwarsa */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <AlertCircle size={24} color="#f87171" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 600 }}>HABIS KUOTA / KEDALUWARSA</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f87171' }}>{stats.expiredOrFull} Kupon</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari kode kupon (HEMAT10, DISKON50K) atau nama promo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Berjalan</option>
            <option value="INACTIVE">Non-Aktif</option>
            <option value="EXPIRED">Kedaluwarsa</option>
            <option value="QUOTA_FULL">Kuota Habis</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Semua Tipe Diskon</option>
            <option value="PERCENT">Persentase (%)</option>
            <option value="FIXED">Potongan Tetap (Rp)</option>
          </select>
        </div>

        {/* Outlet Filter (if multi-outlet available) */}
        {outlets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cabang:</span>
            <select
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Semua Lingkup</option>
              <option value="GLOBAL">Semua Cabang (Nasional)</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Content Area: Cards or Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>
          <RefreshCw size={32} className="spin-animation" style={{ margin: '0 auto 12px' }} />
          <div>Memuat data kupon promosi...</div>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Ticket size={48} color="#64748b" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Tidak Ada Kupon Promosi Ditemukan</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px' }}>
            {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Tidak ada kupon yang cocok dengan kata kunci atau filter yang Anda pilih.'
              : 'Belum ada voucher promosi yang dibuat. Buat kupon pertama Anda untuk memikat pelanggan berbelanja!'}
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <Plus size={16} />
            <span>+ Buat Kupon Promo Sekarang</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* VOUCHER CARD VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '18px' }}>
          {filteredPromotions.map(promo => {
            const status = getPromoStatus(promo);
            const isPercent = promo.discountType === 'PERCENT';
            const quotaPercent = promo.usageLimit ? Math.min(100, Math.round(((promo.timesUsed || 0) / promo.usageLimit) * 100)) : 0;
            const isToggling = toggleLoadingId === promo.id;

            return (
              <div
                key={promo.id}
                className="glass-card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: promo.isActive ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                  background: promo.isActive ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.5)',
                }}
              >
                {/* Decorative Ticket Notch circles */}
                <div style={{ position: 'absolute', top: '50%', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-main)', borderRight: '1px solid var(--glass-border)', transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', top: '50%', right: '-10px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-main)', borderLeft: '1px solid var(--glass-border)', transform: 'translateY(-50%)' }} />

                {/* Card Header: Outlet & Status Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Store size={14} color="#818cf8" />
                    <span>{getOutletName(promo.outletId)}</span>
                  </div>

                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: status.color,
                      background: status.bg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color }} />
                    {status.label}
                  </span>
                </div>

                {/* Voucher Code Box (Prominent & Copyable) */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px dashed rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Ticket size={20} color="#10b981" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>KODE KUPON</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em', color: '#34d399', fontFamily: 'monospace' }}>
                        {promo.code}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyCode(promo.code)}
                    style={{
                      background: copiedCode === promo.code ? '#10b981' : 'rgba(255,255,255,0.06)',
                      color: copiedCode === promo.code ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    title="Salin Kode Voucher"
                  >
                    {copiedCode === promo.code ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode === promo.code ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>

                {/* Promo Name & Description */}
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
                    {promo.name}
                  </h4>
                  {promo.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {promo.description}
                    </p>
                  )}
                </div>

                {/* Value Details Pill */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem' }}>
                  {/* Diskon */}
                  <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '4px 10px', borderRadius: '8px', color: '#a5b4fc', fontWeight: 700 }}>
                    {isPercent ? `Diskon ${promo.discountValue}%` : `Potongan ${formatRupiah(promo.discountValue)}`}
                    {isPercent && promo.maxDiscountAmount && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                        (Maks. {formatRupiah(promo.maxDiscountAmount)})
                      </span>
                    )}
                  </div>

                  {/* Min Order */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    {promo.minOrderAmount && promo.minOrderAmount > 0
                      ? `Min. Belanja ${formatRupiah(promo.minOrderAmount)}`
                      : 'Tanpa Min. Belanja'}
                  </div>
                </div>

                {/* Quota Tracking Bar */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Penggunaan Kupon:</span>
                    <span style={{ fontWeight: 700, color: promo.usageLimit ? '#fbbf24' : '#34d399' }}>
                      {promo.usageLimit
                        ? `${promo.timesUsed || 0} dari ${promo.usageLimit} Kuota (${quotaPercent}%)`
                        : `${promo.timesUsed || 0}x Dipakai (Tanpa Batas)`}
                    </span>
                  </div>
                  {promo.usageLimit ? (
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${quotaPercent}%`,
                          height: '100%',
                          background: quotaPercent >= 100 ? '#f87171' : quotaPercent >= 80 ? '#fbbf24' : '#10b981',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                {/* Validity Period */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <Calendar size={13} />
                  <span>
                    {promo.startDate || promo.endDate ? (
                      <>
                        {promo.startDate ? formatDateDisplay(promo.startDate) : 'Sekarang'} s/d{' '}
                        {promo.endDate ? formatDateDisplay(promo.endDate) : 'Seterusnya'}
                      </>
                    ) : (
                      'Berlaku Permanen (Tanpa Masa Kedaluwarsa)'
                    )}
                  </span>
                </div>

                {/* Actions & Instant Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Instant Toggle Button */}
                  <button
                    onClick={() => handleToggleStatus(promo)}
                    disabled={isToggling}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: isToggling ? 'not-allowed' : 'pointer',
                      color: promo.isActive ? '#34d399' : '#94a3b8',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                    title={promo.isActive ? 'Nonaktifkan Kupon' : 'Aktifkan Kupon'}
                  >
                    {promo.isActive ? (
                      <ToggleRight size={26} color="#10b981" />
                    ) : (
                      <ToggleLeft size={26} color="#64748b" />
                    )}
                    <span>{promo.isActive ? 'Promo Aktif' : 'Non-Aktif'}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenEdit(promo)}
                      className="btn"
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        fontSize: '0.78rem',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                      title="Edit Detail Promo"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleOpenDelete(promo)}
                      className="btn"
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#f87171',
                        fontSize: '0.78rem',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                      title="Hapus Promo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-panel" style={{ padding: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px' }}>KODE KUPON</th>
                <th style={{ padding: '12px' }}>NAMA PROMOSI & TARGET</th>
                <th style={{ padding: '12px' }}>NILAI DISKON</th>
                <th style={{ padding: '12px' }}>MIN. BELANJA</th>
                <th style={{ padding: '12px' }}>KUOTA TERPAKAI</th>
                <th style={{ padding: '12px' }}>MASA BERLAKU</th>
                <th style={{ padding: '12px' }}>STATUS</th>
                <th style={{ padding: '12px' }}>TOGGLE</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.map(promo => {
                const status = getPromoStatus(promo);
                const isPercent = promo.discountType === 'PERCENT';
                const quotaPercent = promo.usageLimit ? Math.min(100, Math.round(((promo.timesUsed || 0) / promo.usageLimit) * 100)) : 0;
                const isToggling = toggleLoadingId === promo.id;

                return (
                  <tr key={promo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {/* Code */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#34d399', fontSize: '0.95rem' }}>
                          {promo.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                          title="Salin Kode"
                        >
                          {copiedCode === promo.code ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    {/* Name & Outlet */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{promo.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{getOutletName(promo.outletId)}</div>
                    </td>

                    {/* Discount Value */}
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-emerald" style={{ fontWeight: 800 }}>
                        {isPercent ? `${promo.discountValue}%` : formatRupiah(promo.discountValue)}
                      </span>
                      {isPercent && promo.maxDiscountAmount && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Maks: {formatRupiah(promo.maxDiscountAmount)}
                        </div>
                      )}
                    </td>

                    {/* Min Order */}
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      {promo.minOrderAmount && promo.minOrderAmount > 0 ? formatRupiah(promo.minOrderAmount) : 'Rp 0'}
                    </td>

                    {/* Quota */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem' }}>
                        {promo.usageLimit ? `${promo.timesUsed || 0} / ${promo.usageLimit}` : `${promo.timesUsed || 0}x (Unlimited)`}
                      </div>
                      {promo.usageLimit && (
                        <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px' }}>
                          <div style={{ width: `${quotaPercent}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} />
                        </div>
                      )}
                    </td>

                    {/* Validity */}
                    <td style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {promo.endDate ? formatDateDisplay(promo.endDate) : 'Permanen'}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: status.color,
                          background: status.bg,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: status.color }} />
                        {status.label}
                      </span>
                    </td>

                    {/* Instant Toggle */}
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleToggleStatus(promo)}
                        disabled={isToggling}
                        style={{ background: 'none', border: 'none', cursor: isToggling ? 'not-allowed' : 'pointer' }}
                        title="Klik untuk ubah status aktif"
                      >
                        {promo.isActive ? (
                          <ToggleRight size={24} color="#10b981" />
                        ) : (
                          <ToggleLeft size={24} color="#64748b" />
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(promo)}
                          className="btn"
                          style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.06)' }}
                          title="Edit"
                        >
                          <Edit2 size={13} color="#818cf8" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(promo)}
                          className="btn"
                          style={{ padding: '6px 8px', background: 'rgba(239, 68, 68, 0.1)' }}
                          title="Hapus"
                        >
                          <Trash2 size={13} color="#f87171" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0d1526',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <Ticket size={20} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    {editingPromo ? 'Edit Voucher Promosi' : 'Buat Voucher Promosi Baru'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Tentukan kode unik, tipe potongan, serta batas pemakaian kupon
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error banner if any */}
            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form & Preview Grid */}
            <form onSubmit={handleSavePromo} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Left Side: Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Kode Voucher */}
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      <span>KODE KUPON PROMO *</span>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Sparkles size={12} />
                        <span>Acak Kode</span>
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: HEMAT10, GAJIAN50K, DISKON15"
                      value={form.code}
                      onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1.5px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        letterSpacing: '0.05em',
                        outline: 'none',
                      }}
                    />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Kasir akan mengetik atau memilih kode ini pada layar POS.
                    </div>
                  </div>

                  {/* Nama Promo */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      NAMA PROMOSI *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Promo Gajian Weekend, Diskon Buka Puasa"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
                      DESKRIPSI PROMOSI (OPSIONAL)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Catatan syarat ketentuan promo, misal: Berlaku untuk semua produk non-rokok..."
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                  </div>

                  {/* Target Cabang */}
                  {outlets.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                        TARGET CABANG (OUTLET)
                      </label>
                      <select
                        value={form.outletId}
                        onChange={(e) => setForm(prev => ({ ...prev, outletId: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      >
                        <option value="">Semua Cabang (Berlaku Nasional)</option>
                        {outlets.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tipe Diskon & Besaran Diskon */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      TIPE & NILAI DISKON *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, discountType: 'PERCENT' }))}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: form.discountType === 'PERCENT' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                          background: form.discountType === 'PERCENT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                          color: form.discountType === 'PERCENT' ? '#34d399' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Percent size={14} />
                        <span>Persentase (%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, discountType: 'FIXED' }))}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: form.discountType === 'FIXED' ? '1.5px solid #6366f1' : '1px solid var(--border-subtle)',
                          background: form.discountType === 'FIXED' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.04)',
                          color: form.discountType === 'FIXED' ? '#818cf8' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <DollarSign size={14} />
                        <span>Nominal Tetap (Rp)</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: form.discountType === 'PERCENT' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          {form.discountType === 'PERCENT' ? 'Besaran Diskon (%) *' : 'Nominal Potongan (Rp) *'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder={form.discountType === 'PERCENT' ? '10' : '25000'}
                          value={form.discountValue}
                          onChange={(e) => setForm(prev => ({ ...prev, discountValue: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '10px',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {form.discountType === 'PERCENT' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                            Maksimal Diskon (Plafon Rp)
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="Contoh: 50000 (Kosong = No Limit)"
                            value={form.maxDiscountAmount}
                            onChange={(e) => setForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '10px',
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-main)',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Min Belanja */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                      SYARAT MINIMAL BELANJA NOTA (RP)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0 (Isi 0 jika tanpa syarat belanja minimal)"
                      value={form.minOrderAmount}
                      onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Right Side: Limits, Toggles, and Live Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Live Voucher Preview Card */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                      PRATINJAU KARTU KUPON (LIVE PREVIEW)
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                        border: '1.5px dashed rgba(16, 185, 129, 0.5)',
                        borderRadius: '14px',
                        padding: '16px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                          {form.discountType === 'PERCENT'
                            ? `DISKON ${form.discountValue || 0}%`
                            : `POTONGAN ${formatRupiah(form.discountValue || 0)}`}
                        </span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                          {form.isActive ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>

                      <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'monospace', color: '#f8fafc', letterSpacing: '0.05em' }}>
                        {form.code || 'KODEKUPON'}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                        {form.name || 'Nama Promosi Kasir'}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.3 }}>
                        {form.minOrderAmount && Number(form.minOrderAmount) > 0
                          ? `Minimal belanja: ${formatRupiah(form.minOrderAmount)}`
                          : 'Tanpa syarat minimal belanja'}
                        {form.discountType === 'PERCENT' && form.maxDiscountAmount && Number(form.maxDiscountAmount) > 0
                          ? ` • Maks: ${formatRupiah(form.maxDiscountAmount)}`
                          : ''}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                        {form.hasUsageLimit && form.usageLimit
                          ? `Batas Kuota: ${form.usageLimit}x Pemakaian`
                          : 'Batas Kuota: Unlimited'}
                      </div>
                    </div>
                  </div>

                  {/* Toggle: Batas Masa Berlaku */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Batasi Periode Masa Berlaku Promo
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Tentukan kapan kupon mulai aktif dan otomatis kedaluwarsa
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.hasDateLimit}
                        onChange={(e) => setForm(prev => ({ ...prev, hasDateLimit: e.target.checked }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                    </div>

                    {form.hasDateLimit && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                            Mulai Berlaku
                          </label>
                          <input
                            type="datetime-local"
                            value={form.startDate}
                            onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem',
                              outline: 'none',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                            Kedaluwarsa (Berakhir)
                          </label>
                          <input
                            type="datetime-local"
                            value={form.endDate}
                            onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle: Batas Kuota Pemakaian */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Batasi Kuota Jumlah Pemakaian
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Kupon otomatis terkunci jika kuota nota transaksi habis
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.hasUsageLimit}
                        onChange={(e) => setForm(prev => ({ ...prev, hasUsageLimit: e.target.checked }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                    </div>

                    {form.hasUsageLimit && (
                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                          Maksimal Berapa Kali Digunakan (Quota Limit)
                        </label>
                        <input
                          type="number"
                          placeholder="Contoh: 100 pemakaian"
                          value={form.usageLimit}
                          onChange={(e) => setForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-main)',
                            fontSize: '0.82rem',
                            outline: 'none',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Toggle: Status Aktif */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Status Promo Langsung Aktif
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {form.isActive ? (
                        <ToggleRight size={30} color="#10b981" />
                      ) : (
                        <ToggleLeft size={30} color="#64748b" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="btn"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ minWidth: '130px' }}
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin-animation" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingPromo ? 'Simpan Perubahan' : 'Buat Voucher Kupon'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && promoToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
              maxWidth: '440px',
              background: '#0d1526',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '12px' }}>
                <Trash2 size={24} color="#f87171" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Hapus Voucher Promo?
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div>Kode Promo: <strong style={{ color: '#34d399', fontFamily: 'monospace' }}>{promoToDelete.code}</strong></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{promoToDelete.name}</div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
              Kupon promo ini akan dihapus dari basis data toko dan tidak lagi dapat dipakai oleh kasir di transaksi mendatang.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: '#fff' }}
              >
                Ya, Hapus Kupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
