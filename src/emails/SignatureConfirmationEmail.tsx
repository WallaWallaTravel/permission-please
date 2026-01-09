import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface SignatureConfirmationEmailProps {
  parentName: string;
  studentName: string;
  formTitle: string;
  eventDate: string;
  signedAt: string;
  pdfUrl?: string;
  schoolName?: string;
}

export function SignatureConfirmationEmail({
  parentName,
  studentName,
  formTitle,
  eventDate,
  signedAt,
  pdfUrl,
  schoolName = 'School',
}: SignatureConfirmationEmailProps) {
  return (
    <EmailLayout
      preview={`Permission form signed for ${studentName} - ${formTitle}`}
      schoolName={schoolName}
    >
      <Section style={successBanner}>
        <Text style={successIcon}>&#10003;</Text>
        <Text style={successText}>Signature Confirmed</Text>
      </Section>

      <Heading style={heading}>Thank You!</Heading>

      <Text style={paragraph}>Dear {parentName},</Text>

      <Text style={paragraph}>
        Your signature has been recorded for <strong>{studentName}</strong>&apos;s
        permission form.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Event:</strong> {formTitle}
        </Text>
        <Text style={detailItem}>
          <strong>Date:</strong> {eventDate}
        </Text>
        <Text style={detailItem}>
          <strong>Signed:</strong> {signedAt}
        </Text>
      </Section>

      {pdfUrl && (
        <>
          <Hr style={hr} />
          <Text style={paragraph}>
            A copy of your signed permission form is available for download:
          </Text>
          <Section style={buttonContainer}>
            <EmailButton href={pdfUrl} variant="secondary">
              Download Signed Form (PDF)
            </EmailButton>
          </Section>
        </>
      )}

      <Hr style={hr} />

      <Text style={smallText}>
        This confirmation was sent automatically. Please keep this email for your
        records. If you have questions about the event, please contact the school.
      </Text>
    </EmailLayout>
  );
}

const successBanner = {
  backgroundColor: '#dcfce7',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const successIcon = {
  color: '#16a34a',
  fontSize: '32px',
  margin: '0 0 8px',
};

const successText = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: '600' as const,
  margin: '0',
};

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

const detailsBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
};

const detailItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const smallText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '16px 0',
};

export default SignatureConfirmationEmail;
