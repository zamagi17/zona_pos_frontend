import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { Search, ShoppingBag, Plus, Minus, Trash2, PauseCircle, PlayCircle, CreditCard, QrCode, Banknote, UserPlus, AlertCircle, Check, X, ArrowUpDown, Clock, Calendar, Building2, Layers, Tag, Percent, Sparkles, Gift } from 'lucide-react';
import { RecallOrderModal } from '../components/RecallOrderModal';
import { ReceiptModal } from '../components/ReceiptModal';

export function PosKasir({ onOpenShiftModal, onOpenCashMovementModal }) {
  const { user, selectedOutletId } = useAuth();
  const { activeShift } = useShift();
  const {
    cartItems,
    selectedCustomer,
    subtotal,
    itemDiscountTotal,
    orderDiscountType,
    orderDiscountValue,
    calculatedOrderDiscount,
    appliedVoucher,
    calculatedVoucherDiscount,
    totalTax,
    grandTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    setSelectedCustomer,
    applyOrderDiscount,
    removeOrderDiscount,
    applyVoucher,
    removeVoucher,
    holdOrder,
    checkout,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Search input ref for F2 quick focus
  const searchInputRef = useRef(null);

  // Modals
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [completedTrx, setCompletedTrx] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [variantModalProduct, setVariantModalProduct] = useState(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'QRIS' | 'DEBIT' | 'SPLIT' | 'TEMPO'
  const [cashAmount, setCashAmount] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Split Payment State
  const [splitRows, setSplitRows] = useState([
    { id: 1, method: 'CASH', amount: '', notes: '' },
    { id: 2, method: 'QRIS', amount: '', notes: '' },
  ]);

  // Tempo / Kasbon State
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };
  const [tempoDueDate, setTempoDueDate] = useState(getDefaultDueDate());
  const [tempoDownPayment, setTempoDownPayment] = useState('');
  const [tempoDpMethod, setTempoDpMethod] = useState('CASH');
  const [tempoNotes, setTempoNotes] = useState('');

  // Klaster 3: Diskon Global Nota & Kode Voucher Promosi State
  const [activePromotions, setActivePromotions] = useState([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState(null);
  const [voucherSuccess, setVoucherSuccess] = useState(null);
  const [orderDiscountMode, setOrderDiscountMode] = useState('FIXED'); // 'FIXED' | 'PERCENT'
  const [orderDiscountInput, setOrderDiscountInput] = useState('');
  const [isDiscountPanelOpen, setIsDiscountPanelOpen] = useState(false);

  const outletId = selectedOutletId || user?.outletId;

  // Synthesize instant retail POS audio beep for scanner confirmation
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context may be restricted by browser policy before first user interaction
    }
  };

  // Load products & categories with smart local caching for instant rendering
  const loadData = () => {
    if (!outletId) return;

    // Read from cache first for 0ms instant display
    const cached = localStorage.getItem(`zona_pos_products_${outletId}`);
    if (cached) {
      try {
        setProducts(JSON.parse(cached));
      } catch {}
    }

    setLoading(true);
    Promise.all([
      api.getProducts(outletId),
      api.getCategories(),
      api.getCustomers(),
      api.getActivePromotions(outletId).catch(() => []),
    ])
      .then(([pList, cList, custs, promos]) => {
        setProducts(pList);
        setCategories(cList);
        setCustomers(custs);
        setActivePromotions(promos || []);
        try {
          localStorage.setItem(`zona_pos_products_${outletId}`, JSON.stringify(pList));
        } catch {}
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [outletId]);

  // Global Keyboard Shortcuts (Speed of Service Engine)
  useEffect(() => {
    const handleGlobalHotkeys = (e) => {
      // F2: Focus and select Search / Barcode input
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F4: Parkir Transaksi (Hold Order)
      else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0) {
          handleHold();
        }
      }
      // F7: Panggil Kembali Antrean (Recall Order)
      else if (e.key === 'F7') {
        e.preventDefault();
        setIsRecallOpen(true);
      }
      // F8: Buka dialog Pembayaran / Checkout
      else if (e.key === 'F8') {
        e.preventDefault();
        if (cartItems.length > 0 && !isCheckoutModalOpen) {
          handleOpenCheckout();
        }
      }
      // Escape: Tutup dialog aktif
      else if (e.key === 'Escape') {
        if (isCheckoutModalOpen) setIsCheckoutModalOpen(false);
        if (isRecallOpen) setIsRecallOpen(false);
        if (isCustomerModalOpen) setIsCustomerModalOpen(false);
        if (variantModalProduct) setVariantModalProduct(null);
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [cartItems, isCheckoutModalOpen, isRecallOpen, isCustomerModalOpen, variantModalProduct, grandTotal, activeShift]);

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

  // Handle enter key on barcode scanner / search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchQuery.trim().toLowerCase();
      if (!trimmed) return;

      // 1. Check exact barcode or SKU match
      const exactMatch = products.find(p =>
        (p.barcode && p.barcode.toLowerCase() === trimmed) ||
        (p.sku && p.sku.toLowerCase() === trimmed)
      );

      if (exactMatch) {
        addToCart(exactMatch);
        playBeep();
        setSearchQuery('');
        return;
      }

      // 2. If single filtered product, add immediately
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        playBeep();
        setSearchQuery('');
      }
    }
  };

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
    const half = Math.floor(grandTotal / 2);
    setSplitRows([
      { id: 1, method: 'CASH', amount: String(half), notes: '' },
      { id: 2, method: 'QRIS', amount: String(grandTotal - half), notes: '' },
    ]);
    setTempoDueDate(getDefaultDueDate());
    setTempoDownPayment('');
    setTempoDpMethod('CASH');
    setTempoNotes('');
    setIsCheckoutModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      const idempotencyKey = `IDEMP-${outletId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let checkoutPayload = { idempotencyKey };

      if (paymentMethod === 'CASH') {
        const paid = Number(cashAmount);
        if (paid < grandTotal) {
          throw new Error(`Nominal tunai kurang dari total tagihan (Rp ${grandTotal.toLocaleString('id-ID')})`);
        }
        checkoutPayload.paymentMethod = 'CASH';
        checkoutPayload.amountPaid = paid;
      } else if (paymentMethod === 'QRIS') {
        checkoutPayload.paymentMethod = 'QRIS';
        checkoutPayload.amountPaid = grandTotal;
        checkoutPayload.reference = 'QRIS-' + Date.now();
      } else if (paymentMethod === 'DEBIT') {
        checkoutPayload.paymentMethod = 'DEBIT';
        checkoutPayload.amountPaid = grandTotal;
        checkoutPayload.reference = 'DEBIT-' + Date.now();
      } else if (paymentMethod === 'SPLIT') {
        const validRows = splitRows.filter(r => Number(r.amount) > 0);
        if (validRows.length < 2) {
          throw new Error('Split Payment memerlukan minimal 2 baris pembayaran dengan nominal > 0');
        }
        const totalAllocated = validRows.reduce((acc, r) => acc + Number(r.amount), 0);
        if (totalAllocated < grandTotal) {
          throw new Error(`Total pembayaran campuran (Rp ${totalAllocated.toLocaleString('id-ID')}) kurang dari tagihan (Rp ${grandTotal.toLocaleString('id-ID')})`);
        }

        const hasTempo = validRows.some(r => r.method === 'TEMPO');
        if (hasTempo && !selectedCustomer) {
          throw new Error('Pembayaran Kasbon / Tempo pada split payment memerlukan pelanggan terdaftar.');
        }

        checkoutPayload.payments = validRows.map(r => ({
          paymentMethod: r.method,
          amount: Number(r.amount),
          dueDate: r.method === 'TEMPO' ? (tempoDueDate ? `${tempoDueDate}T23:59:59` : null) : null,
          notes: r.notes || null,
        }));
        if (hasTempo && tempoDueDate) {
          checkoutPayload.dueDate = `${tempoDueDate}T23:59:59`;
        }
      } else if (paymentMethod === 'TEMPO') {
        if (!selectedCustomer) {
          throw new Error('Pilih atau daftarkan pelanggan terlebih dahulu sebelum memproses transaksi Kasbon / Tempo.');
        }
        const dp = Number(tempoDownPayment) || 0;
        if (dp < 0 || dp >= grandTotal) {
          if (dp >= grandTotal) {
            throw new Error('Nominal DP sama atau melebihi total tagihan. Gunakan pembayaran reguler.');
          }
        }
        const remainingDebt = grandTotal - dp;
        const dueDateTime = tempoDueDate ? `${tempoDueDate}T23:59:59` : null;

        const paymentsList = [];
        if (dp > 0) {
          paymentsList.push({
            paymentMethod: tempoDpMethod,
            amount: dp,
            notes: 'Uang Muka / DP Kasbon',
          });
        }
        paymentsList.push({
          paymentMethod: 'TEMPO',
          amount: remainingDebt,
          dueDate: dueDateTime,
          notes: tempoNotes || 'Kasbon / Tempo Pelanggan',
        });

        checkoutPayload.payments = paymentsList;
        checkoutPayload.dueDate = dueDateTime;
      }

      const res = await checkout(checkoutPayload);
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

  // Klaster 3: Diskon Nota & Kode Voucher Handlers
  const handleApplyVoucher = async (codeToApply = voucherInput) => {
    if (!codeToApply || !codeToApply.trim()) return;
    try {
      setVoucherLoading(true);
      setVoucherError(null);
      setVoucherSuccess(null);
      const res = await api.validatePromotion({
        code: codeToApply.trim().toUpperCase(),
        outletId,
        subtotal: subtotal - (itemDiscountTotal || 0),
      });
      if (res.valid) {
        applyVoucher(res);
        setVoucherSuccess(res.message);
        setVoucherInput('');
        playBeep();
      } else {
        setVoucherError(res.message);
      }
    } catch (err) {
      setVoucherError(err.message || 'Gagal memvalidasi kode voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleApplyOrderDiscount = (mode, val) => {
    const num = Number(val) || 0;
    if (num <= 0) {
      removeOrderDiscount();
      setOrderDiscountInput('');
    } else {
      applyOrderDiscount(mode, num);
      playBeep();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 100px)', padding: '16px 16px 0' }}>
      {/* LEFT: PRODUCTS CATALOG PANEL */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '18px' }}>
        {/* Search & Category Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              ref={searchInputRef}
              type="text"
              className="form-input"
              style={{ paddingLeft: '42px', fontSize: '0.9rem' }}
              placeholder="Cari produk atau scan barcode... (Tekan Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <button
            onClick={() => setIsRecallOpen(true)}
            className="btn btn-outline"
            style={{ padding: '9px 14px', fontSize: '0.85rem' }}
            title="Buka pesanan tertunda (Hotkeys: F7)"
          >
            <PlayCircle size={16} color="#818cf8" />
            <span>Recall [F7]</span>
          </button>
        </div>

        {/* Hotkeys Speed-of-Service Bar */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', fontSize: '0.72rem' }}>
          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
            <kbd style={{ background: 'rgba(16,185,129,0.2)', padding: '2px 5px', borderRadius: '3px', color: '#34d399', fontWeight: 800 }}>F2</kbd> Scan Barcode
          </span>
          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
            <kbd style={{ background: 'rgba(129,140,248,0.2)', padding: '2px 5px', borderRadius: '3px', color: '#818cf8', fontWeight: 800 }}>F4</kbd> Parkir (Hold)
          </span>
          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
            <kbd style={{ background: 'rgba(251,191,36,0.2)', padding: '2px 5px', borderRadius: '3px', color: '#fbbf24', fontWeight: 800 }}>F7</kbd> Recall Antrean
          </span>
          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
            <kbd style={{ background: 'rgba(52,211,153,0.2)', padding: '2px 5px', borderRadius: '3px', color: '#34d399', fontWeight: 800 }}>F8</kbd> Bayar Cepat
          </span>
          <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
            <kbd style={{ background: 'rgba(248,113,113,0.2)', padding: '2px 5px', borderRadius: '3px', color: '#f87171', fontWeight: 800 }}>Esc</kbd> Tutup Modal
          </span>
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
                onClick={() => {
                  if (isOutOfStock) return;
                  if (p.variants && p.variants.length > 0) {
                    setVariantModalProduct(p);
                  } else {
                    addToCart(p);
                    playBeep();
                  }
                }}
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
                          playBeep();
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

          {activeShift && onOpenCashMovementModal && (
            <button
              onClick={onOpenCashMovementModal}
              className="btn btn-outline"
              style={{
                padding: '8px 10px',
                color: '#a5b4fc',
                borderColor: 'rgba(99,102,241,0.4)',
                background: 'rgba(99,102,241,0.1)'
              }}
              title="Kas Masuk / Kas Keluar Laci (Petty Cash)"
            >
              <ArrowUpDown size={16} />
            </button>
          )}
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

        {/* KLASTER 3: DISKON NOTA & KODE VOUCHER PROMO */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '10px',
          marginTop: '6px',
        }}>
          {/* Header Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Tag size={13} color="#10b981" />
              <span>Diskon & Voucher Nota</span>
            </span>
            <button
              type="button"
              onClick={() => setIsDiscountPanelOpen(!isDiscountPanelOpen)}
              style={{
                background: isDiscountPanelOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: isDiscountPanelOpen ? '#10b981' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {isDiscountPanelOpen ? 'Tutup Panel' : (calculatedOrderDiscount > 0 || appliedVoucher ? 'Kelola Diskon' : '+ Tambah Diskon')}
            </button>
          </div>

          {/* Active Applied Badges (Always visible when applied) */}
          {(calculatedOrderDiscount > 0 || appliedVoucher) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {calculatedOrderDiscount > 0 && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}>
                  <Percent size={12} />
                  <span>Nota: -Rp {calculatedOrderDiscount.toLocaleString('id-ID')} ({orderDiscountType === 'PERCENT' ? `${orderDiscountValue}%` : 'Rp'})</span>
                  <button
                    onClick={() => {
                      removeOrderDiscount();
                      setOrderDiscountInput('');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', padding: 0 }}
                    title="Hapus Diskon Nota"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {appliedVoucher && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}>
                  <Sparkles size={12} />
                  <span>Voucher {appliedVoucher.code}: -Rp {calculatedVoucherDiscount.toLocaleString('id-ID')}</span>
                  <button
                    onClick={() => {
                      removeVoucher();
                      setVoucherSuccess(null);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', padding: 0 }}
                    title="Hapus Voucher"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expandable Panel */}
          {isDiscountPanelOpen && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* 1. INPUT DISKON NOTA */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Diskon Keseluruhan Nota:
                  </label>
                  {/* Mode Selector */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '1px' }}>
                    <button
                      type="button"
                      onClick={() => setOrderDiscountMode('FIXED')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        background: orderDiscountMode === 'FIXED' ? '#10b981' : 'transparent',
                        color: orderDiscountMode === 'FIXED' ? '#0f172a' : 'var(--text-muted)'
                      }}
                    >
                      Rp
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderDiscountMode('PERCENT')}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        background: orderDiscountMode === 'PERCENT' ? '#10b981' : 'transparent',
                        color: orderDiscountMode === 'PERCENT' ? '#0f172a' : 'var(--text-muted)'
                      }}
                    >
                      %
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder={orderDiscountMode === 'PERCENT' ? 'Persen (misal: 10)' : 'Nominal (misal: 15000)'}
                    value={orderDiscountInput}
                    onChange={(e) => setOrderDiscountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyOrderDiscount(orderDiscountMode, orderDiscountInput);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: '0.8rem',
                      background: 'var(--surface-color)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-main)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyOrderDiscount(orderDiscountMode, orderDiscountInput)}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Terapkan
                  </button>
                </div>

                {/* Quick Preset Buttons */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {orderDiscountMode === 'PERCENT' ? (
                    [5, 10, 15, 20].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setOrderDiscountInput(String(pct));
                          handleApplyOrderDiscount('PERCENT', pct);
                        }}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {pct}%
                      </button>
                    ))
                  ) : (
                    [5000, 10000, 20000, 50000].map(nom => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => {
                          setOrderDiscountInput(String(nom));
                          handleApplyOrderDiscount('FIXED', nom);
                        }}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {nom >= 1000 ? `${nom / 1000}k` : nom}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* 2. INPUT KODE VOUCHER PROMO */}
              <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Kode Voucher Promo:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Contoh: HEMAT10"
                    value={voucherInput}
                    onChange={(e) => {
                      setVoucherInput(e.target.value.toUpperCase());
                      setVoucherError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyVoucher(voucherInput);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                      background: 'var(--surface-color)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-main)'
                    }}
                  />
                  <button
                    type="button"
                    disabled={voucherLoading || !voucherInput.trim()}
                    onClick={() => handleApplyVoucher(voucherInput)}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    {voucherLoading ? 'Cek...' : 'Pakai'}
                  </button>
                </div>

                {voucherError && (
                  <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{voucherError}</span>
                  </div>
                )}
                {voucherSuccess && (
                  <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} />
                    <span>{voucherSuccess}</span>
                  </div>
                )}

                {/* Available Voucher Chips */}
                {activePromotions.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Pilihan Voucher Aktif (Klik untuk pasang):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {activePromotions.map(promo => (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => {
                            setVoucherInput(promo.code);
                            handleApplyVoucher(promo.code);
                          }}
                          style={{
                            background: appliedVoucher?.code === promo.code ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${appliedVoucher?.code === promo.code ? '#10b981' : 'var(--border-subtle)'}`,
                            color: appliedVoucher?.code === promo.code ? '#10b981' : 'var(--text-muted)',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={promo.description || promo.name}
                        >
                          <Gift size={11} />
                          <span>{promo.code}</span>
                          <span style={{ opacity: 0.75, fontWeight: 500 }}>
                            ({promo.discountType === 'PERCENT' ? `${promo.discountValue}%` : `Rp ${promo.discountValue >= 1000 ? `${promo.discountValue/1000}k` : promo.discountValue}`})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
            <span>Subtotal Produk:</span>
            <span>Rp {subtotal?.toLocaleString('id-ID')}</span>
          </div>

          {itemDiscountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', color: '#f43f5e' }}>
              <span>Diskon Produk:</span>
              <span>-Rp {itemDiscountTotal?.toLocaleString('id-ID')}</span>
            </div>
          )}

          {calculatedOrderDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', color: '#f43f5e' }}>
              <span>Diskon Nota {orderDiscountType === 'PERCENT' ? `(${orderDiscountValue}%)` : ''}:</span>
              <span>-Rp {calculatedOrderDiscount?.toLocaleString('id-ID')}</span>
            </div>
          )}

          {calculatedVoucherDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', color: '#10b981' }}>
              <span>Voucher ({appliedVoucher?.code}):</span>
              <span>-Rp {calculatedVoucherDiscount?.toLocaleString('id-ID')}</span>
            </div>
          )}

          {totalTax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
              <span>Pajak:</span>
              <span>Rp {totalTax?.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>TOTAL BAYAR:</span>
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
          <div className="modal-content" style={{ padding: '24px', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Proses Pembayaran</h3>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Transparent Bill Breakdown */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '14px',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal Produk:</span>
                <span>Rp {subtotal?.toLocaleString('id-ID')}</span>
              </div>
              {itemDiscountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fb7185', marginBottom: '4px' }}>
                  <span>Diskon Produk:</span>
                  <span>-Rp {itemDiscountTotal?.toLocaleString('id-ID')}</span>
                </div>
              )}
              {calculatedOrderDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fb7185', marginBottom: '4px' }}>
                  <span>Diskon Nota {orderDiscountType === 'PERCENT' ? `(${orderDiscountValue}%)` : ''}:</span>
                  <span>-Rp {calculatedOrderDiscount?.toLocaleString('id-ID')}</span>
                </div>
              )}
              {calculatedVoucherDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', marginBottom: '4px' }}>
                  <span>Voucher Promo ({appliedVoucher?.code}):</span>
                  <span>-Rp {calculatedVoucherDiscount?.toLocaleString('id-ID')}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Pajak:</span>
                  <span>Rp {totalTax?.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', marginTop: '4px' }}>
                <span style={{ fontWeight: 700 }}>Total Tagihan Akhir:</span>
                <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#10b981' }}>
                  Rp {grandTotal?.toLocaleString('id-ID')}
                </span>
              </div>
              {selectedCustomer && (
                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Pelanggan: <strong style={{ color: '#fff' }}>{selectedCustomer.name}</strong>
                </div>
              )}
            </div>

            {checkoutError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{checkoutError}</span>
              </div>
            )}

            <form onSubmit={handleProcessPayment}>
              {/* Payment Method Selector Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: paymentMethod === 'CASH' ? '2px solid #10b981' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'CASH' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'CASH' ? '#10b981' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Banknote size={18} />
                  <span>TUNAI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: paymentMethod === 'QRIS' ? '2px solid #6366f1' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'QRIS' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'QRIS' ? '#818cf8' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <QrCode size={18} />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('DEBIT')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: paymentMethod === 'DEBIT' ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'DEBIT' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'DEBIT' ? '#fbbf24' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CreditCard size={18} />
                  <span>DEBIT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('SPLIT')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: paymentMethod === 'SPLIT' ? '2px solid #38bdf8' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'SPLIT' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'SPLIT' ? '#38bdf8' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Pembayaran Campuran (misal: Tunai + QRIS)"
                >
                  <Layers size={18} />
                  <span>SPLIT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TEMPO')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: paymentMethod === 'TEMPO' ? '2px solid #f87171' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'TEMPO' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === 'TEMPO' ? '#f87171' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Kasbon / Pembayaran Tempo Pelanggan Tetap"
                >
                  <Clock size={18} />
                  <span>KASBON</span>
                </button>
              </div>

              {/* METHOD 1: CASH */}
              {paymentMethod === 'CASH' && (
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
              )}

              {/* METHOD 2: QRIS */}
              {paymentMethod === 'QRIS' && (
                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px' }}>
                  <QrCode size={120} color="#818cf8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.9rem' }}>Scan QRIS Dinamis</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mendukung BCA, Mandiri, GoPay, OVO, ShopeePay, DANA</span>
                </div>
              )}

              {/* METHOD 3: DEBIT */}
              {paymentMethod === 'DEBIT' && (
                <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px' }}>
                  <CreditCard size={48} color="#fbbf24" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Silakan gesek/tap kartu pada mesin EDC</p>
                </div>
              )}

              {/* METHOD 4: SPLIT PAYMENT */}
              {paymentMethod === 'SPLIT' && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Alokasikan pembayaran ke beberapa metode:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const totalAllocated = splitRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
                        const remainder = Math.max(0, grandTotal - totalAllocated);
                        setSplitRows(prev => [
                          ...prev,
                          { id: Date.now(), method: 'QRIS', amount: remainder > 0 ? String(remainder) : '', notes: '' }
                        ]);
                      }}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <Plus size={14} />
                      <span>Tambah Baris</span>
                    </button>
                  </div>

                  {/* Split Rows List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {splitRows.map((row, idx) => (
                      <div
                        key={row.id}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--glass-border)'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', width: '20px' }}>
                          #{idx + 1}
                        </span>

                        <select
                          className="form-input"
                          style={{ width: '130px', padding: '8px 10px', fontSize: '0.82rem' }}
                          value={row.method}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitRows(prev => prev.map(r => r.id === row.id ? { ...r, method: val } : r));
                          }}
                        >
                          <option value="CASH">Tunai (Cash)</option>
                          <option value="QRIS">QRIS</option>
                          <option value="TRANSFER">Transfer Bank</option>
                          <option value="DEBIT">Debit EDC</option>
                          <option value="TEMPO">Kasbon/Tempo</option>
                        </select>

                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type="number"
                            min="0"
                            placeholder="Nominal (Rp)"
                            value={row.amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSplitRows(prev => prev.map(r => r.id === row.id ? { ...r, amount: val } : r));
                            }}
                            className="form-input"
                            style={{ padding: '8px 10px', fontSize: '0.88rem', fontWeight: 700 }}
                            required
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Ref / Catatan (opsional)"
                          value={row.notes}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitRows(prev => prev.map(r => r.id === row.id ? { ...r, notes: val } : r));
                          }}
                          className="form-input"
                          style={{ width: '120px', padding: '8px 10px', fontSize: '0.78rem' }}
                        />

                        {splitRows.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setSplitRows(prev => prev.filter(r => r.id !== row.id))}
                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                            title="Hapus baris metode"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Split Summary Box */}
                  {(() => {
                    const totalAlloc = splitRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
                    const diff = grandTotal - totalAlloc;
                    const hasTempoRow = splitRows.some(r => r.method === 'TEMPO');
                    return (
                      <div>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: diff <= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          border: diff <= 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem'
                        }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Total Dialokasikan: </span>
                            <strong>Rp {totalAlloc.toLocaleString('id-ID')}</strong>
                          </div>
                          <div>
                            {diff > 0 ? (
                              <span style={{ color: '#f87171', fontWeight: 800 }}>
                                Kurang Rp {diff.toLocaleString('id-ID')}
                              </span>
                            ) : diff === 0 ? (
                              <span style={{ color: '#34d399', fontWeight: 800 }}>
                                ✓ Pas (Rp {grandTotal.toLocaleString('id-ID')})
                              </span>
                            ) : (
                              <span style={{ color: '#34d399', fontWeight: 800 }}>
                                Kembalian Tunai: Rp {Math.abs(diff).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>

                        {hasTempoRow && (
                          <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 700 }}>
                                Tanggal Jatuh Tempo Kasbon:
                              </span>
                              <input
                                type="date"
                                value={tempoDueDate}
                                onChange={(e) => setTempoDueDate(e.target.value)}
                                className="form-input"
                                style={{ width: '150px', padding: '4px 8px', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                            {!selectedCustomer && (
                              <p style={{ fontSize: '0.75rem', color: '#f87171', margin: 0, fontWeight: 700 }}>
                                ⚠ Anda memilih Kasbon pada split payment. Silakan pilih pelanggan terdaftar di panel keranjang!
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* METHOD 5: KASBON / TEMPO */}
              {paymentMethod === 'TEMPO' && (
                <div style={{ marginBottom: '20px' }}>
                  {/* Customer Status Alert */}
                  {!selectedCustomer ? (
                    <div style={{
                      padding: '14px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
                        <AlertCircle size={18} />
                        <span>Pelanggan Terdaftar Wajib Dipilih</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Metode Kasbon / Tempo khusus diberikan kepada pelanggan member yang terdaftar demi akuntabilitas piutang toko.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem' }}
                          onChange={(e) => {
                            const found = customers.find(c => String(c.id) === e.target.value);
                            if (found) setSelectedCustomer(found);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Pilih dari pelanggan terdaftar...</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.phone || 'No HP -'})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsCustomerModalOpen(true)}
                          className="btn btn-outline"
                          style={{ padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        >
                          <UserPlus size={14} />
                          <span>+ Baru</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>
                          {selectedCustomer.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {selectedCustomer.phone || 'No HP -'}
                        </div>
                      </div>
                      <div>
                        {selectedCustomer.totalReceivables > 0 ? (
                          <span className="badge badge-rose" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
                            Piutang Aktif: Rp {selectedCustomer.totalReceivables.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="badge badge-emerald" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
                            Tidak Ada Kasbon Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Due Date & Down Payment Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label className="form-label">
                        <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        Tanggal Jatuh Tempo
                      </label>
                      <input
                        type="date"
                        required
                        value={tempoDueDate}
                        onChange={(e) => setTempoDueDate(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Uang Muka / DP (Opsional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={grandTotal - 1}
                        placeholder="Rp 0"
                        value={tempoDownPayment}
                        onChange={(e) => setTempoDownPayment(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  {/* If DP > 0, select DP method */}
                  {Number(tempoDownPayment) > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label className="form-label">Metode Pembayaran DP</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {[
                          { id: 'CASH', label: 'Tunai', icon: Banknote },
                          { id: 'QRIS', label: 'QRIS', icon: QrCode },
                          { id: 'TRANSFER', label: 'Transfer', icon: Building2 },
                          { id: 'DEBIT', label: 'Debit', icon: CreditCard },
                        ].map(m => {
                          const Icon = m.icon;
                          const isSel = tempoDpMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setTempoDpMethod(m.id)}
                              style={{
                                padding: '8px 4px',
                                borderRadius: '6px',
                                border: isSel ? '2px solid #10b981' : '1px solid var(--glass-border)',
                                background: isSel ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                                color: isSel ? '#10b981' : 'var(--text-muted)',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <Icon size={14} />
                              <span>{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tempo Notes */}
                  <div style={{ marginBottom: '12px' }}>
                    <label className="form-label">Keterangan / Perjanjian Kasbon</label>
                    <input
                      type="text"
                      placeholder="Contoh: Janji bayar saat gajian tgl 25 / Belanja operasional kantor"
                      value={tempoNotes}
                      onChange={(e) => setTempoNotes(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>

                  {/* Live Calculation Box */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(248, 113, 113, 0.1)',
                    border: '1px solid rgba(248, 113, 113, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Belanja:</span>
                      <strong>Rp {grandTotal?.toLocaleString('id-ID')}</strong>
                    </div>
                    {Number(tempoDownPayment) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                        <span>Uang Muka (DP) via {tempoDpMethod}:</span>
                        <strong>-Rp {Number(tempoDownPayment).toLocaleString('id-ID')}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 900, color: '#f87171', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '2px' }}>
                      <span>Sisa Piutang Dicatat (Tempo):</span>
                      <span>Rp {(grandTotal - (Number(tempoDownPayment) || 0)).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="btn btn-outline">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    checkoutLoading ||
                    (paymentMethod === 'CASH' && Number(cashAmount) < grandTotal) ||
                    (paymentMethod === 'SPLIT' && splitRows.reduce((a, r) => a + (Number(r.amount) || 0), 0) < grandTotal) ||
                    (paymentMethod === 'TEMPO' && !selectedCustomer)
                  }
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

      {/* VARIANT SELECT MODAL */}
      {variantModalProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Pilih Varian Produk</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{variantModalProduct.name}</span>
              </div>
              <button onClick={() => setVariantModalProduct(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {variantModalProduct.variants?.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    addToCart(variantModalProduct, v);
                    playBeep();
                    setVariantModalProduct(null);
                  }}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{v.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>SKU: {v.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.75rem' }}>
                      Stok: {v.stockQuantity ?? 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={() => setVariantModalProduct(null)} className="btn btn-outline" style={{ width: '100%' }}>
              Batal / Tutup (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
