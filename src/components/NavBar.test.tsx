import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NavBar, { NAV_ITEMS } from './NavBar';

function renderNavBar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavBar />
    </MemoryRouter>,
  );
}

describe('NavBar', () => {
  it('renders all six module links with correct labels', () => {
    renderNavBar();

    expect(screen.getByRole('link', { name: /pemantauan/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /rekap/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /stok/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pelanggan/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /keuangan/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ai insights/i })).toBeInTheDocument();
  });

  it('exports NAV_ITEMS with six entries covering all required paths', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(NAV_ITEMS).toHaveLength(6);
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/rekap');
    expect(paths).toContain('/inventory');
    expect(paths).toContain('/customers');
    expect(paths).toContain('/finance');
    expect(paths).toContain('/ai-insights');
  });

  it('displays the Zura Retail application name at the top', () => {
    renderNavBar();
    expect(screen.getByText('Zura Retail')).toBeInTheDocument();
  });

  it('applies active styling class to the Dashboard link when path is "/dashboard"', () => {
    renderNavBar('/dashboard');
    const dashboardLink = screen.getByRole('link', { name: /pemantauan/i });
    expect(dashboardLink.className).toContain('bg-[#3B82F6]');
    expect(dashboardLink.className).toContain('text-white');
  });

  it('applies active styling to the Point of Sale link when path is "/rekap"', () => {
    renderNavBar('/rekap');
    const posLink = screen.getByRole('link', { name: /rekap/i });
    expect(posLink.className).toContain('bg-[#3B82F6]');
    expect(posLink.className).toContain('text-white');
  });

  it('applies active styling to the Inventory link when path is "/inventory"', () => {
    renderNavBar('/inventory');
    const inventoryLink = screen.getByRole('link', { name: /stok/i });
    expect(inventoryLink.className).toContain('bg-[#3B82F6]');
    expect(inventoryLink.className).toContain('text-white');
  });

  it('does not apply active styling to inactive links', () => {
    renderNavBar('/dashboard');
    const posLink = screen.getByRole('link', { name: /rekap/i });
    expect(posLink.className).not.toContain('bg-[#3B82F6]');
  });

  it('has a nav element with role="navigation" and accessible label', () => {
    renderNavBar();
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('Tab key moves focus through all nav links', async () => {
    const user = userEvent.setup();
    renderNavBar();

    const links = screen.getAllByRole('link');
    // There should be 6 nav links
    expect(links).toHaveLength(6);

    // Start with body focused; tabbing should move into the links
    links[0].focus();
    expect(document.activeElement).toBe(links[0]);

    for (let i = 1; i < links.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(links[i]);
    }
  });
});
