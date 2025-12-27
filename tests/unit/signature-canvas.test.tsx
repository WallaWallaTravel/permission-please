import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureCanvas } from '@/components/signatures/SignatureCanvas';

describe('SignatureCanvas', () => {
  it('renders the signature canvas', () => {
    const onSignatureChange = vi.fn();
    render(<SignatureCanvas onSignatureChange={onSignatureChange} />);

    expect(screen.getByText(/sign here/i)).toBeInTheDocument();
    expect(screen.getByText(/clear signature/i)).toBeInTheDocument();
  });

  it('shows placeholder text when no signature', () => {
    const onSignatureChange = vi.fn();
    render(<SignatureCanvas onSignatureChange={onSignatureChange} />);

    expect(screen.getByText(/please sign above/i)).toBeInTheDocument();
  });

  it('calls onSignatureChange with null when cleared', () => {
    const onSignatureChange = vi.fn();
    render(<SignatureCanvas onSignatureChange={onSignatureChange} />);

    const clearButton = screen.getByText(/clear signature/i);
    fireEvent.click(clearButton);

    expect(onSignatureChange).toHaveBeenCalledWith(null);
  });

  it('accepts custom dimensions', () => {
    const onSignatureChange = vi.fn();
    render(<SignatureCanvas onSignatureChange={onSignatureChange} width={300} height={150} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle({ width: '300px', height: '150px' });
  });
});
