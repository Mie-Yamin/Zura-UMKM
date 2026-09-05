import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

// Code-splitting per rute: halaman berat hanya dimuat saat dikunjungi.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AiInsightsPage = lazy(() => import("./pages/AiInsightsPage"));
const SalesRecapPage = lazy(() => import("./pages/SalesRecapPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#E8D3A7] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#B48328] border-t-transparent animate-spin" role="status" aria-label="Memuat halaman..." />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
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
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}