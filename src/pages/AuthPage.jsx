import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, UserCheck, Shield, KeyRound, Building, ArrowRight, CheckCircle2 } from 'lucide-react';

export function AuthPage() {
  const { login, registerTenant } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regData, setRegData] = useState({
    tenantName: '',
    address: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    password: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await registerTenant(regData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: isRegister ? '540px' : '460px',
        padding: '36px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.8rem',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
            marginBottom: '14px'
          }}>
            Z
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>Zona POS UMKM</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sistem Kasir Cloud Multi-Tenant & Multi-Cabang
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {!isRegister ? (
          /* LOGIN FORM */
          <div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="nama@zonapos.com"
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', marginTop: '8px' }}>
                {loading ? 'Memproses...' : 'Masuk ke Aplikasi'}
                <ArrowRight size={18} />
              </button>
            </form>

            {/* DEMO ACCOUNTS QUICK BUTTONS */}
            <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                DEMO 1-CLICK LOGIN:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fillDemo('owner@zonapos.com', 'password123')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '8px 4px', flexDirection: 'column', gap: '2px' }}
                >
                  <Shield size={14} color="#818cf8" />
                  <strong>Owner</strong>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('manager@zonapos.com', 'password123')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '8px 4px', flexDirection: 'column', gap: '2px' }}
                >
                  <Building size={14} color="#f59e0b" />
                  <strong>Manager</strong>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('kasir@zonapos.com', 'password123')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '8px 4px', flexDirection: 'column', gap: '2px' }}
                >
                  <UserCheck size={14} color="#10b981" />
                  <strong>Kasir</strong>
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Belum punya akun usaha?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Daftar Tenant Baru
              </button>
            </div>
          </div>
        ) : (
          /* REGISTER TENANT FORM */
          <div>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Nama Usaha / Usaha Tenant</label>
                <input
                  type="text"
                  value={regData.tenantName}
                  onChange={(e) => setRegData({ ...regData, tenantName: e.target.value })}
                  required
                  className="form-input"
                  placeholder="Contoh: Kopi Kenangan Nusantara"
                />
              </div>

              <div>
                <label className="form-label">Alamat Usaha</label>
                <input
                  type="text"
                  value={regData.address}
                  onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                  required
                  className="form-input"
                  placeholder="Jl. Merdeka No. 12, Jakarta"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Nama Lengkap Owner</label>
                  <input
                    type="text"
                    value={regData.ownerName}
                    onChange={(e) => setRegData({ ...regData, ownerName: e.target.value })}
                    required
                    className="form-input"
                    placeholder="Bpk. Hendra"
                  />
                </div>
                <div>
                  <label className="form-label">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    value={regData.ownerPhone}
                    onChange={(e) => setRegData({ ...regData, ownerPhone: e.target.value })}
                    required
                    className="form-input"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Email Owner</label>
                  <input
                    type="email"
                    value={regData.ownerEmail}
                    onChange={(e) => setRegData({ ...regData, ownerEmail: e.target.value })}
                    required
                    className="form-input"
                    placeholder="owner@domain.com"
                  />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    required
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px', marginTop: '8px' }}>
                {loading ? 'Mendaftarkan...' : 'Daftar & Langsung Aktif'}
                <CheckCircle2 size={18} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
