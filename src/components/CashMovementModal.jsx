import React, { useState, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import {
  ArrowUpDown,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Tag,
  FileText,
  Clock,
  History
} from 'lucide-react';

const CASH_OUT_CATEGORIES = [
  'Operasional (Kresek, Lakban, ATK)',
  'Bahan Baku (Es Batu, Air Galon, Gas)',
  'Kurir & Ekspedisi (COD / Ongkir)',
  'Konsumsi Karyawan',
  'Lainnya'
];

const CASH_IN_CATEGORIES = [
  'Tambah Modal Kembalian (Dari Owner)',
  'Suntikan Kas Kasir',
  'Pendapatan Lain-lain',
  'Lainnya'
];

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000, 200000];

export function CashMovementModal({ isOpen, onClose }) {
  const { activeShift, recordCashMovement } = useShift();
  const [type, setType] = useState('CASH_OUT'); // CASH_OUT or CASH_IN
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CASH_OUT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      setAmount('');
      setNotes('');
      setCategory(type === 'CASH_OUT' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0]);
    }
  }, [isOpen, type]);

  if (!isOpen || !activeShift) return null;

  // Calculate live drawer cash
  const startCash = activeShift.startCash || 0;
  const cashSales = activeShift.totalCashSales || 0;
  const totalCashIn = activeShift.totalCashIn || 0;
  const totalCashOut = activeShift.totalCashOut || 0;
  const currentDrawerCash = activeShift.expectedCash || (startCash + cashSales + totalCashIn - totalCashOut);

  const numAmount = Number(amount) || 0;
  const isOverdraft = type === 'CASH_OUT' && numAmount > currentDrawerCash;

  const handleSelectType = (selectedType) => {
    setType(selectedType);
    setCategory(selectedType === 'CASH_OUT' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0]);
    setCustomCategory('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Nominal uang harus lebih besar dari Rp 0.');
      return;
    }

    if (isOverdraft) {
      setError(`Uang kas di laci tidak mencukupi! Saldo laci saat ini: Rp ${currentDrawerCash.toLocaleString('id-ID')}`);
      return;
    }

    const finalCategory = category === 'Lainnya' && customCategory.trim() ? customCategory.trim() : category;

    try {
      setLoading(true);
      setError(null);
      await recordCashMovement({
        type,
        amount: numAmount,
        category: finalCategory,
        notes: notes.trim(),
        shiftId: activeShift.id
      });

      setSuccessMessage(`Berhasil mencatat ${type === 'CASH_IN' ? 'Kas Masuk' : 'Kas Keluar'} sebesar Rp ${numAmount.toLocaleString('id-ID')}`);
      setAmount('');
      setNotes('');
      setCustomCategory('');

      // Auto close after brief indicator or let cashier see updated balance
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan mutasi kas');
    } finally {
      setLoading(false);
    }
  };

  const movements = activeShift.cashMovements || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: type === 'CASH_OUT' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {type === 'CASH_OUT' ? (
                <ArrowUpRight size={24} color="#f43f5e" />
              ) : (
                <ArrowDownLeft size={24} color="#10b981" />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Kas Masuk & Keluar (Petty Cash)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Catat pengeluaran darurat laci & suntikan modal agar kas seimbang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Drawer Status Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Saldo Uang Kas di Laci Saat Ini:
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              Rp {currentDrawerCash.toLocaleString('id-ID')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Kas Masuk (+):</span>
              <div style={{ fontWeight: 700, color: '#34d399' }}>+Rp {totalCashIn.toLocaleString('id-ID')}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Kas Keluar (-):</span>
              <div style={{ fontWeight: 700, color: '#fb7185' }}>-Rp {totalCashOut.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </div>

        {/* Type Toggle Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => handleSelectType('CASH_OUT')}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: type === 'CASH_OUT' ? '2px solid #f43f5e' : '1px solid var(--border-subtle)',
              background: type === 'CASH_OUT' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255,255,255,0.02)',
              color: type === 'CASH_OUT' ? '#f43f5e' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowUpRight size={18} />
            <span>Kas Keluar (Cash Out)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType('CASH_IN')}
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: type === 'CASH_IN' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
              background: type === 'CASH_IN' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)',
              color: type === 'CASH_IN' ? '#10b981' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowDownLeft size={18} />
            <span>Kas Masuk (Cash In)</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nominal Uang Kas</span>
              {numAmount > 0 && (
                <span style={{ color: type === 'CASH_OUT' ? '#fb7185' : '#34d399', fontWeight: 700 }}>
                  {type === 'CASH_OUT' ? '- ' : '+ '}Rp {numAmount.toLocaleString('id-ID')}
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                Rp
              </span>
              <input
                type="number"
                min="500"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="form-input"
                style={{
                  paddingLeft: '44px',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: isOverdraft ? '#fb7185' : 'var(--text-main)'
                }}
                placeholder="0"
                autoFocus
              />
            </div>

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  +{val.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            {/* Overdraft Warning */}
            {isOverdraft && (
              <div style={{ color: '#fb7185', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} />
                <span>Nominal melebihi saldo kas fisik di laci (Rp {currentDrawerCash.toLocaleString('id-ID')})</span>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Kategori {type === 'CASH_OUT' ? 'Biaya / Keperluan' : 'Penerimaan'}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {(type === 'CASH_OUT' ? CASH_OUT_CATEGORIES : CASH_IN_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    border: category === cat ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                    background: category === cat ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: category === cat ? '#a5b4fc' : 'var(--text-muted)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {category === 'Lainnya' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ketik kategori biaya kustom..."
                className="form-input"
                style={{ marginTop: '6px', fontSize: '0.85rem' }}
                required
              />
            )}
          </div>

          {/* Notes / Description */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Catatan Keterangan (Opsional tapi Direkomendasikan)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === 'CASH_OUT'
                  ? 'Contoh: Beli es batu kristal 2 kantong, bayar galon Aqua, beli lakban bening'
                  : 'Contoh: Suntikan uang kembalian receh 2000-an dari Pak Budi'
              }
              className="form-input"
              style={{ fontSize: '0.88rem' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={15} />
              <span>{showHistory ? 'Sembunyikan Riwayat' : `Riwayat Shift (${movements.length})`}</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || numAmount <= 0 || isOverdraft}
                className={type === 'CASH_OUT' ? 'btn btn-danger' : 'btn btn-emerald'}
                style={{
                  background: type === 'CASH_OUT' ? '#e11d48' : '#059669',
                  borderColor: type === 'CASH_OUT' ? '#f43f5e' : '#10b981',
                  minWidth: '140px'
                }}
              >
                {loading ? 'Menyimpan...' : type === 'CASH_OUT' ? 'Simpan Kas Keluar' : 'Simpan Kas Masuk'}
              </button>
            </div>
          </div>
        </form>

        {/* Collapsible History Section */}
        {showHistory && (
          <div style={{
            marginTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '14px',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-muted)' }}>
              Riwayat Kas Masuk/Keluar Sesi Ini
            </h4>
            {movements.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '12px' }}>
                Belum ada kas masuk atau kas keluar yang dicatat pada shift ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {movements.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${m.type === 'CASH_IN' ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.7rem' }}>
                          {m.type === 'CASH_IN' ? '+ KAS MASUK' : '- KAS KELUAR'}
                        </span>
                        <strong style={{ color: 'var(--text-main)' }}>{m.category}</strong>
                      </div>
                      {m.notes && (
                        <div style={{ color: 'var(--text-dim)', marginTop: '2px', fontSize: '0.75rem' }}>
                          "{m.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 700,
                        color: m.type === 'CASH_IN' ? '#34d399' : '#fb7185'
                      }}>
                        {m.type === 'CASH_IN' ? '+' : '-'}Rp {m.amount?.toLocaleString('id-ID')}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
