import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';
import userEvent from '@testing-library/user-event';

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Layout', () => {
  it('renders correctly for unauthorized user', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText(/UNAUTHORIZED/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders correctly for authorized user', () => {
    (useAuth as any).mockReturnValue({
      user: { uid: '123' },
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText(/AUTHORIZED/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
  });

  it('calls signIn when login button is clicked', async () => {
    const signInMock = vi.fn();
    (useAuth as any).mockReturnValue({
      user: null,
      signIn: signInMock,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /login/i }));
    expect(signInMock).toHaveBeenCalled();
  });

  it('calls signOut when logout button is clicked', async () => {
    const signOutMock = vi.fn();
    (useAuth as any).mockReturnValue({
      user: { uid: '123' },
      signIn: vi.fn(),
      signOut: signOutMock,
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    // Find button by its icon text
    const logoutButton = screen.getByText('account_circle').closest('button');
    await user.click(logoutButton!);
    expect(signOutMock).toHaveBeenCalled();
  });
});
