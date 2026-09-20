import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Boxes, ArrowRightLeft, PlusCircle, Wrench, AlertTriangle, History, X, Warehouse, Store } from 'lucide-react';

export function InventoryPage() {
  const { user, selectedOutletId } = useAuth();
  const [outletStocks, setOutletStocks] = useState([]);
  const [storageStocks, setStorageStocks] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [storages, setStorages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [historyStockId, setHistoryStockId] = useState(null);
  const [stockHistoryList, setStockHistoryList] = useState([]);

  // Forms
  const [transferForm, setTransferForm] = useState({ productId: '', fromStorageId: '', quantity: '10', remarks: '' });
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantity: '', minimum: '5', remarks: '' });
  const [purchaseForm, setPurchaseForm] = useState({ productId: '', storageId: '', quantity: '50', remarks: '' });

  const outletId = selectedOutletId || user?.outletId;

  const loadInventory = () => {
    if (!outletId) return;
    setLoading(true);
    Promise.all([
      api.getStocksByOutlet(outletId),
      api.getLowStockAlert(outletId),
      api.getStorages(),
      api.getProducts(outletId),
    ])
      .then(([oStocks, lowAlerts, strgs, prds]) => {
        setOutletStocks(oStocks);
        setLowStockAlerts(lowAlerts);
        setStorages(strgs);
        setProducts(prds);
        if (strgs.length > 0) {
          api.getStocksByStorage(strgs[0].id).then(setStorageStocks).catch(() => {});
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
        fromStorageId: Number(transferForm.fromStorageId),
        toOutletId: outletId,
        quantity: Number(transferForm.quantity),
        remarks: transferForm.remarks,
      });
      alert('Mutasi stok berhasil! Stok gudang dikurangi dan stok outlet ditambahkan secara atomik.');
      setIsTransferOpen(false);
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
        outletId,
        quantity: Number(adjustForm.quantity),
        minimum: Number(adjustForm.minimum),
        remarks: adjustForm.remarks,
      });
      alert('Penyesuaian stok berhasil disimpan.');
      setIsAdjustOpen(false);
      loadInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      await api.purchaseStock({
        productId: Number(purchaseForm.productId),
        storageId: Number(purchaseForm.storageId),
        quantity: Number(purchaseForm.quantity),
        remarks: purchaseForm.remarks,
      });
      alert('Pencatatan barang masuk (purchase) berhasil.');
      setIsPurchaseOpen(false);
      loadInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewHistory = async (stockId) => {
    setHistoryStockId(stockId);
    try {
      const logs = await api.getStockHistory(stockId);
      setStockHistoryList(logs);
    } catch {
      setStockHistoryList([]);
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Inventaris Multi-Lokasi & Mutasi Stok</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Kelola stok cabang, stok gudang pusat, dan rekam jejak mutasi (audit trail)</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
                  {item.productName}: Sisa <strong>{item.quantity}</strong> (Min: {item.minimum})
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
              {outletStocks.map(stock => (
                <tr key={stock.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{stock.productName}</td>
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
              ))}
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
              {storageStocks.map(stock => (
                <tr key={stock.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{stock.productName}</td>
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
              ))}
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
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                >
                  <option value="">Pilih Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

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
                  onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                >
                  <option value="">Pilih Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

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

      {/* PURCHASE MODAL */}
      {isPurchaseOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Penerimaan Barang Masuk (Purchase)</h3>
              </div>
              <button onClick={() => setIsPurchaseOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Lokasi Gudang Masuk</label>
                <select
                  required
                  className="form-input"
                  value={purchaseForm.storageId}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, storageId: e.target.value })}
                >
                  <option value="">Pilih Gudang</option>
                  {storages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Produk</label>
                <select
                  required
                  className="form-input"
                  value={purchaseForm.productId}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })}
                >
                  <option value="">Pilih Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Jumlah Kuantitas Masuk (Unit)</label>
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
                <label className="form-label">Keterangan / Faktur Supplier</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="PO/2026/09/001"
                  value={purchaseForm.remarks}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsPurchaseOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Catat Barang Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK HISTORY AUDIT TRAIL MODAL */}
      {historyStockId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Rekam Jejak Mutasi (Stock History)</h3>
              </div>
              <button onClick={() => setHistoryStockId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {stockHistoryList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Belum ada riwayat mutasi untuk item ini.
                </div>
              ) : (
                stockHistoryList.map(log => (
                  <div
                    key={log.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`badge ${log.status === 'IN' ? 'badge-emerald' : 'badge-rose'}`}>
                          {log.status} {log.stockInOut > 0 ? `+${log.stockInOut}` : log.stockInOut}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{log.type}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.remarks}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : '-'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Saldo Akhir:</span>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {log.quantity} unit
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setHistoryStockId(null)} className="btn btn-outline">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
