import { Resend } from 'resend';
import { render } from '@react-email/components';
import { logger } from '@/lib/logger';
import { PermissionRequestEmail } from '@/emails/PermissionRequestEmail';
import { SignatureConfirmationEmail } from '@/emails/SignatureConfirmationEmail';
import { ReminderEmail } from '@/emails/ReminderEmail';
import { MagicLinkEmail } from '@/emails/MagicLinkEmail';
import { ReviewSubmittedEmail } from '@/emails/ReviewSubmittedEmail';
import { FormApprovedEmail } from '@/emails/FormApprovedEmail';
import { RevisionRequestedEmail } from '@/emails/RevisionRequestedEmail';

// Lazy-initialize Resend client to avoid build errors when API key is not set
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set. Email sending is disabled.');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'Permission Please <noreply@permissionplease.app>';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface SendPermissionRequestParams {
  parentEmail: string;
  parentName: string;
  studentName: string;
  formTitle: string;
  eventDate: Date;
  deadline: Date;
  signUrl: string;
  teacherName: string;
  schoolName?: string;
  description?: string;
}

export async function sendPermissionRequest({
  parentEmail,
  parentName,
  studentName,
  formTitle,
  eventDate,
  deadline,
  signUrl,
  teacherName,
  schoolName = 'School',
  description,
}: SendPermissionRequestParams) {
  const html = await render(
    PermissionRequestEmail({
      parentName,
      studentName,
      formTitle,
      eventDate: formatDate(eventDate),
      teacherName,
      deadline: formatDate(deadline),
      signUrl,
      schoolName,
      description,
    })
  );

  const text = `
Hi ${parentName},

${teacherName} from ${schoolName} has sent you a permission form to sign for ${studentName}.

Form: ${formTitle}
Event Date: ${formatDate(eventDate)}
Sign By: ${formatDate(deadline)}

Click here to review and sign: ${signUrl}

---
Sent via Permission Please
  `.trim();

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: parentEmail,
    subject: `Permission Required: ${formTitle} for ${studentName}`,
    html,
    text,
  });

  if (error) {
    logger.error('Failed to send email', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

interface SendReminderParams {
  parentEmail: string;
  parentName: string;
  studentName: string;
  formTitle: string;
  eventDate: Date;
  deadline: Date;
  signUrl: string;
  teacherName: string;
  schoolName?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
}

function formatTimeRemaining(days?: number, hours?: number): string {
  if (hours !== undefined && hours < 24) {
    if (hours <= 1) return 'within the hour';
    return `in ${hours} hours`;
  }
  if (days !== undefined) {
    if (days <= 0) return 'TODAY';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
  }
  return 'soon';
}

export async function sendReminder({
  parentEmail,
  parentName,
  studentName,
  formTitle,
  eventDate,
  deadline,
  signUrl,
  teacherName,
  schoolName = 'School',
  daysRemaining,
  hoursRemaining,
}: SendReminderParams) {
  // Determine urgency based on time remaining
  const isUrgent =
    (hoursRemaining !== undefined && hoursRemaining <= 24) ||
    (daysRemaining !== undefined && daysRemaining <= 1);
  const urgency = isUrgent ? 'URGENT' : 'Reminder';
  const timeText = formatTimeRemaining(daysRemaining, hoursRemaining);

  const html = await render(
    ReminderEmail({
      parentName,
      studentName,
      formTitle,
      eventDate: formatDate(eventDate),
      teacherName,
      deadline: formatDate(deadline),
      signUrl,
      schoolName,
      daysRemaining: daysRemaining ?? Math.ceil((hoursRemaining ?? 24) / 24),
    })
  );

  const text = `
${urgency}: Signature Needed

Hi ${parentName},

This is a friendly reminder that the permission form for ${studentName} still needs your signature.

Form: ${formTitle}
Deadline: ${formatDate(deadline)} (${timeText})

Click here to sign now: ${signUrl}

---
Permission Please
  `.trim();

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: parentEmail,
    subject: `${urgency}: Permission form for ${studentName} due ${timeText}`,
    html,
    text,
  });

  if (error) {
    logger.error('Failed to send reminder', error);
    throw new Error(`Failed to send reminder: ${error.message}`);
  }

  return data;
}

interface SendConfirmationParams {
  parentEmail: string;
  parentName: string;
  studentName: string;
  formTitle: string;
  eventDate: Date;
  signedAt: Date;
  pdfUrl?: string;
  schoolName?: string;
}

