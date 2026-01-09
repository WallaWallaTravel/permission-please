import { describe, it, expect } from 'vitest';
import { createFormSchema } from '@/lib/validations/form-schema';

describe('Form Validation Schema', () => {
  it('validates a correct form', () => {
    const validForm = {
      title: 'Zoo Field Trip',
      description: 'Annual trip to the city zoo',
      eventDate: '2024-06-15T09:00:00.000Z',
      eventType: 'FIELD_TRIP',
      deadline: '2024-06-10T23:59:59.000Z',
      status: 'DRAFT',
      fields: [],
    };

    const result = createFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const invalidForm = {
      title: '',
      description: 'Some description',
      eventDate: '2024-06-15T09:00:00.000Z',
      eventType: 'FIELD_TRIP',
      deadline: '2024-06-10T23:59:59.000Z',
      status: 'DRAFT',
      fields: [],
    };

    const result = createFormSchema.safeParse(invalidForm);
    expect(result.success).toBe(false);
  });

  it('rejects invalid event type', () => {
    const invalidForm = {
      title: 'Test Form',
      description: 'Some description',
      eventDate: '2024-06-15T09:00:00.000Z',
      eventType: 'INVALID_TYPE',
      deadline: '2024-06-10T23:59:59.000Z',
      status: 'DRAFT',
      fields: [],
    };

    const result = createFormSchema.safeParse(invalidForm);
    expect(result.success).toBe(false);
  });

  it('validates form fields correctly', () => {
    const validForm = {
      title: 'Test Form',
      description: 'Description here',
      eventDate: '2024-06-15T09:00:00.000Z',
      eventType: 'ACTIVITY',
      deadline: '2024-06-10T23:59:59.000Z',
      status: 'ACTIVE',
      fields: [
        { fieldType: 'text', label: 'Emergency Contact', required: true, order: 1 },
        { fieldType: 'checkbox', label: 'Has Allergies', required: false, order: 2 },
      ],
    };

    const result = createFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });
});

