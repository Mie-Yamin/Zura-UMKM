import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryCard from './SummaryCard';

describe('SummaryCard', () => {
  // ── 1. Renders title and value text correctly ───────────────────────────────
  it('renders the title text', () => {
    render(<SummaryCard title="Today's Revenue" value="Rp 1.200.000" />);
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
  });

  it('renders the value text', () => {
    render(<SummaryCard title="Transactions" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders both title and value together', () => {
    render(<SummaryCard title="Best Seller" value="Nasi Goreng" />);
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
    expect(screen.getByText('Nasi Goreng')).toBeInTheDocument();
  });

  // ── 2. Neon Green sparkline renders when trend="up" ─────────────────────────
  it('renders the trend graphic when trend="up"', () => {
    render(
      <SummaryCard
        title="Revenue"
        value="Rp 1.000.000"
        trend="up"
        trendAriaLabel="Revenue trending upward"
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Revenue trending upward' }),
    ).toBeInTheDocument();
  });

  // ── 3. Sparkline is absent when trend is not "up" ───────────────────────────
  it('does not render the trend graphic when trend="down"', () => {
    render(
      <SummaryCard
        title="Revenue"
        value="Rp 500.000"
        trend="down"
        trendAriaLabel="Revenue trending upward"
      />,
    );
    expect(
      screen.queryByRole('img', { name: 'Revenue trending upward' }),
    ).not.toBeInTheDocument();
  });

  it('does not render the trend graphic when trend is not provided', () => {
    render(<SummaryCard title="Transactions" value={10} />);
    // No svg with role="img" should be present
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render the trend graphic when trend="neutral"', () => {
    render(
      <SummaryCard
        title="Revenue"
        value="Rp 800.000"
        trend="neutral"
        trendAriaLabel="Revenue trending upward"
      />,
    );
    expect(
      screen.queryByRole('img', { name: 'Revenue trending upward' }),
    ).not.toBeInTheDocument();
  });

  // ── 4. Soft Red badge renders with correct count when alertCount > 0 ────────
  it('renders the alert badge with the correct count when alertCount > 0', () => {
    render(<SummaryCard title="Stock Alerts" value={3} alertCount={3} />);
    const badge = screen.getByRole('status', { name: '3 stock alerts' });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('renders the alert badge when alertCount is 1', () => {
    render(<SummaryCard title="Stock Alerts" value={1} alertCount={1} />);
    expect(screen.getByRole('status', { name: '1 stock alerts' })).toBeInTheDocument();
  });

  it('does not render the alert badge when alertCount is 0', () => {
    render(<SummaryCard title="Stock Alerts" value={0} alertCount={0} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not render the alert badge when alertCount is not provided', () => {
    render(<SummaryCard title="Transactions" value={5} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // ── 5. aria-label is present on the trend graphic (matches trendAriaLabel) ──
  it('uses the trendAriaLabel prop as the aria-label on the trend graphic', () => {
    const customLabel = 'Sales growing by 12.5%';
    render(
      <SummaryCard
        title="Revenue"
        value="Rp 2.000.000"
        trend="up"
        trendAriaLabel={customLabel}
      />,
    );
    expect(screen.getByRole('img', { name: customLabel })).toBeInTheDocument();
  });

  it('falls back to "Revenue trending upward" when trendAriaLabel is not provided', () => {
    render(<SummaryCard title="Revenue" value="Rp 1.000.000" trend="up" />);
    expect(
      screen.getByRole('img', { name: 'Revenue trending upward' }),
    ).toBeInTheDocument();
  });

  // ── 6. aria-label is present on alert badge in format "[count] stock alerts" ─
  it('has correct aria-label format on the alert badge', () => {
    render(<SummaryCard title="Stock Alerts" value={7} alertCount={7} />);
    const badge = screen.getByRole('status', { name: '7 stock alerts' });
    expect(badge).toHaveAttribute('aria-label', '7 stock alerts');
  });

  // ── 7. Loading shimmer renders when value is undefined ──────────────────────
  it('renders loading shimmer when value is undefined', () => {
    render(<SummaryCard title="Revenue" />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('does not render loading shimmer when value is provided', () => {
    render(<SummaryCard title="Revenue" value="Rp 1.000.000" />);
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });

  it('shows shimmer with animate-pulse class when value is undefined', () => {
    render(<SummaryCard title="Revenue" />);
    const shimmer = screen.getByRole('status', { name: 'Loading' });
    expect(shimmer.className).toContain('animate-pulse');
  });

  it('does not show the value when value is undefined (loading state)', () => {
    render(<SummaryCard title="Revenue" />);
    // The title renders, but no heading-like value text
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    // No numeric or string value should be visible
    expect(screen.queryByText('Rp 0')).not.toBeInTheDocument();
  });
});