export async function sendSignatureConfirmation({
  parentEmail,
  parentName,
  studentName,
  formTitle,
  eventDate,
  signedAt,
  pdfUrl,
  schoolName = 'School',
}: SendConfirmationParams) {
  const html = await render(
    SignatureConfirmationEmail({
      parentName,
      studentName,
      formTitle,
      eventDate: formatDate(eventDate),
      signedAt: signedAt.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      pdfUrl,
      schoolName,
    })
  );

  const text = `
Permission Confirmed!

Hi ${parentName},

Thank you! Your electronic signature has been received for:

Form: ${formTitle}
Student: ${studentName}
Event Date: ${formatDate(eventDate)}
Status: Signed

A copy of this confirmation has been sent to the teacher. No further action is required.

---
Permission Please
  `.trim();

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: parentEmail,
    subject: `Permission Granted: ${formTitle}`,
    html,
    text,
  });

  if (error) {
    logger.error('Failed to send confirmation', error);
    throw new Error(`Failed to send confirmation: ${error.message}`);
  }

  return data;
}

interface SendMagicLinkParams {
  email: string;
  name: string;
  magicLinkUrl: string;
}

export async function sendMagicLinkEmail({ email, name, magicLinkUrl }: SendMagicLinkParams) {
  const html = await render(
    MagicLinkEmail({
      name,
      magicLinkUrl,
      expiresInMinutes: 15,
    })
  );

  const text = `
Sign In to Permission Please

Hi ${name},

You requested a login link for your Permission Please account. Click the link below to sign in:

${magicLinkUrl}

This link expires in 15 minutes and can only be used once.

If you did not request this login link, you can safely ignore this email.

---
Permission Please
  `.trim();

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Login Link for Permission Please',
    html,
    text,
  });

  if (error) {
    logger.error('Failed to send magic link email', error);
    throw new Error(`Failed to send magic link email: ${error.message}`);
  }

  return data;
}

interface SendInviteParams {
  email: string;
  inviteUrl: string;
  role: string;
  schoolName?: string;
  inviterName: string;
}

export async function sendInviteEmail({
  email,
  inviteUrl,
  role,
  schoolName,
  inviterName,
}: SendInviteParams) {
  const roleDisplay = role.replace('_', ' ').toLowerCase();
  const schoolText = schoolName ? ` at ${schoolName}` : '';

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You're invited to join Permission Please${schoolText}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Join Permission Please</p>
          </div>

          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 18px; margin-top: 0;">Hello,</p>

            <p>${inviterName} has invited you to join Permission Please as a <strong>${roleDisplay}</strong>${schoolText}.</p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 15px 0; color: #1e3a5f; font-size: 18px;">What is Permission Please?</h2>
              <p style="margin: 0; color: #64748b;">Permission Please is a modern platform for managing digital permission slips. Say goodbye to paper forms and hello to simple, secure electronic signatures.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Accept Invitation →
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px;">This invitation will expire in 7 days. Click the button above to create your account and get started.</p>

            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>

          <div style="background: #1e3a5f; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">
              Permission Please • Digital Permission Slips Made Simple
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
You're Invited to Permission Please!

${inviterName} has invited you to join Permission Please as a ${roleDisplay}${schoolText}.

Permission Please is a modern platform for managing digital permission slips. Say goodbye to paper forms and hello to simple, secure electronic signatures.

Click here to accept your invitation: ${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
Permission Please
    `.trim(),
  });

  if (error) {
    logger.error('Failed to send invite email', error);
    throw new Error(`Failed to send invite email: ${error.message}`);
  }

  return data;
}

interface SendPasswordResetParams {
  email: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ email, name, resetUrl }: SendPasswordResetParams) {
  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset Your Password - Permission Please',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Permission Please</p>
          </div>

          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 18px; margin-top: 0;">Hi ${name},</p>

            <p>We received a request to reset your password. Click the button below to create a new password:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password →
              </a>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>This link expires in 1 hour.</strong><br>
                If you didn't request this reset, you can safely ignore this email.
              </p>
            </div>

            <p style="color: #64748b; font-size: 14px;">For security, this password reset link can only be used once.</p>
          </div>

          <div style="background: #1e3a5f; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">
              Permission Please • Secure Password Reset
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name},

We received a request to reset your password for Permission Please.

Click here to reset your password: ${resetUrl}

This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.

---
Permission Please
    `.trim(),
  });

  if (error) {
    logger.error('Failed to send password reset email', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  return data;
}

interface SendReviewSubmittedParams {
  reviewerEmail: string;
  reviewerName: string;
  teacherName: string;
  formTitle: string;
  eventDate: Date;
  schoolName?: string;
  isExpedited?: boolean;
  reviewNeededBy?: Date;
  reviewUrl: string;
}

export async function sendReviewSubmittedEmail({
  reviewerEmail,
  reviewerName,
  teacherName,
  formTitle,
  eventDate,
  schoolName = 'School',
  isExpedited = false,
  reviewNeededBy,
  reviewUrl,
}: SendReviewSubmittedParams) {
  const html = await render(
    ReviewSubmittedEmail({
      reviewerName,
      teacherName,
      formTitle,
      eventDate: formatDate(eventDate),
      schoolName,
      isExpedited,
      reviewNeededBy: reviewNeededBy ? formatDate(reviewNeededBy) : undefined,
      reviewUrl,
    })
  );

  const subject = isExpedited
    ? `EXPEDITED: New form for review - ${formTitle}`
    : `New form for review - ${formTitle}`;

  const text = `
${isExpedited ? 'EXPEDITED REVIEW REQUESTED\n\n' : ''}Hi ${reviewerName},

${teacherName} has submitted a permission form for your review.

Form: ${formTitle}
Event Date: ${formatDate(eventDate)}
${reviewNeededBy ? `Review Needed By: ${formatDate(reviewNeededBy)}\n` : ''}
Click here to review: ${reviewUrl}

---
Permission Please
  `.trim();

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: reviewerEmail,
    subject,
    html,
    text,
  });

  if (error) {
    logger.error('Failed to send review submitted email', error);
    throw new Error(`Failed to send review submitted email: ${error.message}`);
  }

  return data;
}

