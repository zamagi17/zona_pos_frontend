import React from 'react';
import { ShoppingCart, LayoutDashboard, Package, Boxes, Clock, Users, Building2, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentTab, setTab }) {
  const { user } = useAuth();
  const isOwnerOrManager = user?.role === 'ROLE_TENANT_OWNER' || user?.role === 'ROLE_OUTLET_MANAGER';
  const isOwner = user?.role === 'ROLE_TENANT_OWNER';

  const menuItems = [
    { id: 'pos', label: 'Kasir POS', icon: ShoppingCart, role: 'ALL' },
    { id: 'dashboard', label: 'Laporan & Omset', icon: LayoutDashboard, role: 'MANAGER_UP' },
    { id: 'products', label: 'Produk & Harga', icon: Package, role: 'MANAGER_UP' },
    { id: 'inventory', label: 'Stok & Gudang', icon: Boxes, role: 'MANAGER_UP' },
    { id: 'shifts', label: 'Riwayat Shift', icon: Clock, role: 'ALL' },
    { id: 'customers', label: 'Data Pelanggan', icon: Users, role: 'ALL' },
    { id: 'outlets-users', label: 'Cabang & Staf', icon: Building2, role: 'MANAGER_UP' },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.role === 'ALL') return true;
    if (item.role === 'MANAGER_UP') return isOwnerOrManager;
    if (item.role === 'OWNER_ONLY') return isOwner;
    return true;
  });

  return (
    <aside className="glass-panel" style={{
      width: '240px',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flexShrink: 0
    }}>
      <div style={{ padding: '4px 12px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
        MENU UTAMA
      </div>

      {filteredItems.map(item => {
        const Icon = item.icon;
        const active = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '12px',
              border: 'none',
              background: active ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)' : 'transparent',
              color: active ? '#10b981' : 'var(--text-muted)',
              borderLeft: active ? '3px solid #10b981' : '3px solid transparent',
              fontWeight: active ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'var(--text-main)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
          >
            <Icon size={18} color={active ? '#10b981' : '#94a3b8'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
