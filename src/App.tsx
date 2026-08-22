import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import MenuPage from "./pages/MenuPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AiInsightsPage from "./pages/AiInsightsPage";
import SalesRecapPage from "./pages/SalesRecapPage";
import InventoryPage from "./pages/InventoryPage";
import FinancePage from "./pages/FinancePage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rute Privat (Diakses setelah login Firebase) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ai-insights" element={<AiInsightsPage />} />
            <Route path="/rekap" element={<SalesRecapPage />} />
            <Route path="/pos" element={<Navigate to="/rekap" replace />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/profile" element={<ProfilePage />} />{" "}
            {/* 2. Tambahkan Rute Profil */}
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
