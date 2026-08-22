// src/components/AppShell.tsx
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Chatbot from './Chatbot'; // 1. Import Chatbot

export default function AppShell() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Navigation Sidebar */}
      <NavBar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 relative">
        <Outlet />
      </main>

      {/* 2. Floating Chatbot Widget */}
      <Chatbot />
    </div>
  );
}