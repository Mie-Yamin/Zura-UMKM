import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import FinancePage from './pages/FinancePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
