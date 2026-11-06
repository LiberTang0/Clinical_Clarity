import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { auth } from '../firebase';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import userEvent from '@testing-library/user-event';

// Mock firebase
vi.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
  },
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

const TestComponent = () => {
  const { user, signIn, signOut } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.uid : 'null'}</div>
      <button onClick={signIn}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides user state and handles sign in/out', async () => {
    let authCallback: any;
    (auth.onAuthStateChanged as any).mockImplementation((cb: any) => {
      authCallback = cb;
      cb(null); // Initial state
      return vi.fn(); // Unsubscribe
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');

    // Simulate sign in
    const user = userEvent.setup();
    await user.click(screen.getByText('Sign In'));
    expect(signInWithPopup).toHaveBeenCalled();

    // Trigger auth state change
    act(() => {
      authCallback({ uid: '123' });
    });
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('123');
    });

    // Simulate sign out
    await user.click(screen.getByText('Sign Out'));
    expect(firebaseSignOut).toHaveBeenCalled();
  });

  it('handles signInDemo correctly', async () => {
    (auth.onAuthStateChanged as any).mockImplementation((cb: any) => {
      cb(null);
      return vi.fn();
    });

    const DemoComponent = () => {
      const { user, signInDemo } = useAuth();
      return (
        <div>
          <div data-testid="user-name">{user ? user.displayName : 'none'}</div>
          <button onClick={() => signInDemo('Dr. Smith')}>Demo Sign In</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <DemoComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-name')).toHaveTextContent('none');

    const user = userEvent.setup();
    await user.click(screen.getByText('Demo Sign In'));

    expect(screen.getByTestId('user-name')).toHaveTextContent('Dr. Smith');
  });

  it('throws error if useAuth is used outside provider', () => {
    // Suppress console.error for expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within AuthProvider');
    consoleSpy.mockRestore();
  });
});
