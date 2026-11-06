import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import OrdersReferrals from './OrdersReferrals';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('OrdersReferrals', () => {
  it('renders correctly and handles navigation', async () => {
    const mockNavigate = vi.fn();
    (useNavigate as any).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <OrdersReferrals />
      </MemoryRouter>
    );

    // Check content
    expect(screen.getByText('DIAGNOSTIC_SUITE')).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    expect(screen.getByText('CBC_W_DIFF')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();

    // Check checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Click finalize
    const finalizeButton = screen.getByRole('button', { name: /Validate & View Superbill/i });
    const user = userEvent.setup();
    await user.click(finalizeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/visit/finalization');
  });
});
