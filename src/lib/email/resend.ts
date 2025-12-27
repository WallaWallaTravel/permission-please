import { Resend } from 'resend';

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
}: SendPermissionRequestParams) {
  const formattedEventDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedDeadline = deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: parentEmail,
    subject: `Permission Required: ${formTitle} for ${studentName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📝 Permission Please</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Digital Permission Slips Made Simple</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 18px; margin-top: 0;">Hi ${parentName},</p>
            
            <p>${teacherName} from ${schoolName} has sent you a permission form to sign for <strong>${studentName}</strong>.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 15px 0; color: #1e3a5f; font-size: 20px;">${formTitle}</h2>
              <p style="margin: 5px 0;"><strong>📅 Event Date:</strong> ${formattedEventDate}</p>
              <p style="margin: 5px 0;"><strong>⏰ Sign By:</strong> ${formattedDeadline}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review & Sign Now →
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">This link will take you directly to the permission form where you can review the details and provide your electronic signature.</p>
          </div>
          
          <div style="background: #1e3a5f; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">
              Sent via Permission Please • Secure Digital Signatures
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${parentName},

${teacherName} from ${schoolName} has sent you a permission form to sign for ${studentName}.

Form: ${formTitle}
Event Date: ${formattedEventDate}
Sign By: ${formattedDeadline}

Click here to review and sign: ${signUrl}

---
Sent via Permission Please
    `.trim(),
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

interface SendReminderParams {
  parentEmail: string;
  parentName: string;
  studentName: string;
  formTitle: string;
  deadline: Date;
  signUrl: string;
  daysRemaining: number;
}

export async function sendReminder({
  parentEmail,
  parentName,
  studentName,
  formTitle,
  deadline,
  signUrl,
  daysRemaining,
}: SendReminderParams) {
  const urgency = daysRemaining <= 1 ? '🚨 URGENT' : '⏰ Reminder';
  const formattedDeadline = deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: parentEmail,
    subject: `${urgency}: Permission form for ${studentName} due ${daysRemaining <= 1 ? 'tomorrow' : `in ${daysRemaining} days`}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${daysRemaining <= 1 ? '#dc2626' : '#f59e0b'}; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">${urgency}: Signature Needed</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Hi ${parentName},</p>
            
            <p>This is a friendly reminder that the permission form for <strong>${studentName}</strong> still needs your signature.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px;">${formTitle}</h2>
              <p style="margin: 5px 0; color: ${daysRemaining <= 1 ? '#dc2626' : '#f59e0b'}; font-weight: bold;">
                ⏰ Deadline: ${formattedDeadline}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Sign Now →
              </a>
            </div>
          </div>
          
          <div style="background: #1e3a5f; padding: 15px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">Permission Please</p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Failed to send reminder:', error);
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
}

export async function sendSignatureConfirmation({
  parentEmail,
  parentName,
  studentName,
  formTitle,
  eventDate,
}: SendConfirmationParams) {
  const formattedEventDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data, error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: parentEmail,
    subject: `✓ Permission Granted: ${formTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #16a34a; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Permission Confirmed!</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Hi ${parentName},</p>
            
            <p>Thank you! Your electronic signature has been received for:</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px;">${formTitle}</h2>
              <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 5px 0;"><strong>Event Date:</strong> ${formattedEventDate}</p>
              <p style="margin: 5px 0; color: #16a34a;"><strong>Status:</strong> ✓ Signed</p>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">A copy of this confirmation has been sent to the teacher. No further action is required.</p>
          </div>
          
          <div style="background: #1e3a5f; padding: 15px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">Permission Please • Thank you!</p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Failed to send confirmation:', error);
    throw new Error(`Failed to send confirmation: ${error.message}`);
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
    console.error('Failed to send invite email:', error);
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
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
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
                <strong>⚠️ This link expires in 1 hour.</strong><br>
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
    console.error('Failed to send password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  return data;
}
