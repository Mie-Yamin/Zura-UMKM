import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import LandingPage from "./pages/LandingPage";
import MenuPage from "./pages/MenuPage";
import DashboardPage from "./pages/DashboardPage";
import AiInsightsPage from "./pages/AiInsightsPage";
import SalesRecapPage from "./pages/SalesRecapPage";
import InventoryPage from "./pages/InventoryPage";
import FinancePage from "./pages/FinancePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Tambahkan Route /menu di luar AppShell agar tampil full-screen */}
        <Route path="/menu" element={<MenuPage />} />

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ai-insights" element={<AiInsightsPage />} />
          <Route path="/rekap" element={<SalesRecapPage />} />
          <Route path="/pos" element={<Navigate to="/rekap" replace />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
