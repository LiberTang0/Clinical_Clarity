import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Button from './Button';

describe('Button', () => {
  it('renders a button element by default', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('renders a link when href is provided', () => {
    render(
      <MemoryRouter>
        <Button href="/test">Link Button</Button>
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders a span when href is provided but disabled', () => {
    render(
      <MemoryRouter>
        <Button href="/test" disabled>Disabled Link</Button>
      </MemoryRouter>
    );
    const span = screen.getByText(/disabled link/i);
    expect(span.tagName).toBe('SPAN');
    expect(span).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies the correct variant class', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-secondary-container');
  });

  it('applies the correct size class', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('text-lg');
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button', { name: /full width/i });
    expect(button).toHaveClass('w-full');
  });

  it('renders an icon', () => {
    render(<Button icon={<span data-testid="icon">icon</span>}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
