import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { api } from '../services/api';
import { Store, LogOut, User as UserIcon, Clock, CheckCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';

export function Navbar({ onOpenShift, onCloseShift, onOpenCashMovement }) {
  const { user, logout, selectedOutletId, switchOutlet } = useAuth();
  const { activeShift } = useShift();
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    if (user) {
      api.getOutlets().then(setOutlets).catch(() => {});
    }
  }, [user]);

  const isOwner = user?.role === 'ROLE_TENANT_OWNER';

  return (
    <header className="glass-panel" style={{
      margin: '12px 16px 0',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      position: 'sticky',
      top: '12px',
      zIndex: 50
    }}>
      {/* Brand & Outlet Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
          }}>
            Z
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>Zona POS</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>UMKM Multi-Tenant</span>
          </div>
        </div>

        {/* Outlet Selector */}
        {outlets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '10px' }}>
            <Store size={16} color="var(--primary)" />
            {isOwner ? (
              <select
                value={selectedOutletId || ''}
                onChange={(e) => switchOutlet(Number(e.target.value))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id} style={{ background: '#0f172a' }}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {outlets.find(o => o.id === selectedOutletId)?.name || user?.outletName || 'Cabang Kasir'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Shift Status Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeShift ? (
          <>
            <button
              onClick={onCloseShift}
              className="btn badge-emerald"
              style={{ padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer' }}
              title="Klik untuk Tutup Shift"
            >
              <Clock size={15} />
              <span>Shift Buka (Modal: Rp {activeShift.startCash?.toLocaleString('id-ID')})</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>• Tutup Shift</span>
            </button>

            <button
              onClick={onOpenCashMovement}
              className="btn btn-outline"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#a5b4fc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Catat Kas Masuk / Kas Keluar (Petty Cash)"
            >
              <ArrowUpDown size={15} color="#818cf8" />
              <span>Kas Masuk/Keluar</span>
              {((activeShift.totalCashIn || 0) > 0 || (activeShift.totalCashOut || 0) > 0) && (
                <span style={{
                  background: '#4f46e5',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  {(activeShift.cashMovements?.length || 0)}
                </span>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={onOpenShift}
            className="btn badge-amber"
            style={{ padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            <AlertCircle size={15} />
            <span>Shift Kasir Tertutup • Buka Shift</span>
          </button>
        )}
      </div>

      {/* Right User Info & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{user?.name}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <span className={`badge ${
              user?.role === 'ROLE_TENANT_OWNER' ? 'badge-indigo' :
              user?.role === 'ROLE_OUTLET_MANAGER' ? 'badge-amber' : 'badge-emerald'
            }`}>
              {user?.role === 'ROLE_TENANT_OWNER' ? 'OWNER' :
               user?.role === 'ROLE_OUTLET_MANAGER' ? 'MANAJER' : 'KASIR'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-outline"
          style={{ padding: '8px 12px', borderRadius: '10px' }}
          title="Keluar / Logout"
        >
          <LogOut size={16} color="#f43f5e" />
        </button>
      </div>
    </header>
  );
}
