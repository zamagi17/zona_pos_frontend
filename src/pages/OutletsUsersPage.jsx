import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Building2, Users, Plus, KeyRound, UserCheck, UserX, X } from 'lucide-react';

export function OutletsUsersPage() {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);

  // Forms
  const [outletForm, setOutletForm] = useState({ name: '', address: '', managerName: '', managerPhone: '', managerEmail: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', phone: '', roleId: 3, outletId: '' });
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });

  const isOwner = user?.role === 'ROLE_TENANT_OWNER';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getOutlets(),
      api.getUsers(),
    ])
      .then(([oList, uList]) => {
        setOutlets(oList);
        setUsers(uList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    try {
      await api.createOutlet(outletForm);
      alert('Cabang outlet baru berhasil ditambahkan');
      setIsAddOutletOpen(false);
      setOutletForm({ name: '', address: '', managerName: '', managerPhone: '', managerEmail: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        ...userForm,
        roleId: Number(userForm.roleId),
        outletId: userForm.outletId ? Number(userForm.outletId) : null,
      });
      alert('Pengguna staf baru berhasil dibuat');
      setIsAddUserOpen(false);
      setUserForm({ name: '', email: '', password: '', phone: '', roleId: 3, outletId: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUser) return;
    try {
      await api.resetPassword(resetUser.id, resetForm);
      alert(`Password untuk ${resetUser.name} berhasil di-reset.`);
      setResetUser(null);
      setResetForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Manajemen Cabang (Outlet) & Staf</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Kelola cabang outlet dan hak akses peran (Owner, Manager, Kasir)</p>
      </div>

      {/* OUTLETS SECTION */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Daftar Cabang (Outlets)</h3>
          </div>
          {isOwner && (
            <button onClick={() => setIsAddOutletOpen(true)} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              <Plus size={15} />
              <span>Tambah Cabang</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {outlets.map(o => (
            <div key={o.id} className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{o.name}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>{o.address}</p>
              <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '10px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                <div>Manajer: <strong style={{ color: 'var(--text-main)' }}>{o.managerName || '-'}</strong></div>
                <div>Telepon: {o.managerPhone || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* USERS SECTION */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Daftar Akun Pengguna & Kasir</h3>
          </div>
          <button onClick={() => setIsAddUserOpen(true)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            <Plus size={15} />
            <span>Tambah Kasir / Manajer</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>NAMA</th>
                <th style={{ padding: '12px' }}>EMAIL</th>
                <th style={{ padding: '12px' }}>PERAN (ROLE)</th>
                <th style={{ padding: '12px' }}>PENUGASAN CABANG</th>
                <th style={{ padding: '12px' }}>STATUS</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{u.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${
                      u.role === 'ROLE_TENANT_OWNER' ? 'badge-indigo' :
                      u.role === 'ROLE_OUTLET_MANAGER' ? 'badge-amber' : 'badge-emerald'
                    }`}>
                      {u.role === 'ROLE_TENANT_OWNER' ? 'Owner' :
                       u.role === 'ROLE_OUTLET_MANAGER' ? 'Manajer' : 'Kasir'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>{u.outletName || 'Global Tenant'}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${u.isActive ? 'badge-emerald' : 'badge-rose'}`}>
                      {u.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setResetUser(u)}
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        title="Reset Password"
                      >
                        <KeyRound size={13} />
                        <span>Reset PW</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`btn ${u.isActive ? 'btn-rose' : 'btn-primary'}`}
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        title={u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                      >
                        {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH CABANG OUTLET */}
      {isAddOutletOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tambah Cabang Baru</h3>
              <button onClick={() => setIsAddOutletOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOutlet} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Nama Cabang / Outlet</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={outletForm.name}
                  onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })}
                  placeholder="Cabang Surabaya Gubeng"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={outletForm.address}
                  onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })}
                  placeholder="Jl. Raya Gubeng No. 45, Surabaya"
                />
              </div>
              <div>
                <label className="form-label">Nama Manajer Cabang</label>
                <input
                  type="text"
                  className="form-input"
                  value={outletForm.managerName}
                  onChange={(e) => setOutletForm({ ...outletForm, managerName: e.target.value })}
                  placeholder="Dimas Anggara"
                />
              </div>
              <div>
                <label className="form-label">Nomor Telepon Manajer</label>
                <input
                  type="text"
                  className="form-input"
                  value={outletForm.managerPhone}
                  onChange={(e) => setOutletForm({ ...outletForm, managerPhone: e.target.value })}
                  placeholder="0812345678"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddOutletOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH STAF PENGGUNA */}
      {isAddUserOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tambah Akun Staf Kasir / Manajer</h3>
              <button onClick={() => setIsAddUserOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Rizky Kasir"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Email Login</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="rizky@zonapos.com"
                />
              </div>
              <div>
                <label className="form-label">Password Sementara</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Peran (Role)</label>
                  <select
                    className="form-input"
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                  >
                    <option value={3}>Kasir (Cashier)</option>
                    <option value={2}>Manajer Cabang</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Penugasan Cabang</label>
                  <select
                    required
                    className="form-input"
                    value={userForm.outletId}
                    onChange={(e) => setUserForm({ ...userForm, outletId: e.target.value })}
                  >
                    <option value="">Pilih Cabang</option>
                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-secondary">
                  Buat Akun Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD */}
      {resetUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Reset Password User</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{resetUser.name} ({resetUser.email})</p>
              </div>
              <button onClick={() => setResetUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Password Baru</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setResetUser(null)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
