import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Recording from './Recording';
import userEvent from '@testing-library/user-event';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock MediaRecorder
class MockMediaRecorder {
  state = 'inactive';
  stream: any;
  ondataavailable: any;
  onstop: any;

  constructor(stream: any) {
    this.stream = stream;
  }

  start() {
    this.state = 'recording';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['test audio content'], { type: 'audio/webm' }) });
    }
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }
}

describe('Recording', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).MediaRecorder = MockMediaRecorder;
    Object.assign(navigator, {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });

    // Mock server API call
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transcription: 'Patient reports persistent cough.',
        soapNote: {
          subjective: 'Patient reports persistent cough.',
          objective: 'Vitals stable.',
          assessment: 'Acute bronchitis.',
          plan: ['Rest and fluids.'],
        },
        codes: [
          { code: 'J20.9', description: 'Acute bronchitis, unspecified', confidence: 'HIGH' },
        ],
      }),
    });
  });

  it('renders correctly initially', () => {
    render(
      <MemoryRouter>
        <Recording />
      </MemoryRouter>
    );

    expect(screen.getByText('Start Encounter')).toBeInTheDocument();
    expect(screen.getByText(/Ready/i)).toBeInTheDocument();
  });

  it('starts recording when button is clicked', async () => {
    render(
      <MemoryRouter>
        <Recording />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Start Encounter'));

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    await waitFor(() => {
      expect(screen.getByText('Finish Encounter')).toBeInTheDocument();
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });
  });

  it('stops recording and processes data via server-side endpoint', async () => {
    const navigateMock = vi.fn();
    (useNavigate as any).mockReturnValue(navigateMock);

    render(
      <MemoryRouter>
        <Recording />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Start Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Finish Encounter')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Finish Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    // Verify server endpoint was called
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/clinical/process-audio',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Wait for the navigation to happen with data from server
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/visit/review', expect.objectContaining({
        state: expect.objectContaining({
          transcription: 'Patient reports persistent cough.',
        }),
      }));
    });
  });

  it('handles microphone access error', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValue(new Error('Denied'));

    render(
      <MemoryRouter>
        <Recording />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Start Encounter'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Could not access microphone.');
    });

    alertMock.mockRestore();
  });
});
