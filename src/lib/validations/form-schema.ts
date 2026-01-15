import { z } from 'zod';

export const formFieldSchema = z.object({
  fieldType: z.enum(['text', 'checkbox', 'date', 'textarea']),
  label: z.string().min(1, 'Field label is required'),
  required: z.boolean().default(false),
  order: z.number().int().positive(),
});

// Reminder interval schema
export const reminderIntervalSchema = z.object({
  value: z.number().int().positive().max(30, 'Reminder interval cannot exceed 30'),
  unit: z.enum(['days', 'hours']),
});

// Form document schema
export const formDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Invalid file URL'),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1, 'MIME type is required'),
  description: z.string().max(500, 'Description is too long').optional(),
  source: z.enum(['external', 'school', 'district']).default('external'),
  requiresAck: z.boolean().default(true),
});

// Base schema without refinement
const baseFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description is too long'),
  eventDate: z.string().datetime('Invalid event date'),
  eventType: z.enum(['FIELD_TRIP', 'SPORTS', 'ACTIVITY', 'OTHER']),
  deadline: z.string().datetime('Invalid deadline'),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).default('DRAFT'),
  fields: z.array(formFieldSchema).optional(),
  // Reminder settings
  remindersEnabled: z.boolean().default(true),
  reminderSchedule: z.array(reminderIntervalSchema).optional(),
  // External documents
  documents: z.array(formDocumentSchema).optional(),
});

export const createFormSchema = baseFormSchema.refine(
  (data) => {
    const eventDate = new Date(data.eventDate);
    const deadline = new Date(data.deadline);
    return deadline < eventDate;
  },
  {
    message: 'Deadline must be before the event date',
    path: ['deadline'],
  }
);

// Update schema is partial and only validates deadline if both dates provided
export const updateFormSchema = baseFormSchema.partial().refine(
  (data) => {
    // Only validate if both dates are provided
    if (data.eventDate && data.deadline) {
      const eventDate = new Date(data.eventDate);
      const deadline = new Date(data.deadline);
      return deadline < eventDate;
    }
    return true;
  },
  {
    message: 'Deadline must be before the event date',
    path: ['deadline'],
  }
);

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type FormFieldInput = z.infer<typeof formFieldSchema>;
