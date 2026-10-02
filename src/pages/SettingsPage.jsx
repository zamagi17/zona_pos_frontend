import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, Store, MapPin, Phone, Globe, 
  FileText, Image as ImageIcon, Upload, Trash2, Save, 
  CheckCircle2, AlertCircle, Sparkles, Smartphone, Monitor, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const InstagramIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export function SettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    paperSize: '58mm',
    businessName: '',
    logoUrl: '',
    address: '',
    phone: '',
    instagram: '',
    website: '',
    footerNote: 'Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.\nTerima kasih atas kunjungan Anda!',
    showLogo: true,
    showSocialMedia: true
  });

  // Load existing receipt & store settings
  useEffect(() => {
    loadSettings();
  }, [user?.activeOutletId]);

  const loadSettings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getReceiptSetting(user?.activeOutletId);
      if (data) {
        setForm({
          paperSize: data.paperSize || '58mm',
          businessName: data.businessName || '',
          logoUrl: data.logoUrl || '',
          address: data.address || '',
          phone: data.phone || '',
          instagram: data.instagram || '',
          website: data.website || '',
          footerNote: data.footerNote || 'Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.\nTerima kasih atas kunjungan Anda!',
          showLogo: data.showLogo !== undefined ? data.showLogo : true,
          showSocialMedia: data.showSocialMedia !== undefined ? data.showSocialMedia : true
        });
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan struk:', err);
      setErrorMessage('Gagal memuat pengaturan dari server.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  // Convert uploaded image file to base64 Data URL
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, atau WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleInputChange('logoUrl', event.target?.result || '');
      handleInputChange('showLogo', true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleInputChange('logoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyPreset = (presetText) => {
    handleInputChange('footerNote', presetText);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const payload = {
        ...form,
        outletId: user?.activeOutletId || null
      };

      const result = await api.saveReceiptSetting(payload);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Gagal menyimpan pengaturan:', err);
      setErrorMessage(err.message || 'Gagal menyimpan pengaturan ke database.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintSample = () => {
    window.print();
  };

  const is80mm = form.paperSize === '80mm';
  const previewCardWidth = is80mm ? '380px' : '290px';
  const samplePrintWidth = is80mm ? '72mm' : '48mm';

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#10b981' }}>
        <p style={{ fontWeight: 600 }}>Memuat konfigurasi toko & struk thermal...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      {/* Styles for direct print preview */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #sample-receipt-preview, #sample-receipt-preview * {
            visibility: visible !important;
          }
          #sample-receipt-preview {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${samplePrintWidth} !important;
            margin: 0 !important;
            padding: 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Printer size={26} color="#10b981" />
            Pengaturan Identitas Toko & Struk Thermal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Kustomisasi logo toko, header kontak, catatan kaki (footer), dan ukuran kertas printer thermal kasir (58mm / 80mm).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handlePrintSample}
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={16} color="#06b6d4" />
            Tes Cetak Sampel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#0f172a',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {saveSuccess && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          padding: '12px 16px',
          borderRadius: '10px',
          color: '#10b981',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          Pengaturan struk dan identitas toko berhasil disimpan! Perubahan akan langsung aktif di layar kasir POS.
        </div>
      )}

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid #f43f5e',
          padding: '12px 16px',
          borderRadius: '10px',
          color: '#f43f5e',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      {/* Main Grid: Form on Left, Live Thermal Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) minmax(320px, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Form Settings */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card 1: Pilihan Ukuran Kertas Thermal */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} color="#10b981" />
              Ukuran Kertas Printer Thermal
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Pilih spesifikasi printer thermal yang digunakan di meja kasir outlet Anda.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Option 58mm */}
              <div 
                onClick={() => handleInputChange('paperSize', '58mm')}
                style={{
                  border: form.paperSize === '58mm' ? '2px solid #10b981' : '1px solid var(--glass-border)',
                  background: form.paperSize === '58mm' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Smartphone size={18} color={form.paperSize === '58mm' ? '#10b981' : '#94a3b8'} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: form.paperSize === '58mm' ? '#10b981' : 'var(--text-main)' }}>
                      58 mm
                    </span>
                  </div>
                  {form.paperSize === '58mm' && (
                    <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#0f172a', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      AKTIF
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Printer Mini Bluetooth, USB Kasir Portable. Lebar cetak ~48mm (32 Karakter). Cocok untuk gerai, kafe kecil, & ritel ringkas.
                </p>
              </div>

              {/* Option 80mm */}
              <div 
                onClick={() => handleInputChange('paperSize', '80mm')}
                style={{
                  border: form.paperSize === '80mm' ? '2px solid #10b981' : '1px solid var(--glass-border)',
                  background: form.paperSize === '80mm' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Monitor size={18} color={form.paperSize === '80mm' ? '#10b981' : '#94a3b8'} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: form.paperSize === '80mm' ? '#10b981' : 'var(--text-main)' }}>
                      80 mm
                    </span>
                  </div>
                  {form.paperSize === '80mm' && (
                    <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#0f172a', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      AKTIF
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Printer Desktop Thermal Enterprise (Epson, Janz, Matrix Point). Lebar cetak ~72mm (48 Karakter). Format luas dan lega.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Logo Struk */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="#06b6d4" />
                Logo Header Struk
              </h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input 
                  type="checkbox"
                  checked={form.showLogo}
                  onChange={(e) => handleInputChange('showLogo', e.target.checked)}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                Tampilkan Logo
              </label>
            </div>
            
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Unggah file logo atau masukkan tautan URL gambar. Gambar hitam-putih / monokrom direkomendasikan untuk hasil cetak thermal terbaik.
            </p>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {/* Logo Preview Thumbnail */}
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {form.logoUrl ? (
                  <img 
                    src={form.logoUrl} 
                    alt="Logo Toko" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'grayscale(100%) contrast(150%)' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', padding: '4px' }}>
                    Tanpa Logo
                  </span>
                )}
              </div>

              {/* Upload Controls */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid #6366f1',
                      color: '#a5b4fc',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={14} />
                    Unggah Logo (File)
                  </button>

                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid #f43f5e',
                        color: '#fda4af',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Atau tempel URL gambar online (https://...)"
                  value={form.logoUrl.startsWith('data:') ? '[Gambar Lokal Terunggah]' : form.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  disabled={form.logoUrl.startsWith('data:')}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    width: '100%'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Identitas & Informasi Kontak Toko */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={18} color="#f59e0b" />
              Identitas & Informasi Kontak Toko
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Informasi ini akan dicetak di bagian paling atas struk (Header Nota).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Nama Toko / Bisnis *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Kenangan Senja, Toko Makmur Ritel"
                    value={form.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Alamat Lengkap Outlet *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Jl. Sudirman No. 45, Menteng, Jakarta Pusat"
                  value={form.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    width: '100%',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <Phone size={13} color="#10b981" />
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812-3456-7890"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      width: '100%'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <InstagramIcon size={13} color="#f43f5e" />
                    Akun Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@tokomakmur.id"
                    value={form.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input 
                    type="checkbox"
                    checked={form.showSocialMedia}
                    onChange={(e) => handleInputChange('showSocialMedia', e.target.checked)}
                    style={{ accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  Tampilkan Kontak & Media Sosial di Struk
                </label>
              </div>
            </div>
          </div>

          {/* Card 4: Catatan Kaki Struk (Footer Note) */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#6366f1" />
              Catatan Kaki Struk (Footer Note)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Pesan penutup, ketentuan retur garansi, atau ucapan terima kasih di bagian bawah struk belanja.
            </p>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', alignSelf: 'center', marginRight: '4px' }}>
                Template Cepat:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset("Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.\nTerima kasih atas kunjungan Anda!")}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Standar Ritel
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("Simpan struk ini sebagai bukti pembayaran sah.\nGaransi tukar produk cacat pabrik maksimal 1x24 jam.")}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Garansi Retur
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("Selamat menikmati hidangan kami!\nKritik, saran, & pesanan catering hubungi WhatsApp kami.")}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                F&B / Kafe
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan. Terima kasih atas kunjungan Anda!"
              value={form.footerNote}
              onChange={(e) => handleInputChange('footerNote', e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                width: '100%',
                resize: 'vertical'
              }}
            />
          </div>

        </form>

        {/* Right Column: Interactive Live Thermal Receipt Preview */}
        <div style={{ position: 'sticky', top: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: previewCardWidth,
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.82rem', fontWeight: 700 }}>
              <Eye size={16} />
              <span>Pratinjau Struk Real-Time ({form.paperSize})</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
              {is80mm ? '48 Kolom' : '32 Kolom'}
            </span>
          </div>

          {/* Thermal Paper Realistic Mockup */}
          <div
            id="sample-receipt-preview"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              width: previewCardWidth,
              padding: is80mm ? '24px 20px' : '18px 14px',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.2)',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: is80mm ? '0.84rem' : '0.75rem',
              lineHeight: 1.35,
              transition: 'width 0.2s ease, font-size 0.2s ease',
              borderTop: '3px dashed #cbd5e1',
              borderBottom: '3px dashed #cbd5e1'
            }}
          >
            {/* Header: Logo & Store Info */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              {form.showLogo && form.logoUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <img 
                    src={form.logoUrl} 
                    alt="Logo Toko" 
                    style={{ 
                      maxHeight: '48px', 
                      maxWidth: '120px', 
                      objectFit: 'contain',
                      filter: 'grayscale(100%) contrast(150%)'
                    }} 
                  />
                </div>
              )}

              <div style={{ fontWeight: 800, fontSize: is80mm ? '1.15rem' : '1rem', letterSpacing: '0.04em' }}>
                {form.businessName || 'NAMA TOKO ANDA'}
              </div>

              <div style={{ fontSize: is80mm ? '0.78rem' : '0.72rem', color: '#475569', marginTop: '2px', wordBreak: 'break-word' }}>
                {form.address || 'Alamat Toko / Cabang'}
              </div>

              {form.showSocialMedia && (
                <div style={{ fontSize: is80mm ? '0.74rem' : '0.68rem', color: '#475569', marginTop: '3px' }}>
                  {form.phone && <div>Telp/WA: {form.phone}</div>}
                  {form.instagram && <div>IG: {form.instagram}</div>}
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }} />

            {/* Meta Transaksi Sampel */}
            <div style={{ fontSize: is80mm ? '0.76rem' : '0.7rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No: TRX-20261001-0089</span>
                <span>01/10/26 15:45</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kasir: Budi Santoso</span>
                <span>Plg: Pelanggan Umum</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }} />

            {/* Item Belanja Sampel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Kopi Susu Gula Aren</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: is80mm ? '0.76rem' : '0.7rem' }}>
                  <span>2 x Rp 22.000</span>
                  <span>Rp 44.000</span>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Croissant Butter Premium</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: is80mm ? '0.76rem' : '0.7rem' }}>
                  <span>1 x Rp 28.000</span>
                  <span>Rp 28.000</span>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Air Mineral 600ml</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: is80mm ? '0.76rem' : '0.7rem' }}>
                  <span>1 x Rp 6.000</span>
                  <span>Rp 6.000</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }} />

            {/* Kalkulasi & Diskon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: is80mm ? '0.78rem' : '0.72rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>Rp 78.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Diskon Nota (HEMAT10):</span>
                <span>-Rp 10.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>PB1 Resto (10%):</span>
                <span>Rp 6.800</span>
              </div>
              <div style={{ borderBottom: '1px dashed #94a3b8', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: is80mm ? '0.96rem' : '0.88rem' }}>
                <span>TOTAL:</span>
                <span>Rp 74.800</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <span>TUNAI:</span>
                <span>Rp 100.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>KEMBALIAN:</span>
                <span>Rp 25.200</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderBottom: '1px dashed #64748b', margin: '10px 0 8px' }} />

            {/* Footer Note */}
            <div style={{ 
              textAlign: 'center', 
              fontSize: is80mm ? '0.74rem' : '0.68rem', 
              color: '#334155',
              whiteSpace: 'pre-line',
              lineHeight: 1.3
            }}>
              {form.footerNote || 'Terima kasih atas kunjungan Anda!'}
            </div>

            {/* Watermark Zona POS */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '10px', 
              paddingTop: '6px',
              borderTop: '1px dotted #cbd5e1',
              fontSize: '0.62rem', 
              color: '#64748b',
              letterSpacing: '0.08em'
            }}>
              *** ZONA POS ENTERPRISE ***
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
