import { z } from 'zod';

export const formFieldSchema = z.object({
  fieldType: z.enum(['text', 'checkbox', 'date', 'textarea']),
  label: z.string().min(1, 'Field label is required'),
  required: z.boolean().default(false),
  order: z.number().int().positive(),
});

export const createFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    description: z.string().min(1, 'Description is required').max(2000, 'Description is too long'),
    eventDate: z.string().datetime('Invalid event date'),
    eventType: z.enum(['FIELD_TRIP', 'SPORTS', 'ACTIVITY', 'OTHER']),
    deadline: z.string().datetime('Invalid deadline'),
    status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).default('DRAFT'),
    fields: z.array(formFieldSchema).optional(),
  })
  .refine(
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

export const updateFormSchema = createFormSchema.partial();

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type FormFieldInput = z.infer<typeof formFieldSchema>;
