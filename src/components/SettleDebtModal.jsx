import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Banknote, QrCode, CreditCard, Building2, Calendar, AlertTriangle, Check, X, Coins } from 'lucide-react';

export function SettleDebtModal({ isOpen, customer, onClose, onSuccess }) {
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedTrxId, setSelectedTrxId] = useState(null); // null means FIFO (all bills)
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      setLoadingBills(true);
      setError(null);
      setSelectedTrxId(null);
      setNotes('');
      setPaymentMethod('CASH');

      api.getCustomerUnpaidBills(customer.id)
        .then(bills => {
          setUnpaidBills(bills);
          const totalRemaining = bills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);
          setAmount(String(totalRemaining));
        })
        .catch(err => {
          console.error(err);
          setAmount(String(customer.totalReceivables || ''));
        })
        .finally(() => setLoadingBills(false));
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const totalOutstanding = unpaidBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0) || (customer.totalReceivables || 0);

  const handleSelectBill = (trxId, remaining) => {
    if (selectedTrxId === trxId) {
      // Deselect -> pay all
      setSelectedTrxId(null);
      setAmount(String(totalOutstanding));
    } else {
      setSelectedTrxId(trxId);
      setAmount(String(remaining));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.settleCustomerDebt(customer.id, {
        trxId: selectedTrxId,
        amount: numAmount,
        paymentMethod,
        notes: notes.trim(),
      });
      alert('Pelunasan kasbon berhasil dicatat!');
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mencatat pelunasan kasbon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Catat Pelunasan Kasbon
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Pelanggan: <strong style={{ color: '#fff' }}>{customer.name}</strong> ({customer.phone || 'No HP -'})
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Total Outstanding Card */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 600 }}>TOTAL PIUTANG AKTIF:</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f87171' }}>
              Rp {totalOutstanding.toLocaleString('id-ID')}
            </div>
          </div>
          <span className="badge badge-rose" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
            {unpaidBills.length} Nota Belum Lunas
          </span>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            padding: '10px 14px',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Unpaid Bills List */}
          {unpaidBills.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Pilih Nota yang Ingin Dilunasi:</label>
                <button
                  type="button"
                  onClick={() => { setSelectedTrxId(null); setAmount(String(totalOutstanding)); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: selectedTrxId === null ? '#34d399' : 'var(--text-dim)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  {selectedTrxId === null ? '✓ Lunasi Otomatis (FIFO)' : 'Pilih Semua (FIFO)'}
                </button>
              </div>

              <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unpaidBills.map(bill => {
                  const isSelected = selectedTrxId === bill.trxId;
                  const isOverdue = bill.dueDate && new Date(bill.dueDate) < new Date();
                  return (
                    <div
                      key={bill.paymentId}
                      onClick={() => handleSelectBill(bill.trxId, bill.remainingAmount)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #10b981' : '1px solid var(--glass-border)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: isSelected ? '#34d399' : '#fff' }}>
                          {bill.trxNo}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {bill.trxDate ? new Date(bill.trxDate).toLocaleDateString('id-ID') : '-'}
                          {bill.dueDate && (
                            <span style={{ marginLeft: '8px', color: isOverdue ? '#f87171' : 'var(--text-dim)' }}>
                              Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString('id-ID')} {isOverdue && '(Lewat!)'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#f87171' }}>
                          Rp {bill.remainingAmount?.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {isSelected ? '✓ Terpilih' : 'Klik pilih'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="form-label">Metode Pembayaran Pelunasan</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'CASH', label: 'Tunai', icon: Banknote, color: '#10b981' },
                { id: 'QRIS', label: 'QRIS', icon: QrCode, color: '#818cf8' },
                { id: 'TRANSFER', label: 'Transfer', icon: Building2, color: '#38bdf8' },
                { id: 'DEBIT', label: 'Debit EDC', icon: CreditCard, color: '#fbbf24' },
              ].map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${m.color}` : '1px solid var(--glass-border)',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? m.color : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icon size={18} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
            {paymentMethod === 'CASH' && (
              <p style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '6px', marginInline: '2px' }}>
                ✓ Uang tunai otomatis disinkronkan ke laci kasir aktif (Cash In / Kas Masuk).
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0 }}>Nominal Pembayaran (Rp)</label>
              <button
                type="button"
                onClick={() => setAmount(String(selectedTrxId ? (unpaidBills.find(b => b.trxId === selectedTrxId)?.remainingAmount || totalOutstanding) : totalOutstanding))}
                className="badge badge-emerald"
                style={{ padding: '2px 8px', cursor: 'pointer', border: 'none', fontSize: '0.7rem' }}
              >
                Lunasi Penuh
              </button>
            </div>
            <input
              type="number"
              required
              min="1"
              max={totalOutstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '6px' }}
              placeholder="Contoh: 50000"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="form-label">Catatan Pelunasan (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
              placeholder="Contoh: Titip uang lewat istri / Transfer via BCA"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={submitting}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !Number(amount) || Number(amount) <= 0}
              style={{ padding: '10px 20px' }}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pelunasan Kasbon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