interface SendFormApprovedParams {
  teacherEmail: string;
  teacherName: string;
  reviewerName: string;
  formTitle: string;
  eventDate: Date;
  schoolName?: string;
  comments?: string;
  formUrl: string;
}

export async function sendFormApprovedEmail({
  teacherEmail,
  teacherName,
  reviewerName,
  formTitle,
  eventDate,
  schoolName = 'School',
  comments,
  formUrl,
}: SendFormApprovedParams) {
  const html = await render(
    FormApprovedEmail({
      teacherName,
      reviewerName,
      formTitle,
      eventDate: formatDate(eventDate),
      schoolName,
      comments: comments || undefined,
      formUrl,
    })
  );

  const text = `
Form Approved!

Hi ${teacherName},

Your permission form "${formTitle}" has been approved by ${reviewerName}. You can now activate and distribute it to parents.

Event Date: ${formatDate(eventDate)}
${comments ? `\nReviewer Comments: ${comments}\n` : ''}
Click here to view: ${formUrl}

---
Permission Please
  `.trim();

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: teacherEmail,
    subject: `Form Approved: ${formTitle}`,
    html,
    text,
  });

  if (error) {
    logger.error('Failed to send form approved email', error);
    throw new Error(`Failed to send form approved email: ${error.message}`);
  }

  return data;
}

interface SendRevisionRequestedParams {
  teacherEmail: string;
  teacherName: string;
  reviewerName: string;
  formTitle: string;
  eventDate: Date;
  schoolName?: string;
  comments: string;
  formUrl: string;
}

export async function sendRevisionRequestedEmail({
  teacherEmail,
  teacherName,
  reviewerName,
  formTitle,
  eventDate,
  schoolName = 'School',
  comments,
  formUrl,
}: SendRevisionRequestedParams) {
  const html = await render(
    RevisionRequestedEmail({
      teacherName,
      reviewerName,
      formTitle,
      eventDate: formatDate(eventDate),
      schoolName,
      comments,
      formUrl,
    })
  );

  const text = `
Revision Requested

Hi ${teacherName},

${reviewerName} has reviewed your permission form "${formTitle}" and is requesting changes.

Event Date: ${formatDate(eventDate)}

Reviewer Feedback:
${comments}

Click here to edit: ${formUrl}

---
Permission Please
  `.trim();

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: teacherEmail,
    subject: `Revision Requested: ${formTitle}`,
    html,
    text,
  });

  if (error) {
    logger.error('Failed to send revision requested email', error);
    throw new Error(`Failed to send revision requested email: ${error.message}`);
  }

  return data;
}
