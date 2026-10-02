import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, UserPlus, ShoppingBag, X, Banknote, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { SettleDebtModal } from '../components/SettleDebtModal';

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [settleDebtCustomer, setSettleDebtCustomer] = useState(null);

  const loadCustomers = () => {
    setLoading(true);
    api.getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.createCustomer(customerForm);
      alert('Pelanggan berhasil didaftarkan');
      setIsAddOpen(false);
      setCustomerForm({ name: '', phone: '', email: '' });
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewOrders = async (customer) => {
    setSelectedCustomerHistory(customer);
    try {
      const orders = await api.getCustomerTransactions(customer.id);
      setCustomerOrders(orders);
    } catch {
      setCustomerOrders([]);
    }
  };

  const totalOutstandingAll = customers.reduce((acc, c) => acc + (c.totalReceivables || 0), 0);
  const customersWithDebt = customers.filter(c => (c.totalReceivables || 0) > 0);

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Manajemen Pelanggan & Piutang (Kasbon)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Kelola basis data pelanggan tetap dan kontrol saldo kasbon / piutang tempo</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <Users size={24} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>TOTAL PELANGGAN</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{customers.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <Clock size={24} color="#f87171" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#fca5a5' }}>TOTAL KASBON / PIUTANG</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f87171' }}>
              Rp {totalOutstandingAll.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px' }}>
            <AlertCircle size={24} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PELANGGAN BELUM LUNAS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>
              {customersWithDebt.length} Pelanggan
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>NAMA PELANGGAN</th>
                <th style={{ padding: '12px' }}>NO. TELEPON / WA</th>
                <th style={{ padding: '12px' }}>EMAIL</th>
                <th style={{ padding: '12px' }}>STATUS PIUTANG / KASBON</th>
                <th style={{ padding: '12px' }}>TANGGAL BERGABUNG</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const hasDebt = (c.totalReceivables || 0) > 0;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      <div>{c.name}</div>
                      {hasDebt && (
                        <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>
                          • {c.unpaidBillsCount || 1} nota kasbon
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#10b981', fontWeight: 600 }}>{c.phone || '-'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      {hasDebt ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-rose" style={{ padding: '4px 8px', fontWeight: 800 }}>
                            Rp {c.totalReceivables.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-emerald" style={{ padding: '4px 8px' }}>
                          Rp 0 (Lunas)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-dim)' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        {hasDebt && (
                          <button
                            onClick={() => setSettleDebtCustomer(c)}
                            className="btn btn-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              borderColor: '#10b981'
                            }}
                            title="Catat pelunasan kasbon atau cicilan"
                          >
                            <Banknote size={14} />
                            <span>Catat Pelunasan</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewOrders(c)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <ShoppingBag size={14} color="#818cf8" />
                          <span>Riwayat</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Belum ada data pelanggan yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH PELANGGAN */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tambah Pelanggan</h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="Budi Santoso"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  className="form-input"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="081234567890"
                />
              </div>
              <div>
                <label className="form-label">Email (Opsional)</label>
                <input
                  type="email"
                  className="form-input"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="budi@gmail.com"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT BELANJA PELANGGAN */}
      {selectedCustomerHistory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Riwayat Belanja Pelanggan</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCustomerHistory.name} ({selectedCustomerHistory.phone})</p>
              </div>
              <button onClick={() => setSelectedCustomerHistory(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {customerOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Belum ada transaksi tercatat untuk pelanggan ini.
                </div>
              ) : (
                customerOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700 }}>{order.trxNo}</span>
                      <span className={`badge ${order.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '-'} • Outlet: {order.outletName}
                    </div>

                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '6px', fontSize: '0.8rem' }}>
                      {order.items?.map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{it.productName} x {it.quantity}</span>
                          <strong>Rp {it.subtotal?.toLocaleString('id-ID')}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '6px' }}>
                      <span style={{ fontWeight: 700 }}>Total:</span>
                      <span style={{ fontWeight: 800, color: '#10b981' }}>Rp {order.grandTotal?.toLocaleString('id-ID')}</span>
                    </div>

                    {order.paymentMethod && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        <span>Metode: {order.paymentMethod}</span>
                        {order.paymentStatus && <span>Status: {order.paymentStatus}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setSelectedCustomerHistory(null)} className="btn btn-outline">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATAT PELUNASAN KASBON */}
      <SettleDebtModal
        isOpen={!!settleDebtCustomer}
        customer={settleDebtCustomer}
        onClose={() => setSettleDebtCustomer(null)}
        onSuccess={() => {
          loadCustomers();
        }}
      />
    </div>
  );
}
