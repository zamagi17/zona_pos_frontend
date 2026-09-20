import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { Search, ShoppingBag, Plus, Minus, Trash2, PauseCircle, PlayCircle, CreditCard, QrCode, Banknote, UserPlus, AlertCircle, Check } from 'lucide-react';
import { RecallOrderModal } from '../components/RecallOrderModal';
import { ReceiptModal } from '../components/ReceiptModal';

export function PosKasir({ onOpenShiftModal }) {
  const { user, selectedOutletId } = useAuth();
  const { activeShift } = useShift();
  const {
    cartItems,
    selectedCustomer,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setSelectedCustomer,
    holdOrder,
    checkout,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [completedTrx, setCompletedTrx] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashAmount, setCashAmount] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const outletId = selectedOutletId || user?.outletId;

  // Load products & categories
  const loadData = () => {
    if (!outletId) return;
    setLoading(true);
    Promise.all([
      api.getProducts(outletId),
      api.getCategories(),
      api.getCustomers(),
    ])
      .then(([pList, cList, custs]) => {
        setProducts(pList);
        setCategories(cList);
        setCustomers(custs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [outletId]);

  // Filter products
  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) ||
             (p.sku && p.sku.toLowerCase().includes(q)) ||
             (p.barcode && p.barcode.toLowerCase().includes(q));
    }
    return true;
  });

  const handleHold = async () => {
    try {
      await holdOrder();
      alert('Pesanan berhasil disimpan (DRAFT). Anda dapat melayani antrean pelanggan berikutnya.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenCheckout = () => {
    if (!activeShift) {
      onOpenShiftModal();
      return;
    }
    setCashAmount(String(grandTotal));
    setPaymentMethod('CASH');
    setCheckoutError(null);
    setIsCheckoutModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      const paid = paymentMethod === 'CASH' ? Number(cashAmount) : grandTotal;
      const res = await checkout({
        paymentMethod,
        amountPaid: paid,
        reference: paymentMethod === 'QRIS' ? 'QRIS-' + Date.now() : null,
      });
      setIsCheckoutModalOpen(false);
      setCompletedTrx(res);
      // Reload products to refresh live stock counts
      loadData();
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
      });
      setCustomers(prev => [...prev, created]);
      setSelectedCustomer(created);
      setIsCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 100px)', padding: '16px 16px 0' }}>
      {/* LEFT: PRODUCTS CATALOG PANEL */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '18px' }}>
        {/* Search & Category Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '42px', fontSize: '0.9rem' }}
              placeholder="Cari nama produk, SKU, atau scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsRecallOpen(true)}
            className="btn btn-outline"
            style={{ padding: '9px 14px', fontSize: '0.85rem' }}
            title="Buka pesanan tertunda (Draft)"
          >
            <PlayCircle size={16} color="#818cf8" />
            <span>Recall Order</span>
          </button>
        </div>

        {/* Category Pill Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px', flexShrink: 0 }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: selectedCategory === null ? '#10b981' : 'rgba(255,255,255,0.06)',
              color: selectedCategory === null ? '#ffffff' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            Semua Menu
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: selectedCategory === c.id ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: selectedCategory === c.id ? '#ffffff' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
          alignContent: 'start',
          paddingRight: '4px'
        }}>
          {filteredProducts.map(p => {
            const isOutOfStock = p.stockQuantity !== null && p.stockQuantity <= 0;
            const isLow = p.stockQuantity !== null && p.stockQuantity <= (p.stockMinimum || 5);
            return (
              <div
                key={p.id}
                className="glass-card"
                onClick={() => !isOutOfStock && addToCart(p)}
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.5 : 1,
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>{p.sku}</span>
                    <span className={`badge ${isOutOfStock ? 'badge-rose' : isLow ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      {isOutOfStock ? 'Habis' : `Stok: ${p.stockQuantity ?? '-'}`}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.25, marginBottom: '4px' }}>
                    {p.name}
                  </h4>
                  {p.desc && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.desc}
                    </p>
                  )}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                      Rp {p.sellingPrice ? p.sellingPrice.toLocaleString('id-ID') : '0'}
                    </span>
                    {p.unitName && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/{p.unitName}</span>}
                  </div>

                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isOutOfStock ? 'rgba(255,255,255,0.05)' : 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isOutOfStock ? 'var(--text-dim)' : '#10b981'
                  }}>
                    <Plus size={16} />
                  </div>
                </div>

                {/* Variants if any */}
                {p.variants && p.variants.length > 0 && (
                  <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {p.variants.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, v);
                        }}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          color: '#818cf8',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + {v.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: CART & BILLING PANEL */}
      <div className="glass-panel" style={{ width: '380px', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '18px' }}>
        {/* Customer Selector */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <select
            className="form-input"
            style={{ fontSize: '0.82rem', padding: '8px 10px', flex: 1 }}
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find(c => c.id === Number(e.target.value));
              setSelectedCustomer(cust || null);
            }}
          >
            <option value="">Pelanggan Umum (Walk-in)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="btn btn-outline"
            style={{ padding: '8px 10px' }}
            title="Tambah Pelanggan Baru"
          >
            <UserPlus size={16} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          {cartItems.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.88rem' }}>Keranjang kasir masih kosong</p>
              <span style={{ fontSize: '0.75rem' }}>Klik produk di sebelah kiri untuk menambah</span>
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={`${item.productId}-${item.variantId || 'base'}`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.productName}</div>
                  {item.variantName && (
                    <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>({item.variantName})</span>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Rp {item.unitPrice?.toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '2px' }}>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.88rem', minWidth: '70px', textAlign: 'right' }}>
                    Rp {item.subtotal?.toLocaleString('id-ID')}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId, item.variantId)}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <span>Subtotal:</span>
            <span>Rp {subtotal?.toLocaleString('id-ID')}</span>
          </div>
          {totalDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: '#f43f5e' }}>
              <span>Diskon:</span>
              <span>-Rp {totalDiscount?.toLocaleString('id-ID')}</span>
            </div>
          )}
          {totalTax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
              <span>Pajak:</span>
              <span>Rp {totalTax?.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 14px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>TOTAL BAYAR:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
              Rp {grandTotal?.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
            <button
              onClick={handleHold}
              disabled={cartItems.length === 0}
              className="btn btn-outline"
              style={{ padding: '12px 8px', fontSize: '0.8rem', flexDirection: 'column', gap: '2px' }}
              title="Tahan pesanan sementara (DRAFT) untuk melayani antrean lain"
            >
              <PauseCircle size={16} color="#f59e0b" />
              <span>Hold Bill</span>
            </button>

            <button
              onClick={handleOpenCheckout}
              disabled={cartItems.length === 0}
              className="btn btn-primary"
              style={{ padding: '12px 14px', fontSize: '1rem', fontWeight: 800 }}
            >
              <Banknote size={18} />
              <span>Bayar (Checkout)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHECKOUT & PAYMENT MODAL */}
      {isCheckoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Proses Pembayaran</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Total tagihan belanja: <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>Rp {grandTotal?.toLocaleString('id-ID')}</strong>
            </p>

            {checkoutError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleProcessPayment}>
              {/* Payment Method Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: paymentMethod === 'CASH' ? '2px solid #10b981' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'CASH' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'CASH' ? '#10b981' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Banknote size={20} />
                  <span>TUNAI (CASH)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: paymentMethod === 'QRIS' ? '2px solid #6366f1' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'QRIS' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'QRIS' ? '#818cf8' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <QrCode size={20} />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('DEBIT')}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: paymentMethod === 'DEBIT' ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'DEBIT' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'DEBIT' ? '#fbbf24' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CreditCard size={20} />
                  <span>DEBIT / EDC</span>
                </button>
              </div>

              {/* CASH INPUT & QUICK CHIPS */}
              {paymentMethod === 'CASH' ? (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Nominal Uang Diterima (Rp)</label>
                  <input
                    type="number"
                    min={grandTotal}
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    required
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: 800, padding: '12px 16px' }}
                    placeholder="Contoh: 50000"
                    autoFocus
                  />

                  {/* Quick Cash Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setCashAmount(String(grandTotal))}
                      className="badge badge-emerald"
                      style={{ padding: '6px 10px', cursor: 'pointer' }}
                    >
                      Uang Pas (Rp {grandTotal?.toLocaleString('id-ID')})
                    </button>
                    {[20000, 50000, 100000, 200000].map(amt => (
                      amt >= grandTotal && (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashAmount(String(amt))}
                          className="badge badge-indigo"
                          style={{ padding: '6px 10px', cursor: 'pointer' }}
                        >
                          Rp {amt.toLocaleString('id-ID')}
                        </button>
                      )
                    ))}
                  </div>

                  {/* Live Change Calculation */}
                  {Number(cashAmount) >= grandTotal && (
                    <div style={{
                      marginTop: '14px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10b981',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Kembalian:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>
                        Rp {(Number(cashAmount) - grandTotal).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              ) : paymentMethod === 'QRIS' ? (
                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px' }}>
                  <QrCode size={120} color="#818cf8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.9rem' }}>Scan QRIS Dinamis</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mendukung BCA, Mandiri, GoPay, OVO, ShopeePay, DANA</span>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px' }}>
                  <CreditCard size={48} color="#fbbf24" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Silakan gesek/tap kartu pada mesin EDC</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={checkoutLoading || (paymentMethod === 'CASH' && Number(cashAmount) < grandTotal)}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.95rem' }}
                >
                  {checkoutLoading ? 'Memproses Transaksi...' : 'Selesaikan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px' }}>Tambah Pelanggan Baru</h3>
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="form-input"
                  placeholder="Budi Santoso"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="form-input"
                  placeholder="081234567890"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="btn btn-outline">
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

      {/* RECALL ORDER MODAL */}
      <RecallOrderModal
        isOpen={isRecallOpen}
        onClose={() => setIsRecallOpen(false)}
      />

      {/* RECEIPT SUCCESS MODAL */}
      <ReceiptModal
        isOpen={!!completedTrx}
        transaction={completedTrx}
        onClose={() => setCompletedTrx(null)}
      />
    </div>
  );
}
