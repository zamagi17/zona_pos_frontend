import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plus, Tag, History, Edit3, Layers, DollarSign, X } from 'lucide-react';

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
        setProducts(pList);
        setCategories(cList);
        setUnits(uList);
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
    // Fetch price history if price id exists
    api.getProducts(outletId)
      .then(pList => {
        const found = pList.find(p => p.id === product.id);
        if (found) setPriceHistory([]);
      });
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
      alert('Harga cabang dan riwayat price_history berhasil diperbarui!');
      setIsPriceModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Katalog Produk & Penetapan Harga Cabang</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Atur master produk, varian, dan harga jual/beli spesifik untuk cabang aktif</p>
        </div>
        <button onClick={() => setIsAddProductOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>SKU / BARCODE</th>
                <th style={{ padding: '12px' }}>NAMA PRODUK</th>
                <th style={{ padding: '12px' }}>KATEGORI</th>
                <th style={{ padding: '12px' }}>SATUAN</th>
                <th style={{ padding: '12px' }}>HARGA BELI (MODAL)</th>
                <th style={{ padding: '12px' }}>HARGA JUAL</th>
                <th style={{ padding: '12px' }}>STOK CABANG</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700 }}>{p.sku}</div>
                    {p.barcode && <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.barcode}</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>
                    {p.name}
                    {p.variants && p.variants.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {p.variants.map(v => (
                          <span key={v.id} className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                            {v.name}
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
                    <button
                      onClick={() => handleOpenPriceModal(p)}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      title="Atur harga spesifik cabang ini"
                    >
                      <DollarSign size={13} color="#10b981" />
                      <span>Atur Harga</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                  placeholder="Contoh: Kopi Latte Hazelnut"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-input"
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Satuan (Unit)</label>
                  <select
                    className="form-input"
                    value={productForm.unitId}
                    onChange={(e) => setProductForm({ ...productForm, unitId: e.target.value })}
                  >
                    <option value="">Pilih Satuan</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Harga Beli / Modal (Rp)</label>
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
                  <label className="form-label">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    className="form-input"
                    placeholder="20000"
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

      {/* MODAL ATUR HARGA SPESIFIK CABANG */}
      {isPriceModalOpen && selectedProductForPrice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Atur Harga Jual & Modal Cabang</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedProductForPrice.name} ({selectedProductForPrice.sku})</p>
              </div>
              <button onClick={() => setIsPriceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePrice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Harga Jual Cabang (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={priceForm.sellingPrice}
                  onChange={(e) => setPriceForm({ ...priceForm, sellingPrice: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="form-label">Harga Modal / Beli Cabang (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={priceForm.purchasePrice}
                  onChange={(e) => setPriceForm({ ...priceForm, purchasePrice: e.target.value })}
                  className="form-input"
                />
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
                  <label className="form-label">Pajak (%)</label>
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

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsPriceModalOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan Harga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
