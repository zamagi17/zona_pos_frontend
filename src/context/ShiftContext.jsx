import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const { user, selectedOutletId } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [loadingShift, setLoadingShift] = useState(false);

  const refreshShift = async () => {
    if (!user) return;
    try {
      setLoadingShift(true);
      const shift = await api.getActiveShift();
      setActiveShift(shift || null);
    } catch {
      setActiveShift(null);
    } finally {
      setLoadingShift(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshShift();
    } else {
      setActiveShift(null);
    }
  }, [user, selectedOutletId]);

  const openShift = async (startCash) => {
    const res = await api.openShift({
      outletId: selectedOutletId || user?.outletId,
      startCash: Number(startCash)
    });
    setActiveShift(res);
    return res;
  };

  const closeShift = async (actualCash) => {
    if (!activeShift) return;
    const res = await api.closeShift(activeShift.id, {
      actualCash: Number(actualCash)
    });
    setActiveShift(null);
    return res;
  };

  return (
    <ShiftContext.Provider value={{ activeShift, loadingShift, openShift, closeShift, refreshShift }}>
      {children}
    </ShiftContext.Provider>
  );
}

export const useShift = () => useContext(ShiftContext);
