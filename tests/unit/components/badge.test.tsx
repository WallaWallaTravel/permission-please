import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  it('renders with default props', () => {
    render(<Badge>Default Badge</Badge>);
    expect(screen.getByText('Default Badge')).toBeInTheDocument();
  });

  it('applies default variant styling', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-gray');
    expect(badge.className).toContain('text-gray');
  });

  it('applies primary variant', () => {
    render(
      <Badge variant="primary" data-testid="badge">
        Primary
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-blue');
    expect(badge.className).toContain('text-blue');
  });

  it('applies success variant', () => {
    render(
      <Badge variant="success" data-testid="badge">
        Success
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-green');
    expect(badge.className).toContain('text-green');
  });

  it('applies warning variant', () => {
    render(
      <Badge variant="warning" data-testid="badge">
        Warning
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-amber');
    expect(badge.className).toContain('text-amber');
  });

  it('applies danger variant', () => {
    render(
      <Badge variant="danger" data-testid="badge">
        Danger
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-red');
    expect(badge.className).toContain('text-red');
  });

  it('applies info variant', () => {
    render(
      <Badge variant="info" data-testid="badge">
        Info
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-cyan');
    expect(badge.className).toContain('text-cyan');
  });

  it('applies purple variant', () => {
    render(
      <Badge variant="purple" data-testid="badge">
        Purple
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-purple');
    expect(badge.className).toContain('text-purple');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge.className).toContain('custom-badge');
  });

  it('has rounded-full styling', () => {
    render(<Badge data-testid="badge">Rounded</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('rounded-full');
  });

  it('has proper padding', () => {
    render(<Badge data-testid="badge">Padded</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('px-2.5');
    expect(badge.className).toContain('py-0.5');
  });

  it('has proper font styling', () => {
    render(<Badge data-testid="badge">Styled</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('text-xs');
    expect(badge.className).toContain('font-medium');
  });

  it('renders as span element', () => {
    render(<Badge>Span Badge</Badge>);
    const badge = screen.getByText('Span Badge');
    expect(badge.tagName).toBe('SPAN');
  });

  it('supports spreading additional props', () => {
    render(
      <Badge data-testid="badge" title="Badge Title">
        Props Badge
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('title', 'Badge Title');
  });
});

describe('Badge Usage Examples', () => {
  it('works for status indicators', () => {
    render(
      <div>
        <Badge variant="success">Active</Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="danger">Expired</Badge>
      </div>
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('works for form status in Permission Please context', () => {
    render(
      <div>
        <Badge variant="primary">Draft</Badge>
        <Badge variant="success">Signed</Badge>
        <Badge variant="warning">Awaiting Signature</Badge>
        <Badge variant="danger">Overdue</Badge>
      </div>
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Signed')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Signature')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});
