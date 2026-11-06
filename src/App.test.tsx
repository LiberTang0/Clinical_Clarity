import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { useAuth } from './context/AuthContext';

// Mock AuthContext
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>,
  useAuth: vi.fn(),
}));

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((_q, _opts, callback) => {
    if (typeof callback === 'function') {
      callback({ docs: [] });
    }
    return () => {};
  }),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe('App', () => {
  it('renders the login screen as the first screen when doctor is not logged in', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signInDemo: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);
    
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByAltText('Hippocrate Logo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Physician Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In as Dr. Smith/i })).toBeInTheDocument();
    expect(screen.queryByText("Today's Schedule")).not.toBeInTheDocument();
  });

  it('renders the actual home: Today\'s Schedule when doctor is logged in', () => {
    (useAuth as any).mockReturnValue({
      user: { uid: 'doc-123', displayName: 'Dr. Smith' },
      signIn: vi.fn(),
      signInDemo: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByAltText('Hippocrate Logo')).toBeInTheDocument();
    expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /LOGOUT/i })).toBeInTheDocument();
  });
});
