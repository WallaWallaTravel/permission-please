import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface RevisionRequestedEmailProps {
  teacherName: string;
  reviewerName: string;
  formTitle: string;
  eventDate: string;
  schoolName?: string;
  comments: string;
  formUrl: string;
}

export function RevisionRequestedEmail({
  teacherName,
  reviewerName,
  formTitle,
  eventDate,
  schoolName = 'School',
  comments,
  formUrl,
}: RevisionRequestedEmailProps) {
  return (
    <EmailLayout preview={`Revision requested for "${formTitle}"`} schoolName={schoolName}>
      <Section style={revisionBanner}>
        <Text style={revisionIcon}>!</Text>
        <Text style={revisionText}>Revision Requested</Text>
      </Section>

      <Heading style={heading}>Changes Needed</Heading>

      <Text style={paragraph}>Hi {teacherName},</Text>

      <Text style={paragraph}>
        {reviewerName} has reviewed your permission form and is requesting some changes before it
        can be approved.
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

      <Text style={commentsLabel}>Reviewer Feedback:</Text>
      <Section style={commentsBox}>
        <Text style={commentsText}>{comments}</Text>
      </Section>

      <Section style={buttonContainer}>
        <EmailButton href={formUrl}>Edit Form</EmailButton>
      </Section>

      <Hr style={hr} />

      <Text style={smallText}>
        Please review the feedback and make the requested changes. Once updated, you can resubmit
        the form for review from the form editor.
      </Text>
    </EmailLayout>
  );
}

const revisionBanner = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const revisionIcon = {
  color: '#dc2626',
  fontSize: '32px',
  fontWeight: '700' as const,
  margin: '0 0 8px',
};

const revisionText = {
  color: '#991b1b',
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
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 24px',
};

const commentsText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
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

export default RevisionRequestedEmail;
