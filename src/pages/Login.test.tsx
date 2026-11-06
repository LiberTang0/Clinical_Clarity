import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';
import { useAuth } from '../context/AuthContext';
import userEvent from '@testing-library/user-event';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Login', () => {
  it('renders physician login elements correctly', () => {
    (useAuth as any).mockReturnValue({
      signIn: vi.fn(),
      signInDemo: vi.fn(),
    });

    render(<Login />);

    expect(screen.getByAltText('Hippocrate Logo')).toBeInTheDocument();
    expect(screen.getByText('Clinical Clarity')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Physician Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In as Dr. Smith/i })).toBeInTheDocument();
    expect(screen.getByText(/HIPAA Compliant/i)).toBeInTheDocument();
  });

  it('triggers Google sign-in when Google button is clicked', async () => {
    const signInMock = vi.fn().mockResolvedValue(undefined);
    (useAuth as any).mockReturnValue({
      signIn: signInMock,
      signInDemo: vi.fn(),
    });

    render(<Login />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Sign in with Google/i }));

    expect(signInMock).toHaveBeenCalled();
  });

  it('triggers demo clinician sign-in when Dr. Smith button is clicked', async () => {
    const signInDemoMock = vi.fn();
    (useAuth as any).mockReturnValue({
      signIn: vi.fn(),
      signInDemo: signInDemoMock,
    });

    render(<Login />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Sign In as Dr. Smith/i }));

    expect(signInDemoMock).toHaveBeenCalledWith('Dr. Smith');
  });
});
