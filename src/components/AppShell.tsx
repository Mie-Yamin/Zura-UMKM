import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import ErrorBoundary from './ErrorBoundary';

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <NavBar />
      <main className="flex-1 overflow-auto bg-surface">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
