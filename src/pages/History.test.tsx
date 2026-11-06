import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import History from './History';
import { useAuth } from '../context/AuthContext';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((_q, _opts, callback) => {
    // Provide empty initial snapshot
    if (typeof callback === 'function') {
      callback({ docs: [] });
    }
    return () => {};
  }),
}));

describe('History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { uid: 'test-user', displayName: 'Dr. Test' } });
  });

  it('renders encounters title and baseline records', () => {
    render(
      <MemoryRouter>
        <History />
      </MemoryRouter>
    );

    expect(screen.getByText('Patient Records')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Encounters' })).toBeInTheDocument();
    expect(screen.getByText('Robert Wilson')).toBeInTheDocument();
    expect(screen.getByText('Amanda Lee')).toBeInTheDocument();
  });

  it('shows search input and allows typing', () => {
    render(
      <MemoryRouter>
        <History />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search patients, diagnoses, or IDs...');
    expect(searchInput).toBeInTheDocument();
  });
});
