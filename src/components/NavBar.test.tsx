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
  it('renders all five module links with correct labels', () => {
    renderNavBar();

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sales\/pos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /smart inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /customers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /finance/i })).toBeInTheDocument();
  });

  it('exports NAV_ITEMS with five entries covering all required paths', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(NAV_ITEMS).toHaveLength(5);
    expect(paths).toContain('/');
    expect(paths).toContain('/pos');
    expect(paths).toContain('/inventory');
    expect(paths).toContain('/customers');
    expect(paths).toContain('/finance');
  });

  it('displays the UMKM Pulse application name at the top', () => {
    renderNavBar();
    expect(screen.getByText('UMKM Pulse')).toBeInTheDocument();
  });

  it('applies active styling class to the Dashboard link when path is "/"', () => {
    renderNavBar('/');
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toContain('bg-deep-teal');
    expect(dashboardLink.className).toContain('text-white');
  });

  it('applies active styling to the Sales/POS link when path is "/pos"', () => {
    renderNavBar('/pos');
    const posLink = screen.getByRole('link', { name: /sales\/pos/i });
    expect(posLink.className).toContain('bg-deep-teal');
    expect(posLink.className).toContain('text-white');
  });

  it('applies active styling to the Smart Inventory link when path is "/inventory"', () => {
    renderNavBar('/inventory');
    const inventoryLink = screen.getByRole('link', { name: /smart inventory/i });
    expect(inventoryLink.className).toContain('bg-deep-teal');
    expect(inventoryLink.className).toContain('text-white');
  });

  it('does not apply active styling to inactive links', () => {
    renderNavBar('/');
    const posLink = screen.getByRole('link', { name: /sales\/pos/i });
    expect(posLink.className).not.toContain('bg-deep-teal');
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
    // There should be 5 nav links
    expect(links).toHaveLength(5);

    // Start with body focused; tabbing should move into the links
    links[0].focus();
    expect(document.activeElement).toBe(links[0]);

    for (let i = 1; i < links.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(links[i]);
    }
  });
});
