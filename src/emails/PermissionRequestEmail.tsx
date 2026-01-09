import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface PermissionRequestEmailProps {
  parentName: string;
  studentName: string;
  formTitle: string;
  eventDate: string;
  teacherName: string;
  deadline: string;
  signUrl: string;
  schoolName?: string;
  description?: string;
}

export function PermissionRequestEmail({
  parentName,
  studentName,
  formTitle,
  eventDate,
  teacherName,
  deadline,
  signUrl,
  schoolName = 'School',
  description,
}: PermissionRequestEmailProps) {
  return (
    <EmailLayout
      preview={`Permission required for ${studentName} - ${formTitle}`}
      schoolName={schoolName}
    >
      <Heading style={heading}>Permission Request</Heading>

      <Text style={paragraph}>Dear {parentName},</Text>

      <Text style={paragraph}>
        A permission form requires your signature for <strong>{studentName}</strong>.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Event:</strong> {formTitle}
        </Text>
        <Text style={detailItem}>
          <strong>Date:</strong> {eventDate}
        </Text>
        <Text style={detailItem}>
          <strong>Teacher:</strong> {teacherName}
        </Text>
        <Text style={detailItem}>
          <strong>Deadline:</strong> {deadline}
        </Text>
      </Section>

      {description && (
        <>
          <Text style={sectionTitle}>Description</Text>
          <Text style={descriptionText}>{description}</Text>
        </>
      )}

      <Hr style={hr} />

      <Text style={paragraph}>
        Please review and sign this permission form before the deadline.
      </Text>

      <Section style={buttonContainer}>
        <EmailButton href={signUrl}>Review &amp; Sign Form</EmailButton>
      </Section>

      <Text style={smallText}>
        Click the button above to sign in and review the form. If you did not expect
        this email or have questions, please contact {teacherName} at {schoolName}.
      </Text>
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

const sectionTitle = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '16px 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const descriptionText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
  fontStyle: 'italic' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const smallText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '16px 0',
};

export default PermissionRequestEmail;
