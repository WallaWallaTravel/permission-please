import { Button } from '@react-email/components';
import * as React from 'react';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function EmailButton({
  href,
  children,
  variant = 'primary',
}: EmailButtonProps) {
  const styles = {
    primary: buttonPrimary,
    secondary: buttonSecondary,
    danger: buttonDanger,
  };

  return (
    <Button style={styles[variant]} href={href}>
      {children}
    </Button>
  );
}

const buttonBase = {
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const buttonPrimary = {
  ...buttonBase,
  backgroundColor: '#1e40af',
  color: '#ffffff',
};

const buttonSecondary = {
  ...buttonBase,
  backgroundColor: '#e5e7eb',
  color: '#374151',
};

const buttonDanger = {
  ...buttonBase,
  backgroundColor: '#dc2626',
  color: '#ffffff',
};

export default EmailButton;
