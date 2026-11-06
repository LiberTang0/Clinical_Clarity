import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import VisitFinalization from './VisitFinalization';
import { useAuth } from '../context/AuthContext';
import { addDoc } from 'firebase/firestore';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn().mockReturnValue({}),
  };
});

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

describe('VisitFinalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', displayName: 'Dr. Test' } });

    render(
      <MemoryRouter>
        <VisitFinalization />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Sarah J. Miller')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Dr. Test')[0]).toBeInTheDocument();
    expect(screen.getAllByText('$509.50')[0]).toBeInTheDocument();
  });

  it('alerts if user is not logged in', async () => {
    (useAuth as any).mockReturnValue({ user: null });
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <VisitFinalization />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /COMPLETE ENCOUNTER/i }));

    expect(alertMock).toHaveBeenCalledWith('You must be logged in to save the encounter.');
    alertMock.mockRestore();
  });

  it('saves encounter and navigates on success', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', displayName: 'Dr. Test' } });
    const navigateMock = vi.fn();
    (useNavigate as any).mockReturnValue(navigateMock);
    (addDoc as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <VisitFinalization />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /COMPLETE ENCOUNTER/i }));

    expect(addDoc).toHaveBeenCalled();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  it('handles save error', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', displayName: 'Dr. Test' } });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (addDoc as any).mockRejectedValue(new Error('Save failed'));

    render(
      <MemoryRouter>
        <VisitFinalization />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /COMPLETE ENCOUNTER/i }));

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
