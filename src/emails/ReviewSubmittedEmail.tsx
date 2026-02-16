import { Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface ReviewSubmittedEmailProps {
  reviewerName: string;
  teacherName: string;
  formTitle: string;
  eventDate: string;
  schoolName?: string;
  isExpedited?: boolean;
  reviewNeededBy?: string;
  reviewUrl: string;
}

export function ReviewSubmittedEmail({
  reviewerName,
  teacherName,
  formTitle,
  eventDate,
  schoolName = 'School',
  isExpedited = false,
  reviewNeededBy,
  reviewUrl,
}: ReviewSubmittedEmailProps) {
  return (
    <EmailLayout
      preview={`${isExpedited ? 'EXPEDITED: ' : ''}New form submitted for review - ${formTitle}`}
      schoolName={schoolName}
    >
      {isExpedited && (
        <Section style={expeditedBanner}>
          <Text style={expeditedText}>EXPEDITED REVIEW REQUESTED</Text>
        </Section>
      )}

      <Heading style={heading}>New Form for Review</Heading>

      <Text style={paragraph}>Hi {reviewerName},</Text>

      <Text style={paragraph}>{teacherName} has submitted a permission form for your review.</Text>

      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Form:</strong> {formTitle}
        </Text>
        <Text style={detailItem}>
          <strong>Teacher:</strong> {teacherName}
        </Text>
        <Text style={detailItem}>
          <strong>Event Date:</strong> {eventDate}
        </Text>
        {reviewNeededBy && (
          <Text style={detailItem}>
            <strong>Review Needed By:</strong> {reviewNeededBy}
          </Text>
        )}
      </Section>

      <Section style={buttonContainer}>
        <EmailButton href={reviewUrl}>Review Form</EmailButton>
      </Section>

      <Hr style={hr} />

      <Text style={smallText}>
        You are receiving this because you are a reviewer at {schoolName}. Log in to Permission
        Please to approve or request revisions on this form.
      </Text>
    </EmailLayout>
  );
}

const expeditedBanner = {
  backgroundColor: '#fff7ed',
  border: '1px solid #f97316',
  borderRadius: '8px',
  padding: '12px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const expeditedText = {
  color: '#c2410c',
  fontSize: '14px',
  fontWeight: '700' as const,
  margin: '0',
  letterSpacing: '0.5px',
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

export default ReviewSubmittedEmail;
