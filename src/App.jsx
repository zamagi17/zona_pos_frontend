import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import { CartProvider } from './context/CartContext';
import { AuthPage } from './pages/AuthPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PosKasir } from './pages/PosKasir';
import { DashboardReports } from './pages/DashboardReports';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { CustomersPage } from './pages/CustomersPage';
import { OutletsUsersPage } from './pages/OutletsUsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { OpenShiftModal } from './components/OpenShiftModal';
import { CloseShiftModal } from './components/CloseShiftModal';
import { CashMovementModal } from './components/CashMovementModal';
import { ShiftReceiptModal } from './components/ShiftReceiptModal';

function MainLayout() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('pos');
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [shiftForReceipt, setShiftForReceipt] = useState(null);
  const [isShiftReceiptOpen, setIsShiftReceiptOpen] = useState(false);

  const handleOpenShiftReceipt = (shiftData) => {
    setShiftForReceipt(shiftData);
    setIsShiftReceiptOpen(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700 }}>
        Memuat Zona POS...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenShift={() => setIsOpenShiftModalOpen(true)}
        onCloseShift={() => setIsCloseShiftModalOpen(true)}
        onOpenCashMovement={() => setIsCashMovementModalOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, padding: '12px 16px 16px', gap: '16px', overflow: 'hidden' }}>
        <Sidebar currentTab={currentTab} setTab={setCurrentTab} />

        <main style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {currentTab === 'pos' && (
            <PosKasir
              onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
              onOpenCashMovementModal={() => setIsCashMovementModalOpen(true)}
            />
          )}
          {currentTab === 'transactions' && <TransactionsPage />}
          {currentTab === 'dashboard' && <DashboardReports />}
          {currentTab === 'products' && <ProductsPage />}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'promotions' && <PromotionsPage />}
          {currentTab === 'shifts' && (
            <ShiftsPage
              onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
              onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
              onOpenCashMovementModal={() => setIsCashMovementModalOpen(true)}
              onPrintShiftReceipt={handleOpenShiftReceipt}
            />
          )}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'outlets-users' && <OutletsUsersPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        onShiftClosed={(closedShiftData) => handleOpenShiftReceipt(closedShiftData)}
        onPrintXReport={(activeShiftData) => handleOpenShiftReceipt(activeShiftData)}
      />

      <CashMovementModal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
      />

      <ShiftReceiptModal
        isOpen={isShiftReceiptOpen}
        shift={shiftForReceipt}
        onClose={() => {
          setIsShiftReceiptOpen(false);
          setShiftForReceipt(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ShiftProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </ShiftProvider>
    </AuthProvider>
  );
}
