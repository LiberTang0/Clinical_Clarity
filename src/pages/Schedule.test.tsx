import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Schedule from './Schedule';
import { useAuth } from '../context/AuthContext';
import { addDoc } from 'firebase/firestore';
import userEvent from '@testing-library/user-event';

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
    if (typeof callback === 'function') {
      callback({ docs: [] });
    }
    return () => {};
  }),
  addDoc: vi.fn().mockResolvedValue({ id: 'appt-123' }),
  serverTimestamp: vi.fn(),
}));

describe('Schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: null });
  });

  it('renders the schedule page correctly', () => {
    render(
      <MemoryRouter>
        <Schedule />
      </MemoryRouter>
    );

    // Check headers
    expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /good morning/i })).toBeInTheDocument();
    expect(screen.getByText('08:45 AM')).toBeInTheDocument();

    // Check first patient
    expect(screen.getByText('09:15')).toBeInTheDocument();
    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('Check-up: Post-operative review (Knee Replacement)')).toBeInTheDocument();
    
    // Check start visit button for first patient
    const startVisitLinks = screen.getAllByRole('link', { name: /start visit/i });
    expect(startVisitLinks[0]).toHaveAttribute('href', '/visit/active');

    // Check second patient
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Michael Chen')).toBeInTheDocument();
    expect(screen.getByText('Consultation: Persistent hypertension management')).toBeInTheDocument();

    // Check disabled button for second patient
    const disabledButton = screen.getAllByRole('button', { name: /view details/i })[0];
    expect(disabledButton).toBeDisabled();

    // Check Schedule Visit button exists
    expect(screen.getByRole('button', { name: /schedule visit/i })).toBeInTheDocument();
  });

  it('opens the schedule visit modal and adds a new patient visit', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'doctor-123', displayName: 'Dr. Smith' } });

    render(
      <MemoryRouter>
        <Schedule />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    // Click SCHEDULE VISIT button
    await user.click(screen.getByRole('button', { name: /schedule visit/i }));

    // Verify modal opened
    expect(screen.getByRole('heading', { name: 'Schedule New Visit' })).toBeInTheDocument();

    // Fill in patient name
    const nameInput = screen.getByPlaceholderText('e.g. Eleanor Vance');
    await user.type(nameInput, 'Eleanor Vance');

    // Click submit in modal
    const scheduleButtons = screen.getAllByRole('button', { name: /schedule visit/i });
    await user.click(scheduleButtons[1]);

    // Verify addDoc was called to persist appointment to Firestore
    expect(addDoc).toHaveBeenCalled();

    // Verify success toast appears
    await waitFor(() => {
      expect(screen.getByText(/Visit scheduled successfully for Eleanor Vance!/i)).toBeInTheDocument();
    });
  });

  it('allows doctor to select an existing patient from the database', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'doctor-123', displayName: 'Dr. Smith' } });

    render(
      <MemoryRouter>
        <Schedule />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    // Open schedule modal
    await user.click(screen.getByRole('button', { name: /schedule visit/i }));
    expect(screen.getByRole('heading', { name: 'Schedule New Visit' })).toBeInTheDocument();

    // Search or find Michael Chen in the database list
    const searchInput = screen.getByPlaceholderText(/Search database by patient name/i);
    await user.type(searchInput, 'Michael Chen');

    // Click 'Select' for Michael Chen
    const selectButton = screen.getByText('Select');
    await user.click(selectButton);

    // Verify selected patient card is shown with Michael Chen and MRN PT-002
    expect(screen.getByText('PT-002')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();

    // Submit the visit
    const scheduleButtons = screen.getAllByRole('button', { name: /schedule visit/i });
    await user.click(scheduleButtons[1]);

    // Verify appointment was added for Michael Chen
    expect(addDoc).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/Visit scheduled successfully for Michael Chen!/i)).toBeInTheDocument();
    });
  });

  it('allows doctor to create a brand new patient and schedule a visit', async () => {
    (useAuth as any).mockReturnValue({ user: { uid: 'doctor-123', displayName: 'Dr. Smith' } });

    render(
      <MemoryRouter>
        <Schedule />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    // Open schedule modal
    await user.click(screen.getByRole('button', { name: /schedule visit/i }));

    // Switch to "+ Create New Patient" tab
    const createTabBtn = screen.getByRole('button', { name: /\+ Create New Patient/i });
    await user.click(createTabBtn);

    // Verify New Patient Registration subform is active
    expect(screen.getByText('New Patient Registration')).toBeInTheDocument();

    // Fill in new patient details
    const nameInput = screen.getByPlaceholderText('e.g. Eleanor Vance');
    await user.type(nameInput, 'Gregory House');

    const allergiesInput = screen.getByPlaceholderText(/Penicillin, Sulfa, NKDA/i);
    await user.type(allergiesInput, 'No Known Drug Allergies');

    const historyInput = screen.getByPlaceholderText(/Type 2 Diabetes, Hypertension, Asthma/i);
    await user.type(historyInput, 'Right leg pain, prior infarction');

    // Click "Save Patient & Select"
    const savePatientBtn = screen.getByRole('button', { name: /Save Patient & Select/i });
    await user.click(savePatientBtn);

    // Verify patient was saved to Firestore
    expect(addDoc).toHaveBeenCalled();

    // Verify Gregory House is now the selected patient
    await waitFor(() => {
      expect(screen.getByText('Gregory House')).toBeInTheDocument();
    });

    // Complete scheduling visit
    const scheduleButtons = screen.getAllByRole('button', { name: /schedule visit/i });
    await user.click(scheduleButtons[1]);

    await waitFor(() => {
      expect(screen.getByText(/Visit scheduled successfully for Gregory House!/i)).toBeInTheDocument();
    });
  });
});
