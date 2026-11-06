import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import SOAPReview from './SOAPReview';
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

describe('SOAPReview', () => {
  it('renders "No SOAP note data available." when no state is provided', () => {
    (useLocation as any).mockReturnValue({ state: null });
    render(
      <MemoryRouter>
        <SOAPReview />
      </MemoryRouter>
    );
    expect(screen.getByText('No SOAP note data available.')).toBeInTheDocument();
  });

  it('renders SOAP note data and handles approval', async () => {
    const mockNavigate = vi.fn();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useLocation as any).mockReturnValue({
      state: {
        soapNote: {
          subjective: 'Patient feels good.',
          objective: 'Vitals stable.',
          assessment: 'Healthy.',
          plan: ['Rest', 'Drink water'],
        },
        codes: [{ code: 'Z00.00' }],
      },
    });

    render(
      <MemoryRouter>
        <SOAPReview />
      </MemoryRouter>
    );

    // Check content
    expect(screen.getByText('Patient feels good.')).toBeInTheDocument();
    expect(screen.getByText('Vitals stable.')).toBeInTheDocument();
    expect(screen.getByText('Healthy.')).toBeInTheDocument();
    expect(screen.getByText('Rest')).toBeInTheDocument();
    expect(screen.getByText('Drink water')).toBeInTheDocument();

    // Check complete button is disabled initially
    const completeButtons = screen.getAllByRole('button', { name: /APPROVE_ALL_SECTIONS|COMPLETE_REVIEW_AND_CLOSE/i });
    expect(completeButtons[0]).toBeDisabled();

    const user = userEvent.setup();

    // Approve all sections
    const approveButtons = screen.getAllByText('APPROVE');
    for (const btn of approveButtons) {
      await user.click(btn.closest('button')!);
    }

    // Now complete button should be enabled
    expect(completeButtons[0]).not.toBeDisabled();

    // Click complete
    await user.click(completeButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/visit/coding', { state: { codes: [{ code: 'Z00.00' }] } });
  });
});
