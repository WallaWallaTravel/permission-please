import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface ReminderEmailProps {
  parentName: string;
  studentName: string;
  formTitle: string;
  eventDate: string;
  teacherName: string;
  deadline: string;
  signUrl: string;
  schoolName?: string;
  daysRemaining: number;
}

export function ReminderEmail({
  parentName,
  studentName,
  formTitle,
  eventDate,
  teacherName,
  deadline,
  signUrl,
  schoolName = 'School',
  daysRemaining,
}: ReminderEmailProps) {
  const isUrgent = daysRemaining <= 2;

  return (
    <EmailLayout
      preview={`Reminder: Permission form for ${studentName} - ${formTitle}`}
      schoolName={schoolName}
    >
      {isUrgent ? (
        <Section style={urgentBanner}>
          <Text style={urgentIcon}>&#9888;</Text>
          <Text style={urgentText}>Signature Required Soon</Text>
        </Section>
      ) : (
        <Section style={reminderBanner}>
          <Text style={reminderIcon}>&#128276;</Text>
          <Text style={reminderText}>Friendly Reminder</Text>
        </Section>
      )}

      <Heading style={heading}>Permission Form Reminder</Heading>

      <Text style={paragraph}>Dear {parentName},</Text>

      <Text style={paragraph}>
        This is a reminder that <strong>{studentName}</strong>&apos;s permission
        form still requires your signature.
      </Text>

      <Section style={isUrgent ? urgentDetailsBox : detailsBox}>
        <Text style={detailItem}>
          <strong>Event:</strong> {formTitle}
        </Text>
        <Text style={detailItem}>
          <strong>Date:</strong> {eventDate}
        </Text>
        <Text style={detailItem}>
          <strong>Teacher:</strong> {teacherName}
        </Text>
        <Text style={isUrgent ? urgentDeadline : detailItem}>
          <strong>Deadline:</strong> {deadline}
          {isUrgent && ` (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining)`}
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={paragraph}>
        Please sign the permission form to ensure {studentName} can participate.
      </Text>

      <Section style={buttonContainer}>
        <EmailButton href={signUrl} variant={isUrgent ? 'danger' : 'primary'}>
          Sign Permission Form Now
        </EmailButton>
      </Section>

      <Text style={smallText}>
        Questions? Contact {teacherName} at {schoolName}.
      </Text>
    </EmailLayout>
  );
}

const urgentBanner = {
  backgroundColor: '#fee2e2',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  border: '1px solid #fecaca',
};

const urgentIcon = {
  color: '#dc2626',
  fontSize: '28px',
  margin: '0 0 8px',
};

const urgentText = {
  color: '#991b1b',
  fontSize: '18px',
  fontWeight: '600' as const,
  margin: '0',
};

const reminderBanner = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const reminderIcon = {
  color: '#d97706',
  fontSize: '28px',
  margin: '0 0 8px',
};

const reminderText = {
  color: '#92400e',
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

const urgentDetailsBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fecaca',
};

const detailItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const urgentDeadline = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
  fontWeight: '600' as const,
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

export default ReminderEmail;
