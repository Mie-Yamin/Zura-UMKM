// src/components/AppShell.tsx
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Chatbot from './Chatbot'; // 1. Import Chatbot

export default function AppShell() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden">
      {/* Navigation Sidebar */}
      <NavBar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
        <Outlet />
      </main>

      {/* 2. Floating Chatbot Widget */}
      <Chatbot />
    </div>
  );
}