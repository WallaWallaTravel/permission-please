/**
 * Client-side analytics tracking for Permission Please
 *
 * Uses Vercel Analytics for tracking custom events.
 * These events help understand user behavior and feature adoption.
 */

import { track } from '@vercel/analytics';

// ============================================================================
// Event Names (for consistency)
// ============================================================================

export const AnalyticsEvents = {
  // Form lifecycle events
  FORM_CREATED: 'form_created',
  FORM_DISTRIBUTED: 'form_distributed',
  FORM_ACTIVATED: 'form_activated',
  FORM_CLOSED: 'form_closed',
  FORM_DELETED: 'form_deleted',

  // Signature events
  SIGNATURE_STARTED: 'signature_started',
  SIGNATURE_COMPLETED: 'signature_completed',
  SIGNATURE_DECLINED: 'signature_declined',

  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',

  // Student management
  STUDENT_ADDED: 'student_added',
  PARENT_LINKED: 'parent_linked',

  // Admin events
  SCHOOL_CREATED: 'school_created',
  INVITE_SENT: 'invite_sent',
  INVITE_ACCEPTED: 'invite_accepted',

  // Navigation events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  FORM_VIEWED: 'form_viewed',
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// ============================================================================
// Event Tracking Functions
// ============================================================================

/**
 * Track a custom event with optional properties
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) {
  try {
    track(event, properties);
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.debug('Analytics tracking failed:', error);
  }
}

// ============================================================================
// Form Events
// ============================================================================

export function trackFormCreated(formId: string, eventType: string, status: string) {
  trackEvent(AnalyticsEvents.FORM_CREATED, {
    form_id: formId,
    event_type: eventType,
    status,
  });
}

export function trackFormDistributed(formId: string, recipientCount: number) {
  trackEvent(AnalyticsEvents.FORM_DISTRIBUTED, {
    form_id: formId,
    recipient_count: recipientCount,
  });
}

export function trackFormActivated(formId: string) {
  trackEvent(AnalyticsEvents.FORM_ACTIVATED, { form_id: formId });
}

export function trackFormClosed(formId: string) {
  trackEvent(AnalyticsEvents.FORM_CLOSED, { form_id: formId });
}

// ============================================================================
// Signature Events
// ============================================================================

export function trackSignatureStarted(formId: string) {
  trackEvent(AnalyticsEvents.SIGNATURE_STARTED, { form_id: formId });
}

export function trackSignatureCompleted(formId: string, studentId: string) {
  trackEvent(AnalyticsEvents.SIGNATURE_COMPLETED, {
    form_id: formId,
    student_id: studentId,
  });
}

// ============================================================================
// User Events
// ============================================================================

export function trackUserSignup(role: string) {
  trackEvent(AnalyticsEvents.USER_SIGNUP, { role });
}

export function trackUserLogin(role: string) {
  trackEvent(AnalyticsEvents.USER_LOGIN, { role });
}

// ============================================================================
// Admin Events
// ============================================================================

export function trackSchoolCreated(schoolId: string) {
  trackEvent(AnalyticsEvents.SCHOOL_CREATED, { school_id: schoolId });
}

export function trackInviteSent(role: string) {
  trackEvent(AnalyticsEvents.INVITE_SENT, { role });
}

// ============================================================================
// Dashboard Events
// ============================================================================

export function trackDashboardViewed(role: string) {
  trackEvent(AnalyticsEvents.DASHBOARD_VIEWED, { role });
}
