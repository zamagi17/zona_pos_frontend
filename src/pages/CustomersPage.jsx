import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, UserPlus, ShoppingBag, X } from 'lucide-react';

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

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

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Manajemen Pelanggan (CRM)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data esensial pelanggan dan riwayat transaksi belanja</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>NAMA PELANGGAN</th>
                <th style={{ padding: '12px' }}>NO. TELEPON / WA</th>
                <th style={{ padding: '12px' }}>EMAIL</th>
                <th style={{ padding: '12px' }}>TANGGAL BERGABUNG</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: '12px', color: '#10b981', fontWeight: 600 }}>{c.phone || '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-dim)' }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleViewOrders(c)}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <ShoppingBag size={14} color="#818cf8" />
                      <span>Riwayat Belanja</span>
                    </button>
                  </td>
                </tr>
              ))}
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
                      <span className="badge badge-emerald">{order.status}</span>
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
    </div>
  );
}
