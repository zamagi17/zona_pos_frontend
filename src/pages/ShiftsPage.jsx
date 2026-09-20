import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { api } from '../services/api';
import { Clock, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

export function ShiftsPage({ onOpenShiftModal, onCloseShiftModal }) {
  const { user, selectedOutletId } = useAuth();
  const { activeShift } = useShift();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Manajemen & Riwayat Shift Kasir</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lacak modal awal, omset shift, dan rekonsiliasi selisih kas fisik laci kasir</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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

          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>MODAL AWAL:</span>
              <strong style={{ fontSize: '1.1rem' }}>Rp {activeShift.startCash?.toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>PENJUALAN TUNAI:</span>
              <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>+Rp {activeShift.totalCashSales?.toLocaleString('id-ID') || '0'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>ESTIMASI LACI (EXPECTED):</span>
              <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>
                Rp {((activeShift.startCash || 0) + (activeShift.totalCashSales || 0)).toLocaleString('id-ID')}
              </strong>
            </div>
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
                <th style={{ padding: '12px' }}>NON-CASH</th>
                <th style={{ padding: '12px' }}>ESTIMASI LACI</th>
                <th style={{ padding: '12px' }}>KAS AKTUAL</th>
                <th style={{ padding: '12px' }}>SELISIH</th>
                <th style={{ padding: '12px' }}>STATUS</th>
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
                    <td style={{ padding: '12px', color: '#818cf8' }}>Rp {s.totalNonCashSales?.toLocaleString('id-ID')}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
