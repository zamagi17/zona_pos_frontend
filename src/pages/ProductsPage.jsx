import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plus, Tag, History, Layers, DollarSign, X, FolderPlus, Scale, Check, Barcode, Printer } from 'lucide-react';
import { BarcodePrintModal } from '../components/BarcodePrintModal';

export function ProductsPage() {
  const { user, selectedOutletId } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  // Barcode & Price Tag Modal
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState(null);

  // Variant Modal
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({ sku: '', name: '' });
  const [variantLoading, setVariantLoading] = useState(false);

  // Master Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ code: '', name: '', parentId: '', desc: '' });
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ code: '', name: '', size: '1' });

  // Form states
  const [productForm, setProductForm] = useState({
    sku: '',
    barcode: '',
    name: '',
    desc: '',
    categoryId: '',
    unitId: '',
    sellingPrice: '',
    purchasePrice: '',
  });

  const [priceForm, setPriceForm] = useState({
    sellingPrice: '',
    purchasePrice: '',
    discountPercentage: '0',
    taxPercentage: '0',
  });

  const outletId = selectedOutletId || user?.outletId;

  const loadData = () => {
    if (!outletId) return;
    setLoading(true);
    Promise.all([
      api.getProducts(outletId),
      api.getCategories(),
      api.getUnits(),
    ])
      .then(([pList, cList, uList]) => {
        setProducts(pList || []);
        setCategories(cList || []);
        setUnits(uList || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [outletId]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...productForm,
        categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
        unitId: productForm.unitId ? Number(productForm.unitId) : null,
        sellingPrice: Number(productForm.sellingPrice),
        purchasePrice: Number(productForm.purchasePrice),
      });
      setIsAddProductOpen(false);
      setProductForm({ sku: '', barcode: '', name: '', desc: '', categoryId: '', unitId: '', sellingPrice: '', purchasePrice: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenPriceModal = (product) => {
    setSelectedProductForPrice(product);
    setPriceForm({
      sellingPrice: String(product.sellingPrice || 0),
      purchasePrice: String(product.purchasePrice || 0),
      discountPercentage: String(product.discountPercentage || 0),
      taxPercentage: String(product.taxPercentage || 0),
    });
    setPriceHistory([]);
    if (product.priceId) {
      api.getPriceHistory(product.priceId)
        .then(res => setPriceHistory(res || []))
        .catch(() => setPriceHistory([]));
    }
    setIsPriceModalOpen(true);
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!selectedProductForPrice || !outletId) return;
    try {
      await api.setPrice({
        productId: selectedProductForPrice.id,
        outletId,
        sellingPrice: Number(priceForm.sellingPrice),
        purchasePrice: Number(priceForm.purchasePrice),
        discountPercentage: Number(priceForm.discountPercentage),
        taxPercentage: Number(priceForm.taxPercentage),
      });
      alert('Harga cabang dan riwayat audit (price_history) berhasil diperbarui!');
      setIsPriceModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Variant Actions
  const handleOpenVariantModal = (product) => {
    setSelectedProductForVariant(product);
    const existingCount = product.variants?.length || 0;
    setVariantForm({
      sku: `${product.sku}-V${existingCount + 1}`,
      name: '',
    });
    setIsVariantModalOpen(true);
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!selectedProductForVariant) return;
    try {
      setVariantLoading(true);
      const newVar = await api.addVariant(selectedProductForVariant.id, {
        sku: variantForm.sku,
        name: variantForm.name,
      });
      alert(`Varian "${newVar.name}" berhasil ditambahkan!`);
      // Update selected product's variants locally
      setSelectedProductForVariant(prev => ({
        ...prev,
        variants: [...(prev.variants || []), newVar]
      }));
      setVariantForm({
        sku: `${selectedProductForVariant.sku}-V${(selectedProductForVariant.variants?.length || 0) + 2}`,
        name: '',
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan varian');
    } finally {
      setVariantLoading(false);
    }
  };

  // Master Category Creation
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.createCategory({
        code: categoryForm.code.toUpperCase(),
        name: categoryForm.name,
        parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
        desc: categoryForm.desc,
      });
      alert('Kategori master berhasil ditambahkan!');
      setIsCategoryModalOpen(false);
      setCategoryForm({ code: '', name: '', parentId: '', desc: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal membuat kategori');
    }
  };

  // Master Unit Creation
  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      await api.createUnit({
        code: unitForm.code.toUpperCase(),
        name: unitForm.name,
        size: Number(unitForm.size) || 1,
      });
      alert('Satuan unit master berhasil ditambahkan!');
      setIsUnitModalOpen(false);
      setUnitForm({ code: '', name: '', size: '1' });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal membuat satuan');
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Katalog Produk & Penetapan Harga Cabang</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Atur master produk, varian (SKU), kategori, dan penetapan harga bertingkat per cabang</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedProductForBarcode(null);
              setIsBarcodeModalOpen(true);
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', borderColor: '#38bdf8', color: '#38bdf8' }}
            title="Cetak Label Barcode & Price Tag Rak Toko"
          >
            <Barcode size={16} />
            <span>Cetak Barcode / Price Tag</span>
          </button>
          <button onClick={() => setIsCategoryModalOpen(true)} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
            <FolderPlus size={15} />
            <span>Kategori Master</span>
          </button>
          <button onClick={() => setIsUnitModalOpen(true)} className="btn btn-outline" style={{ fontSize: '0.82rem' }}>
            <Scale size={15} />
            <span>Satuan (Unit)</span>
          </button>
          <button onClick={() => setIsAddProductOpen(true)} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
            <Plus size={15} />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel" style={{ padding: '20px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>SKU / BARCODE</th>
                <th style={{ padding: '12px' }}>NAMA PRODUK & VARIAN</th>
                <th style={{ padding: '12px' }}>KATEGORI</th>
                <th style={{ padding: '12px' }}>SATUAN</th>
                <th style={{ padding: '12px' }}>HARGA BELI (MODAL)</th>
                <th style={{ padding: '12px' }}>HARGA JUAL</th>
                <th style={{ padding: '12px' }}>STOK CABANG</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada produk terdaftar. Klik "Tambah Produk Baru" untuk memulai katalog toko.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>{p.sku}</div>
                      {p.barcode && <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.barcode}</span>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.name}</div>
                      {p.variants && p.variants.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {p.variants.map(v => (
                            <span key={v.id} className="badge badge-indigo" style={{ fontSize: '0.7rem', padding: '2px 7px' }}>
                              {v.name} ({v.sku})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-emerald">{p.categoryName || '-'}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.unitName || 'Pcs'}</td>
                    <td style={{ padding: '12px' }}>Rp {p.purchasePrice?.toLocaleString('id-ID') || 0}</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#34d399' }}>
                      Rp {p.sellingPrice?.toLocaleString('id-ID') || 0}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${p.stockQuantity <= (p.stockMinimum || 5) ? 'badge-amber' : 'badge-emerald'}`}>
                        {p.stockQuantity ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedProductForBarcode(p);
                            setIsBarcodeModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '6px 9px', fontSize: '0.75rem', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                          title="Cetak Label Barcode & Price Tag untuk produk ini"
                        >
                          <Barcode size={13} color="#38bdf8" />
                          <span>Label</span>
                        </button>
                        <button
                          onClick={() => handleOpenVariantModal(p)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="Kelola Varian Produk (Ukuran, Rasa, Warna)"
                        >
                          <Layers size={13} />
                          <span>Varian ({p.variants?.length || 0})</span>
                        </button>
                        <button
                          onClick={() => handleOpenPriceModal(p)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="Atur harga spesifik cabang ini"
                        >
                          <DollarSign size={13} color="#10b981" />
                          <span>Atur Harga</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KELOLA VARIAN PRODUK */}
      {isVariantModalOpen && selectedProductForVariant && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Kelola Varian Produk</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedProductForVariant.name} ({selectedProductForVariant.sku})</p>
              </div>
              <button onClick={() => setIsVariantModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* List Existing Variants */}
            <div style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Daftar Varian Terdaftar ({selectedProductForVariant.variants?.length || 0}):</label>
              {(!selectedProductForVariant.variants || selectedProductForVariant.variants.length === 0) ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Belum ada varian. Tambahkan varian baru (misal: Ukuran Regular/Large, Dingin/Panas, dll).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedProductForVariant.variants.map((v, i) => (
                    <div key={v.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <div>
                        <strong style={{ color: '#ffffff' }}>{v.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>SKU: {v.sku}</div>
                      </div>
                      <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                        Stok: {v.stockQuantity ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Variant Form */}
            <form onSubmit={handleAddVariant} style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8' }}>+ Tambah Varian Baru</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label">SKU Varian</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={variantForm.sku}
                    onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                    placeholder="Contoh: KOP-01-M"
                  />
                </div>
                <div>
                  <label className="form-label">Nama Varian</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={variantForm.name}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                    placeholder="Contoh: Size Large / Dingin"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem' }} disabled={variantLoading}>
                  {variantLoading ? 'Menyimpan...' : 'Simpan Varian'}
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" onClick={() => setIsVariantModalOpen(false)} className="btn btn-outline">
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENETAPAN HARGA & PRICE HISTORY AUDIT TRAIL */}
      {isPriceModalOpen && selectedProductForPrice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Atur Harga Jual Cabang & Riwayat Audit</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedProductForPrice.name} ({selectedProductForPrice.sku})</p>
              </div>
              <button onClick={() => setIsPriceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePrice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Harga Jual Cabang (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={priceForm.sellingPrice}
                    onChange={(e) => setPriceForm({ ...priceForm, sellingPrice: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}
                  />
                </div>
                <div>
                  <label className="form-label">Harga Beli / Modal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={priceForm.purchasePrice}
                    onChange={(e) => setPriceForm({ ...priceForm, purchasePrice: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Diskon Cabang (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={priceForm.discountPercentage}
                    onChange={(e) => setPriceForm({ ...priceForm, discountPercentage: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Pajak PPN (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={priceForm.taxPercentage}
                    onChange={(e) => setPriceForm({ ...priceForm, taxPercentage: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Simpan Perubahan Harga
                </button>
              </div>
            </form>

            {/* Riwayat Audit Perubahan Harga (price_history Table) */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <History size={15} color="#a78bfa" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a78bfa' }}>Audit Trail: Riwayat Perubahan Harga Produk (price_history)</span>
              </div>

              {priceHistory.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '8px 0' }}>
                  Belum ada catatan riwayat perubahan harga sebelumnya.
                </div>
              ) : (
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ padding: '6px', textAlign: 'left' }}>Waktu</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Harga Jual</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Modal</th>
                        <th style={{ padding: '6px', textAlign: 'center' }}>Diskon</th>
                        <th style={{ padding: '6px', textAlign: 'center' }}>PPN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceHistory.map((ph, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '6px', color: 'var(--text-muted)' }}>
                            {ph.createdAt ? new Date(ph.createdAt).toLocaleString('id-ID') : '-'}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                            Rp {ph.sellingPrice?.toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>
                            Rp {ph.purchasePrice?.toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            {ph.discountPercentage || 0}%
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            {ph.taxPercentage || 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" onClick={() => setIsPriceModalOpen(false)} className="btn btn-outline">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KATEGORI MASTER */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={18} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Tambah Kategori Master</h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Kode Kategori</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: BEV, FOOD, SNK"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Nama Kategori</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: Minuman Dingin"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Induk Kategori (Hierarchical Category)</label>
                <select
                  className="form-input"
                  value={categoryForm.parentId}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                >
                  <option value="">-- Kategori Utama (Tanpa Induk) --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Deskripsi singkat kategori..."
                  value={categoryForm.desc}
                  onChange={(e) => setCategoryForm({ ...categoryForm, desc: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SATUAN (UNIT) */}
      {isUnitModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={18} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Tambah Satuan Unit</h3>
              </div>
              <button onClick={() => setIsUnitModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Kode Satuan</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: PCS, KG, LTR, CUP, BOX"
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Nama Satuan</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: Pieces, Kilogram, Cup"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Faktor Konversi / Size</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  value={unitForm.size}
                  onChange={(e) => setUnitForm({ ...unitForm, size: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Satuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUK */}
      {isAddProductOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tambah Produk Baru</h3>
              <button onClick={() => setIsAddProductOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">SKU Produk</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="form-input"
                    placeholder="KOP-003"
                  />
                </div>
                <div>
                  <label className="form-label">Barcode (Opsional)</label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    className="form-input"
                    placeholder="899..."
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="form-input"
                  placeholder="Kopi Susu Gula Aren"
                />
              </div>

              <div>
                <label className="form-label">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={productForm.desc}
                  onChange={(e) => setProductForm({ ...productForm, desc: e.target.value })}
                  className="form-input"
                  placeholder="Kopi espresso dengan susu segar dan aren murni"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Kategori</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Satuan (Unit)</label>
                  <select
                    value={productForm.unitId}
                    onChange={(e) => setProductForm({ ...productForm, unitId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">-- Pilih Satuan --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Harga Modal / Beli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.purchasePrice}
                    onChange={(e) => setProductForm({ ...productForm, purchasePrice: e.target.value })}
                    className="form-input"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="form-label">Harga Jual Toko (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    className="form-input"
                    placeholder="18000"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddProductOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CETAK BARCODE & PRICE TAG RAK */}
      {isBarcodeModalOpen && (
        <BarcodePrintModal
          products={products}
          initialSelectedProduct={selectedProductForBarcode}
          onClose={() => setIsBarcodeModalOpen(false)}
        />
      )}
    </div>
  );
}
