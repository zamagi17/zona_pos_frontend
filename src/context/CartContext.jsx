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
        const lineSubtotal = (item.unitPrice * newQty) - (item.discount || 0);
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotal: lineSubtotal,
        };
        return updated;
      } else {
        const unitPrice = product.sellingPrice || 0;
        const basePrice = product.purchasePrice || 0;
        const discount = product.discountAmount || 0;
        const tax = product.taxAmount || 0;
        const lineSubtotal = unitPrice - discount;

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
        const lineSubtotal = (item.unitPrice * qty) - (item.discount || 0);
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
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const totalDiscount = cartItems.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);
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
  };

  // Checkout
  const checkout = async ({ paymentMethod, amountPaid, reference }) => {
    const outletId = selectedOutletId || user?.outletId;
    const res = await api.checkout({
      outletId,
      shiftId: activeShift?.id,
      customerId: selectedCustomer?.id,
      existingTrxId: currentDraftTrxId,
      items: cartItems,
      paymentMethod,
      amountPaid: Number(amountPaid),
      reference,
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
      totalDiscount,
      totalTax,
      grandTotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      setSelectedCustomer,
      holdOrder,
      recallOrder,
      checkout,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
