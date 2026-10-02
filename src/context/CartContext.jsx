import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useShift } from './ShiftContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, selectedOutletId } = useAuth();
  const { activeShift } = useShift();

  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentDraftTrxId, setCurrentDraftTrxId] = useState(null);

  // Klaster 3: Diskon Nota Global & Kode Voucher Promo
  const [orderDiscountType, setOrderDiscountType] = useState('FIXED'); // 'FIXED' (Rp) | 'PERCENT' (%)
  const [orderDiscountValue, setOrderDiscountValue] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { code, name, discountType, discountValue, discountAmount, minOrderAmount, maxDiscountAmount }

  const addToCart = (product, variant = null) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item =>
        item.productId === product.id &&
        ((!item.variantId && !variant) || (item.variantId === variant?.id))
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        const lineSubtotal = (item.unitPrice - (item.discount || 0)) * newQty;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotal: lineSubtotal,
        };
        return updated;
      } else {
        const unitPrice = product.sellingPrice || 0;
        const basePrice = product.purchasePrice || 0;
        const discount = product.discountAmount || (product.discountPercentage ? (unitPrice * product.discountPercentage / 100) : 0);
        const tax = product.taxAmount || (product.taxPercentage ? ((unitPrice - discount) * product.taxPercentage / 100) : 0);
        const lineSubtotal = (unitPrice - discount) * 1;

        return [
          ...prev,
          {
            productId: product.id,
            variantId: variant ? variant.id : null,
            productName: product.name,
            variantName: variant ? variant.name : null,
            quantity: 1,
            basePrice,
            unitPrice,
            discount,
            tax,
            subtotal: lineSubtotal,
          }
        ];
      }
    });
  };

  const updateQuantity = (productId, variantId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.productId === productId && item.variantId === variantId) {
        const lineSubtotal = (item.unitPrice - (item.discount || 0)) * qty;
        return {
          ...item,
          quantity: qty,
          subtotal: lineSubtotal,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId, variantId) => {
    setCartItems(prev => prev.filter(item =>
      !(item.productId === productId && item.variantId === variantId)
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setCurrentDraftTrxId(null);
    setOrderDiscountType('FIXED');
    setOrderDiscountValue(0);
    setAppliedVoucher(null);
  };

  const applyOrderDiscount = (type, value) => {
    setOrderDiscountType(type === 'PERCENT' ? 'PERCENT' : 'FIXED');
    setOrderDiscountValue(Math.max(0, Number(value) || 0));
  };

  const removeOrderDiscount = () => {
    setOrderDiscountType('FIXED');
    setOrderDiscountValue(0);
  };

  const applyVoucher = (voucherObj) => {
    setAppliedVoucher(voucherObj);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  // Financial Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const itemDiscountTotal = cartItems.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);
  const netItemsSubtotal = Math.max(0, subtotal - itemDiscountTotal);

  // 1. Order Discount Calculation
  let calculatedOrderDiscount = 0;
  if (orderDiscountValue > 0) {
    if (orderDiscountType === 'PERCENT') {
      calculatedOrderDiscount = Math.round((netItemsSubtotal * orderDiscountValue) / 100);
    } else {
      calculatedOrderDiscount = Math.min(netItemsSubtotal, orderDiscountValue);
    }
  }

  // 2. Voucher Discount Calculation
  let calculatedVoucherDiscount = 0;
  if (appliedVoucher) {
    const remainingForVoucher = Math.max(0, netItemsSubtotal - calculatedOrderDiscount);
    if (appliedVoucher.discountType === 'PERCENT') {
      let val = Math.round((remainingForVoucher * (appliedVoucher.discountValue || 0)) / 100);
      if (appliedVoucher.maxDiscountAmount && appliedVoucher.maxDiscountAmount > 0 && val > appliedVoucher.maxDiscountAmount) {
        val = appliedVoucher.maxDiscountAmount;
      }
      calculatedVoucherDiscount = val;
    } else {
      const fixedAmt = appliedVoucher.discountValue || appliedVoucher.discountAmount || 0;
      calculatedVoucherDiscount = Math.min(remainingForVoucher, fixedAmt);
    }
  }

  const totalDiscount = itemDiscountTotal + calculatedOrderDiscount + calculatedVoucherDiscount;
  const totalTax = cartItems.reduce((acc, item) => acc + ((item.tax || 0) * item.quantity), 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  // Hold / Simpan Draft
  const holdOrder = async () => {
    if (cartItems.length === 0) return;
    const outletId = selectedOutletId || user?.outletId;
    const res = await api.holdOrder({
      outletId,
      shiftId: activeShift?.id,
      customerId: selectedCustomer?.id,
      existingTrxId: currentDraftTrxId,
      items: cartItems,
      orderDiscount: calculatedOrderDiscount,
      orderDiscountType: orderDiscountValue > 0 ? orderDiscountType : null,
      orderDiscountRate: orderDiscountValue,
      voucherCode: appliedVoucher?.code || null,
      voucherDiscount: calculatedVoucherDiscount,
    });
    clearCart();
    return res;
  };

  // Recall / Ambil Draft kembali
  const recallOrder = (transaction) => {
    setCurrentDraftTrxId(transaction.id);
    if (transaction.customerId) {
      setSelectedCustomer({ id: transaction.customerId, name: transaction.customerName });
    } else {
      setSelectedCustomer(null);
    }
    setCartItems(transaction.items || []);

    if (transaction.orderDiscount && transaction.orderDiscount > 0) {
      setOrderDiscountType(transaction.orderDiscountType || 'FIXED');
      setOrderDiscountValue(transaction.orderDiscountRate || transaction.orderDiscount);
    } else {
      setOrderDiscountType('FIXED');
      setOrderDiscountValue(0);
    }

    if (transaction.voucherCode) {
      setAppliedVoucher({
        code: transaction.voucherCode,
        name: `Voucher ${transaction.voucherCode}`,
        discountAmount: transaction.voucherDiscount || 0,
        discountType: 'FIXED',
        discountValue: transaction.voucherDiscount || 0,
      });
    } else {
      setAppliedVoucher(null);
    }
  };

  // Checkout
  const checkout = async (checkoutData) => {
    const outletId = selectedOutletId || user?.outletId;
    const res = await api.checkout({
      outletId,
      shiftId: activeShift?.id,
      customerId: selectedCustomer?.id,
      existingTrxId: currentDraftTrxId,
      items: cartItems,
      orderDiscount: calculatedOrderDiscount,
      orderDiscountType: orderDiscountValue > 0 ? orderDiscountType : null,
      orderDiscountRate: orderDiscountValue,
      voucherCode: appliedVoucher?.code || null,
      voucherDiscount: calculatedVoucherDiscount,
      ...checkoutData,
    });
    clearCart();
    return res;
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      selectedCustomer,
      currentDraftTrxId,
      subtotal,
      itemDiscountTotal,
      orderDiscountType,
      orderDiscountValue,
      calculatedOrderDiscount,
      appliedVoucher,
      calculatedVoucherDiscount,
      totalDiscount,
      totalTax,
      grandTotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      setSelectedCustomer,
      applyOrderDiscount,
      removeOrderDiscount,
      applyVoucher,
      removeVoucher,
      holdOrder,
      recallOrder,
      checkout,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
