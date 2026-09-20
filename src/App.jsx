import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import { CartProvider } from './context/CartContext';
import { AuthPage } from './pages/AuthPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PosKasir } from './pages/PosKasir';
import { DashboardReports } from './pages/DashboardReports';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { CustomersPage } from './pages/CustomersPage';
import { OutletsUsersPage } from './pages/OutletsUsersPage';
import { OpenShiftModal } from './components/OpenShiftModal';
import { CloseShiftModal } from './components/CloseShiftModal';

function MainLayout() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('pos');
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

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
      />

      <div style={{ display: 'flex', flex: 1, padding: '12px 16px 16px', gap: '16px', overflow: 'hidden' }}>
        <Sidebar currentTab={currentTab} setTab={setCurrentTab} />

        <main style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {currentTab === 'pos' && <PosKasir onOpenShiftModal={() => setIsOpenShiftModalOpen(true)} />}
          {currentTab === 'dashboard' && <DashboardReports />}
          {currentTab === 'products' && <ProductsPage />}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'shifts' && (
            <ShiftsPage
              onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
              onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
            />
          )}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'outlets-users' && <OutletsUsersPage />}
        </main>
      </div>

      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
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
