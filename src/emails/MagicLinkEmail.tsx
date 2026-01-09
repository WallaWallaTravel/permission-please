import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface MagicLinkEmailProps {
  name: string;
  magicLinkUrl: string;
  expiresInMinutes?: number;
}

export function MagicLinkEmail({
  name,
  magicLinkUrl,
  expiresInMinutes = 15,
}: MagicLinkEmailProps) {
  return (
    <EmailLayout
      preview="Your login link for Permission Please"
      schoolName="Permission Please"
    >
      <Heading style={heading}>Sign In to Permission Please</Heading>

      <Text style={paragraph}>Hi {name},</Text>

      <Text style={paragraph}>
        You requested a login link for your Permission Please account. Click the
        button below to sign in:
      </Text>

      <Section style={buttonContainer}>
        <EmailButton href={magicLinkUrl}>Sign In Now</EmailButton>
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          &#9888; This link expires in {expiresInMinutes} minutes and can only be
          used once.
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={paragraph}>
        After signing in, you&apos;ll be able to view and sign any pending
        permission forms for your children.
      </Text>

      <Section style={securityBox}>
        <Text style={securityTitle}>Security Notice</Text>
        <Text style={securityText}>
          If you did not request this login link, you can safely ignore this
          email. Someone may have entered your email address by mistake.
        </Text>
        <Text style={securityText}>
          Never share this link with anyone. Our staff will never ask for your
          login link.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const heading = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '700' as const,
  margin: '0 0 24px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const securityBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
};

const securityTitle = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
};

const securityText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '8px 0',
};

export default MagicLinkEmail;
