import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import CodingSignOff from './CodingSignOff';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

describe('CodingSignOff', () => {
  it('renders "No codes suggested." when no state is provided', () => {
    (useLocation as any).mockReturnValue({ state: null });
    render(
      <MemoryRouter>
        <CodingSignOff />
      </MemoryRouter>
    );
    expect(screen.getByText('No codes suggested.')).toBeInTheDocument();
  });

  it('renders codes and handles selection', async () => {
    const mockNavigate = vi.fn();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useLocation as any).mockReturnValue({
      state: {
        codes: [
          { code: 'Z00.00', description: 'General medical examination', confidence: 'HIGH' },
          { code: 'J00', description: 'Acute nasopharyngitis', confidence: 'MEDIUM' },
        ],
      },
    });

    render(
      <MemoryRouter>
        <CodingSignOff />
      </MemoryRouter>
    );

    // Check content
    expect(screen.getByText('Z00.00')).toBeInTheDocument();
    expect(screen.getByText('General medical examination')).toBeInTheDocument();
    expect(screen.getByText('J00')).toBeInTheDocument();
    expect(screen.getByText('Acute nasopharyngitis')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).not.toBeChecked();

    const user = userEvent.setup();
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    // Click proceed
    const proceedButton = screen.getByRole('button', { name: /SIGN & PROCEED TO ORDERS/i });
    await user.click(proceedButton);
    expect(mockNavigate).toHaveBeenCalledWith('/visit/orders');
  });
});
