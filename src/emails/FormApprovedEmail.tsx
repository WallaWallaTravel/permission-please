import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface FormApprovedEmailProps {
  teacherName: string;
  reviewerName: string;
  formTitle: string;
  eventDate: string;
  schoolName?: string;
  comments?: string;
  formUrl: string;
}

export function FormApprovedEmail({
  teacherName,
  reviewerName,
  formTitle,
  eventDate,
  schoolName = 'School',
  comments,
  formUrl,
}: FormApprovedEmailProps) {
  return (
    <EmailLayout preview={`Your form "${formTitle}" has been approved`} schoolName={schoolName}>
      <Section style={successBanner}>
        <Text style={successIcon}>&#10003;</Text>
        <Text style={successText}>Form Approved</Text>
      </Section>

      <Heading style={heading}>Good News!</Heading>

      <Text style={paragraph}>Hi {teacherName},</Text>

      <Text style={paragraph}>
        Your permission form has been approved by {reviewerName}. You can now activate and
        distribute it to parents.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Form:</strong> {formTitle}
        </Text>
        <Text style={detailItem}>
          <strong>Event Date:</strong> {eventDate}
        </Text>
        <Text style={detailItem}>
          <strong>Reviewed By:</strong> {reviewerName}
        </Text>
      </Section>

      {comments && (
        <>
          <Text style={commentsLabel}>Reviewer Comments:</Text>
          <Section style={commentsBox}>
            <Text style={commentsText}>{comments}</Text>
          </Section>
        </>
      )}

      <Section style={buttonContainer}>
        <EmailButton href={formUrl}>View Form</EmailButton>
      </Section>

      <Hr style={hr} />

      <Text style={smallText}>
        Your form is approved and ready to distribute. Log in to Permission Please to activate the
        form and send it to parents.
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

const commentsLabel = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '16px 0 8px',
};

const commentsBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 24px',
};

const commentsText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  fontStyle: 'italic' as const,
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

export default FormApprovedEmail;
