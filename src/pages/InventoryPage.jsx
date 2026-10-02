import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Boxes, ArrowRightLeft, PlusCircle, Wrench, AlertTriangle, History, X, Warehouse, Store, Plus, Truck, Building2, Receipt, DollarSign, Check, Edit2, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, FileText } from 'lucide-react';
import { PurchaseOrderJournalModal } from '../components/PurchaseOrderJournalModal';

export function InventoryPage() {
  const { user, selectedOutletId } = useAuth();
  const [outletStocks, setOutletStocks] = useState([]);
  const [storageStocks, setStorageStocks] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [isPOJournalOpen, setIsPOJournalOpen] = useState(false);
  const [storages, setStorages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Suppliers & Purchase Orders (Klaster 6)
  const [suppliers, setSuppliers] = useState([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: 'COD',
    notes: '',
    isActive: true,
  });

  // Purchase Order & Last Price Tracking
  const [lastPurchasePrice, setLastPurchasePrice] = useState(null);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);
  const [purchaseHistoryList, setPurchaseHistoryList] = useState([]);
  const [purchaseHistoryTitle, setPurchaseHistoryTitle] = useState('');

  // Modals
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [historyStockId, setHistoryStockId] = useState(null);
  const [stockHistoryList, setStockHistoryList] = useState([]);

  // Forms
  const [transferForm, setTransferForm] = useState({ productId: '', variantId: '', fromStorageId: '', quantity: '10', remarks: '' });
  const [adjustForm, setAdjustForm] = useState({ productId: '', variantId: '', quantity: '', minimum: '5', remarks: '' });
  const [purchaseForm, setPurchaseForm] = useState({
    productId: '',
    variantId: '',
    storageId: '',
    supplierId: '',
    quantity: '50',
    purchasePrice: '',
    invoiceNo: '',
    remarks: ''
  });
  const [storageForm, setStorageForm] = useState({ code: '', name: '' });

  const outletId = selectedOutletId || user?.outletId;

  const loadInventory = () => {
    if (!outletId) return;
    setLoading(true);
    Promise.all([
      api.getStocksByOutlet(outletId),
      api.getLowStockAlert(outletId),
      api.getStorages(),
      api.getProducts(outletId),
      api.getSuppliers(),
    ])
      .then(([oStocks, lowAlerts, strgs, prds, sups]) => {
        setOutletStocks(oStocks || []);
        setLowStockAlerts(lowAlerts || []);
        setStorages(strgs || []);
        setProducts(prds || []);
        setSuppliers(sups || []);
        if (strgs && strgs.length > 0) {
          api.getStocksByStorage(strgs[0].id).then(res => setStorageStocks(res || [])).catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, [outletId]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.transferStock({
        productId: Number(transferForm.productId),
        variantId: transferForm.variantId ? Number(transferForm.variantId) : null,
        fromStorageId: Number(transferForm.fromStorageId),
        toOutletId: outletId,
        quantity: Number(transferForm.quantity),
        remarks: transferForm.remarks,
      });
      alert('Mutasi stok berhasil! Stok gudang dikurangi dan stok outlet ditambahkan secara atomik.');
      setIsTransferOpen(false);
      setTransferForm({ productId: '', variantId: '', fromStorageId: '', quantity: '10', remarks: '' });
      loadInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.adjustStock({
        productId: Number(adjustForm.productId),
        variantId: adjustForm.variantId ? Number(adjustForm.variantId) : null,
        outletId,
        quantity: Number(adjustForm.quantity),
        minimum: Number(adjustForm.minimum),
        remarks: adjustForm.remarks,
      });
      alert('Penyesuaian stok berhasil disimpan.');
      setIsAdjustOpen(false);
      setAdjustForm({ productId: '', variantId: '', quantity: '', minimum: '5', remarks: '' });
      loadInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  // Update Purchase Form Product and fetch Last Purchase Price
  const handlePurchaseProductChange = async (productId, variantId = '') => {
    const selectedProd = products.find(p => p.id === Number(productId));
    const newForm = { ...purchaseForm, productId, variantId };

    if (productId) {
      try {
        const res = await api.getLastPurchasePrice(Number(productId), variantId ? Number(variantId) : null);
        const lastPrice = res?.lastPurchasePrice && res.lastPurchasePrice > 0 ? res.lastPurchasePrice : null;
        setLastPurchasePrice(lastPrice);

        // Pre-fill purchasePrice if empty or using previous product's price
        newForm.purchasePrice = String(lastPrice || selectedProd?.purchasePrice || '');
      } catch {
        setLastPurchasePrice(null);
        newForm.purchasePrice = String(selectedProd?.purchasePrice || '');
      }
    } else {
      setLastPurchasePrice(null);
    }

    setPurchaseForm(newForm);
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      await api.purchaseStock({
        productId: Number(purchaseForm.productId),
        variantId: purchaseForm.variantId ? Number(purchaseForm.variantId) : null,
        storageId: Number(purchaseForm.storageId),
        supplierId: purchaseForm.supplierId ? Number(purchaseForm.supplierId) : null,
        quantity: Number(purchaseForm.quantity),
        purchasePrice: purchaseForm.purchasePrice ? Number(purchaseForm.purchasePrice) : null,
        invoiceNo: purchaseForm.invoiceNo,
        remarks: purchaseForm.remarks,
      });
      alert('Pencatatan barang masuk (purchase) & Purchase Order berhasil disimpan!');
      setIsPurchaseOpen(false);
      setPurchaseForm({
        productId: '',
        variantId: '',
        storageId: '',
        supplierId: '',
        quantity: '50',
        purchasePrice: '',
        invoiceNo: '',
        remarks: ''
      });
      setLastPurchasePrice(null);
      loadInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  // Supplier Management Handlers
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      paymentTerms: 'COD',
      notes: '',
      isActive: true,
    });
    setIsSupplierFormOpen(true);
  };

  const handleOpenEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      paymentTerms: supplier.paymentTerms || 'COD',
      notes: supplier.notes || '',
      isActive: supplier.isActive !== false,
    });
    setIsSupplierFormOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, supplierForm);
        alert(`Supplier "${supplierForm.name}" berhasil diperbarui!`);
      } else {
        const created = await api.createSupplier(supplierForm);
        alert(`Supplier "${created.name}" berhasil didaftarkan!`);
        // If purchase modal is open, auto-select newly created supplier
        if (isPurchaseOpen) {
          setPurchaseForm(prev => ({ ...prev, supplierId: created.id }));
        }
      }
      setIsSupplierFormOpen(false);
      api.getSuppliers().then(sups => setSuppliers(sups || [])).catch(() => {});
    } catch (err) {
      alert(err.message || 'Gagal menyimpan supplier');
    }
  };

  const handleToggleSupplierStatus = async (id) => {
    try {
      await api.toggleSupplierStatus(id);
      api.getSuppliers().then(sups => setSuppliers(sups || [])).catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data supplier ini?')) return;
    try {
      await api.deleteSupplier(id);
      alert('Supplier berhasil dihapus.');
      api.getSuppliers().then(sups => setSuppliers(sups || [])).catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  // View PO History
  const handleOpenPurchaseHistory = async (productId, variantId = null, title = '') => {
    setPurchaseHistoryTitle(title);
    setIsPurchaseHistoryOpen(true);
    try {
      const logs = await api.getPurchaseHistory(productId, variantId);
      setPurchaseHistoryList(logs || []);
    } catch {
      setPurchaseHistoryList([]);
    }
  };

  const handleCreateStorage = async (e) => {
    e.preventDefault();
    try {
      await api.createStorage({
        code: storageForm.code.toUpperCase(),
        name: storageForm.name,
      });
      alert(`Gudang baru "${storageForm.name}" berhasil ditambahkan!`);
      setIsStorageModalOpen(false);
      setStorageForm({ code: '', name: '' });
      loadInventory();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan gudang');
    }
  };

  const handleViewHistory = async (stockId) => {
    setHistoryStockId(stockId);
    try {
      const logs = await api.getStockHistory(stockId);
      setStockHistoryList(logs || []);
    } catch {
      setStockHistoryList([]);
    }
  };

  const selectedAdjustProduct = products.find(p => p.id === Number(adjustForm.productId));
  const selectedTransferProduct = products.find(p => p.id === Number(transferForm.productId));
  const selectedPurchaseProduct = products.find(p => p.id === Number(purchaseForm.productId));

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Inventaris Multi-Lokasi & Mutasi Stok</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Kelola stok cabang, stok gudang pusat, varian produk, dan audit trail pergerakan stok</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', borderColor: '#818cf8', color: '#818cf8' }}
            title="Kelola Master Data Supplier & Vendor"
          >
            <Truck size={16} />
            <span>Master Supplier ({suppliers.length})</span>
          </button>
          <button
            onClick={() => setIsPOJournalOpen(true)}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', borderColor: '#34d399', color: '#34d399' }}
            title="Buku Register & Jurnal Pembelian Seluruh Purchase Order (PO)"
          >
            <Receipt size={16} />
            <span>Jurnal Pembelian (PO)</span>
          </button>
          <button onClick={() => setIsStorageModalOpen(true)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            <Warehouse size={16} />
            <span>Tambah Gudang</span>
          </button>
          <button onClick={() => setIsTransferOpen(true)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            <ArrowRightLeft size={16} />
            <span>Transfer Gudang ➔ Cabang</span>
          </button>
          <button onClick={() => setIsPurchaseOpen(true)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            <PlusCircle size={16} />
            <span>Barang Masuk (Supplier)</span>
          </button>
          <button onClick={() => setIsAdjustOpen(true)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            <Wrench size={16} />
            <span>Penyesuaian Stok</span>
          </button>
        </div>
      </div>

      {/* LOW STOCK ALERT BANNER */}
      {lowStockAlerts.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px'
        }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px' }}>
            <AlertTriangle size={22} color="#fbbf24" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
              Peringatan Stok Menipis ({lowStockAlerts.length} item perlu di-restock)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {lowStockAlerts.map(item => (
                <span key={item.id} className="badge badge-amber" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  {item.productName}{item.variantName ? ` (${item.variantName})` : ''}: Sisa <strong>{item.quantity}</strong> (Min: {item.minimum})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OUTLET INVENTORY TABLE */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Store size={20} color="#10b981" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Stok Barang di Cabang Ini</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>PRODUK</th>
                <th style={{ padding: '12px' }}>SKU</th>
                <th style={{ padding: '12px' }}>KUANTITAS AKTUAL</th>
                <th style={{ padding: '12px' }}>BATAS MINIMAL</th>
                <th style={{ padding: '12px' }}>STATUS</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>RIWAYAT LOG</th>
              </tr>
            </thead>
            <tbody>
              {outletStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada data stok di cabang ini. Lakukan penerimaan barang atau penyesuaian stok.
                  </td>
                </tr>
              ) : (
                outletStocks.map(stock => (
                  <tr key={stock.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      {stock.productName}
                      {stock.variantName && (
                        <span className="badge badge-indigo" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>
                          Varian: {stock.variantName}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{stock.productSku}</td>
                    <td style={{ padding: '12px', fontWeight: 800, fontSize: '0.95rem' }}>{stock.quantity} unit</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{stock.minimum} unit</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${stock.isLowStock ? 'badge-amber' : 'badge-emerald'}`}>
                        {stock.isLowStock ? 'Perlu Restock' : 'Aman'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewHistory(stock.id)}
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      >
                        <History size={13} />
                        <span>Audit Mutasi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STORAGE INVENTORY TABLE */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Warehouse size={20} color="#818cf8" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Stok Barang di Gudang Pusat (Storage)</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px' }}>PRODUK</th>
                <th style={{ padding: '12px' }}>GUDANG</th>
                <th style={{ padding: '12px' }}>STOK GUDANG</th>
                <th style={{ padding: '12px' }}>MINIMAL</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>RIWAYAT LOG</th>
              </tr>
            </thead>
            <tbody>
              {storageStocks.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada data stok di gudang. Lakukan input barang masuk (purchase) ke gudang.
                  </td>
                </tr>
              ) : (
                storageStocks.map(stock => (
                  <tr key={stock.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      {stock.productName}
                      {stock.variantName && (
                        <span className="badge badge-indigo" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>
                          Varian: {stock.variantName}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{stock.storageName || 'Gudang Pusat'}</td>
                    <td style={{ padding: '12px', fontWeight: 800, fontSize: '0.95rem', color: '#818cf8' }}>
                      {stock.quantity} unit
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{stock.minimum} unit</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewHistory(stock.id)}
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      >
                        <History size={13} />
                        <span>Audit Mutasi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSFER MODAL */}
      {isTransferOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Transfer Stok Gudang ➔ Cabang</h3>
              </div>
              <button onClick={() => setIsTransferOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Gudang Asal</label>
                <select
                  required
                  className="form-input"
                  value={transferForm.fromStorageId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromStorageId: e.target.value })}
                >
                  <option value="">Pilih Gudang Penyimpanan</option>
                  {storages.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Produk Yang Dimutasi</label>
                <select
                  required
                  className="form-input"
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value, variantId: '' })}
                >
                  <option value="">Pilih Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              {selectedTransferProduct?.variants?.length > 0 && (
                <div>
                  <label className="form-label">Pilih Varian Produk</label>
                  <select
                    className="form-input"
                    value={transferForm.variantId}
                    onChange={(e) => setTransferForm({ ...transferForm, variantId: e.target.value })}
                  >
                    <option value="">-- Produk Utama (Tanpa Varian) --</option>
                    {selectedTransferProduct.variants.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">Jumlah Kuantitas Transfer (Unit)</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Keterangan / Catatan Mutasi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Restock mingguan cabang"
                  value={transferForm.remarks}
                  onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsTransferOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-secondary">
                  Eksekusi Mutasi Atomik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {isAdjustOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Penyesuaian Stok Fisik (Adjustment)</h3>
              </div>
              <button onClick={() => setIsAdjustOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Pilih Produk</label>
                <select
                  required
                  className="form-input"
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value, variantId: '' })}
                >
                  <option value="">Pilih Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              {selectedAdjustProduct?.variants?.length > 0 && (
                <div>
                  <label className="form-label">Pilih Varian Produk</label>
                  <select
                    className="form-input"
                    value={adjustForm.variantId}
                    onChange={(e) => setAdjustForm({ ...adjustForm, variantId: e.target.value })}
                  >
                    <option value="">-- Produk Utama (Tanpa Varian) --</option>
                    {selectedAdjustProduct.variants.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Stok Fisik Aktual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="form-input"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                    placeholder="Contoh: 45"
                  />
                </div>
                <div>
                  <label className="form-label">Batas Minimum</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={adjustForm.minimum}
                    onChange={(e) => setAdjustForm({ ...adjustForm, minimum: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Alasan Penyesuaian</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Hasil stock opname bulanan"
                  value={adjustForm.remarks}
                  onChange={(e) => setAdjustForm({ ...adjustForm, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAdjustOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PURCHASE MODAL ENHANCED (KLASTER 6) */}
      {isPurchaseOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Penerimaan Barang Masuk & Purchase Order (PO)</h3>
              </div>
              <button onClick={() => setIsPurchaseOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Gudang & Supplier Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Lokasi Gudang Masuk</label>
                  <select
                    required
                    className="form-input"
                    value={purchaseForm.storageId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, storageId: e.target.value })}
                  >
                    <option value="">Pilih Gudang</option>
                    {storages.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Vendor / Supplier</label>
                    <button
                      type="button"
                      onClick={handleOpenAddSupplier}
                      style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                    >
                      + Supplier Baru
                    </button>
                  </div>
                  <select
                    className="form-input"
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                  >
                    <option value="">-- Tanpa Master Vendor --</option>
                    {suppliers.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.paymentTerms})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Produk & Varian */}
              <div>
                <label className="form-label">Produk Yang Diterima</label>
                <select
                  required
                  className="form-input"
                  value={purchaseForm.productId}
                  onChange={(e) => handlePurchaseProductChange(e.target.value, '')}
                >
                  <option value="">Pilih Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              {selectedPurchaseProduct?.variants?.length > 0 && (
                <div>
                  <label className="form-label">Pilih Varian Produk</label>
                  <select
                    className="form-input"
                    value={purchaseForm.variantId}
                    onChange={(e) => handlePurchaseProductChange(purchaseForm.productId, e.target.value)}
                  >
                    <option value="">-- Produk Utama (Tanpa Varian) --</option>
                    {selectedPurchaseProduct.variants.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Kuantitas & Harga Beli Modal Satuan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Kuantitas Masuk (Unit)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Harga Beli Modal / Unit (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="form-input"
                    placeholder="Contoh: 12500"
                    value={purchaseForm.purchasePrice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchasePrice: e.target.value })}
                  />
                </div>
              </div>

              {/* Live Fluctuation Tracking Indicator */}
              {(() => {
                const curPrice = Number(purchaseForm.purchasePrice) || 0;
                if (!lastPurchasePrice || !curPrice) return null;
                const diff = curPrice - lastPurchasePrice;
                const diffPct = ((diff / lastPurchasePrice) * 100).toFixed(1);

                return (
                  <div style={{
                    fontSize: '0.78rem',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: diff > 0 ? 'rgba(244, 63, 94, 0.12)' : diff < 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                    border: diff > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : diff < 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Harga Terakhir: <strong>Rp {lastPurchasePrice.toLocaleString('id-ID')}</strong></span>
                    {diff > 0 && (
                      <span style={{ color: '#f43f5e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowUpRight size={14} />
                        Naik +Rp {diff.toLocaleString('id-ID')} (+{diffPct}%)
                      </span>
                    )}
                    {diff < 0 && (
                      <span style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ArrowDownRight size={14} />
                        Turun -Rp {Math.abs(diff).toLocaleString('id-ID')} ({diffPct}%) Lebih Hemat
                      </span>
                    )}
                    {diff === 0 && (
                      <span style={{ color: 'var(--text-muted)' }}>Stabil (Harga Sama)</span>
                    )}
                  </div>
                );
              })()}

              {/* Total Biaya Pengadaan Banner */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', color: '#c7d2fe' }}>Total Estimasi Nilai Pengadaan:</span>
                <strong style={{ fontSize: '1.15rem', color: '#34d399' }}>
                  Rp {((Number(purchaseForm.quantity) || 0) * (Number(purchaseForm.purchasePrice) || 0)).toLocaleString('id-ID')}
                </strong>
              </div>

              {/* Invoice & Keterangan Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">No. Faktur / Invoice Supplier</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="INV-SUP-2026/001"
                    value={purchaseForm.invoiceNo}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Catatan PO / Keterangan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Restock mingguan bahan baku"
                    value={purchaseForm.remarks}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsPurchaseOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Barang Masuk & PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORAGE CREATION MODAL */}
      {isStorageModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Warehouse size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tambah Gudang Penyimpanan</h3>
              </div>
              <button onClick={() => setIsStorageModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStorage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Kode Gudang</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: WH-JKT, GUDANG-02"
                  value={storageForm.code}
                  onChange={(e) => setStorageForm({ ...storageForm, code: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Nama Gudang</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: Gudang Transit Jakarta Selatan"
                  value={storageForm.name}
                  onChange={(e) => setStorageForm({ ...storageForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsStorageModalOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL / STOCK HISTORY MODAL */}
      {historyStockId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#a78bfa" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Audit Trail Mutasi Stok (Kartu Stok)</h3>
              </div>
              <button onClick={() => setHistoryStockId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '8px' }}>Waktu</th>
                    <th style={{ padding: '8px' }}>Jenis Mutasi</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>In/Out</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Stok Akhir</th>
                    <th style={{ padding: '8px' }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {stockHistoryList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada riwayat mutasi untuk item ini.
                      </td>
                    </tr>
                  ) : (
                    stockHistoryList.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                          {h.createdAt ? new Date(h.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span className={`badge ${h.type === 'SALE' ? 'badge-rose' : h.type === 'PURCHASE' ? 'badge-emerald' : 'badge-indigo'}`} style={{ fontSize: '0.7rem' }}>
                            {h.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: h.stockInOut > 0 ? '#34d399' : '#f43f5e' }}>
                          {h.stockInOut > 0 ? `+${h.stockInOut}` : h.stockInOut}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>
                          {h.quantity}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {h.remarks || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setHistoryStockId(null)} className="btn btn-outline">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER DATA SUPPLIER MODAL (KLASTER 6) */}
      {isSupplierModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px', width: '90vw', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <Truck size={20} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Master Data Supplier & Vendor</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Kelola daftar mitra pemasok, kontak sales, alamat, dan termin pembayaran</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={handleOpenAddSupplier} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  <Plus size={14} />
                  <span>Tambah Supplier</span>
                </button>
                <button onClick={() => setIsSupplierModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '10px' }}>NAMA VENDOR / SUPPLIER</th>
                    <th style={{ padding: '10px' }}>KONTAK PIC & TELP/WA</th>
                    <th style={{ padding: '10px' }}>ALAMAT</th>
                    <th style={{ padding: '10px' }}>TERMIN PEMBAYARAN</th>
                    <th style={{ padding: '10px' }}>STATUS</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada data supplier. Klik "+ Tambah Supplier" untuk menambahkan mitra pemasok.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px' }}>
                          <strong style={{ color: '#ffffff' }}>{s.name}</strong>
                          {s.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{s.notes}</div>}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div>{s.contactPerson || '-'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{s.phone || s.email || '-'}</div>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '200px' }}>
                          {s.address || '-'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${s.paymentTerms === 'COD' ? 'badge-emerald' : 'badge-indigo'}`} style={{ fontSize: '0.75rem' }}>
                            {s.paymentTerms}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span
                            onClick={() => handleToggleSupplierStatus(s.id)}
                            style={{ cursor: 'pointer' }}
                            className={`badge ${s.isActive ? 'badge-emerald' : 'badge-rose'}`}
                            title="Klik untuk ubah status aktif/nonaktif"
                          >
                            {s.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditSupplier(s)}
                              className="btn btn-outline"
                              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                              title="Edit Supplier"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(s.id)}
                              className="btn btn-outline"
                              style={{ padding: '5px 8px', fontSize: '0.75rem', color: '#f43f5e' }}
                              title="Hapus Supplier"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsSupplierModalOpen(false)} className="btn btn-outline">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM TAMBAH / EDIT SUPPLIER MODAL */}
      {isSupplierFormOpen && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {editingSupplier ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
                </h3>
              </div>
              <button onClick={() => setIsSupplierFormOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Nama Perusahaan / Toko Vendor</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: PT. Sumber Pangan Makmur"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Nama Kontak Sales / PIC</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Pak Budi"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="08123456789"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Alamat Email (Opsional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="sales@vendor.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Alamat Gudang / Kantor Supplier</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Kawasan Industri Pulogadung, Jakarta Timur"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Termin Pembayaran (Term of Payment)</label>
                <select
                  className="form-input"
                  value={supplierForm.paymentTerms}
                  onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                >
                  <option value="COD">COD (Cash on Delivery / Bayar Tunai Saat Barang Tiba)</option>
                  <option value="NET 7">Tempo 7 Hari (NET 7)</option>
                  <option value="NET 14">Tempo 14 Hari (NET 14)</option>
                  <option value="NET 30">Tempo 30 Hari (NET 30 / Bulanan)</option>
                  <option value="TEMPO">Tempo Khusus (Custom Agreement)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Catatan Tambahan</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Min. order 5 dus, kirim hari rabu"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsSupplierFormOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'Simpan Perubahan' : 'Daftarkan Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PURCHASE ORDER JOURNAL / REGISTER MODAL */}
      <PurchaseOrderJournalModal
        isOpen={isPOJournalOpen}
        onClose={() => setIsPOJournalOpen(false)}
      />
    </div>
  );
}
