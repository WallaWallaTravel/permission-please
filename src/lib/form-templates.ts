export interface FormTemplateField {
  fieldType: 'text' | 'checkbox' | 'date' | 'textarea';
  label: string;
  required: boolean;
  order: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  eventType: 'FIELD_TRIP' | 'SPORTS' | 'ACTIVITY' | 'OTHER';
  title: string;
  formDescription: string;
  fields: FormTemplateField[];
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'general-field-trip',
    name: 'General Field Trip',
    description: 'Standard field trip with emergency contact, allergies, and photo permission',
    icon: '🚌',
    eventType: 'FIELD_TRIP',
    title: 'Field Trip Permission Form',
    formDescription:
      'Your child has been invited to participate in an upcoming field trip. Please review the details below and provide your consent by signing this form. Students must have a signed permission form to attend.',
    fields: [
      { fieldType: 'text', label: 'Emergency Contact Name', required: true, order: 1 },
      { fieldType: 'text', label: 'Emergency Contact Phone Number', required: true, order: 2 },
      {
        fieldType: 'textarea',
        label: 'Allergies or Medical Conditions',
        required: false,
        order: 3,
      },
      {
        fieldType: 'checkbox',
        label: 'I give permission for my child to be photographed during this trip',
        required: false,
        order: 4,
      },
    ],
  },
  {
    id: 'sports-event',
    name: 'Sports Event',
    description: 'Athletic event with emergency contact, equipment, and medical info',
    icon: '⚽',
    eventType: 'SPORTS',
    title: 'Sports Event Permission Form',
    formDescription:
      'Your child has been selected to participate in an upcoming sports event. Please provide the required information and your consent. Students must wear appropriate athletic footwear and clothing.',
    fields: [
      { fieldType: 'text', label: 'Emergency Contact Name', required: true, order: 1 },
      { fieldType: 'text', label: 'Emergency Contact Phone Number', required: true, order: 2 },
      {
        fieldType: 'checkbox',
        label: 'My child will have appropriate athletic shoes and clothing',
        required: true,
        order: 3,
      },
      {
        fieldType: 'textarea',
        label: 'Medical Conditions or Physical Limitations',
        required: false,
        order: 4,
      },
    ],
  },
  {
    id: 'swimming-water',
    name: 'Swimming / Water Activity',
    description: 'Water activity with swimming ability, emergency contact, and medical info',
    icon: '🏊',
    eventType: 'ACTIVITY',
    title: 'Swimming & Water Activity Permission Form',
    formDescription:
      'Your child will be participating in a water-based activity. For safety purposes, please provide accurate information about their swimming ability and any relevant medical conditions. All activities will be supervised by certified lifeguards.',
    fields: [
      { fieldType: 'text', label: 'Emergency Contact Name', required: true, order: 1 },
      { fieldType: 'text', label: 'Emergency Contact Phone Number', required: true, order: 2 },
      {
        fieldType: 'text',
        label: 'Swimming Ability (Non-swimmer / Beginner / Intermediate / Strong)',
        required: true,
        order: 3,
      },
      {
        fieldType: 'textarea',
        label: 'Medical Conditions (ear infections, seizures, etc.)',
        required: false,
        order: 4,
      },
      {
        fieldType: 'checkbox',
        label: 'My child has a swimsuit and towel',
        required: true,
        order: 5,
      },
    ],
  },
  {
    id: 'science-lab',
    name: 'Science Lab Activity',
    description: 'Lab activity with safety acknowledgment and allergy information',
    icon: '🔬',
    eventType: 'ACTIVITY',
    title: 'Science Lab Activity Permission Form',
    formDescription:
      'Your child will be participating in a hands-on science lab activity. Students will follow proper safety procedures and wear protective equipment provided by the school. Please review the details and provide your consent.',
    fields: [
      {
        fieldType: 'checkbox',
        label:
          'I acknowledge that my child will be handling lab materials and will follow all safety instructions',
        required: true,
        order: 1,
      },
      {
        fieldType: 'textarea',
        label: 'Chemical Allergies or Sensitivities (latex, specific compounds, etc.)',
        required: false,
        order: 2,
      },
      { fieldType: 'text', label: 'Emergency Contact Phone Number', required: true, order: 3 },
    ],
  },
  {
    id: 'overnight-trip',
    name: 'Overnight Trip',
    description:
      'Multi-day trip with two emergency contacts, medications, dietary needs, and insurance',
    icon: '🏕️',
    eventType: 'FIELD_TRIP',
    title: 'Overnight Trip Permission Form',
    formDescription:
      'Your child is invited to participate in an overnight trip. This requires additional information for safety and planning purposes. Please complete all fields carefully. A detailed itinerary and packing list will be provided separately.',
    fields: [
      { fieldType: 'text', label: 'Primary Emergency Contact Name', required: true, order: 1 },
      { fieldType: 'text', label: 'Primary Emergency Contact Phone', required: true, order: 2 },
      { fieldType: 'text', label: 'Secondary Emergency Contact Name', required: true, order: 3 },
      { fieldType: 'text', label: 'Secondary Emergency Contact Phone', required: true, order: 4 },
      {
        fieldType: 'textarea',
        label: 'Current Medications (name, dosage, schedule)',
        required: false,
        order: 5,
      },
      {
        fieldType: 'textarea',
        label: 'Dietary Restrictions or Food Allergies',
        required: false,
        order: 6,
      },
      {
        fieldType: 'text',
        label: 'Health Insurance Provider & Policy Number',
        required: true,
        order: 7,
      },
      {
        fieldType: 'checkbox',
        label: 'I authorize school staff to seek emergency medical treatment if needed',
        required: true,
        order: 8,
      },
    ],
  },
  {
    id: 'technology-device',
    name: 'Technology / Device Use',
    description: 'Acceptable use policy acknowledgment for devices or online tools',
    icon: '💻',
    eventType: 'OTHER',
    title: 'Technology & Device Use Agreement',
    formDescription:
      'Your child will be using technology devices or online tools as part of their learning. This form outlines the acceptable use policy. By signing, you acknowledge that your child will use these resources responsibly and in accordance with school guidelines.',
    fields: [
      {
        fieldType: 'checkbox',
        label:
          'I have reviewed the acceptable use policy with my child and they understand the expectations',
        required: true,
        order: 1,
      },
      {
        fieldType: 'checkbox',
        label: 'I understand that the school may monitor device and internet usage',
        required: true,
        order: 2,
      },
      {
        fieldType: 'checkbox',
        label: 'I agree that my child is responsible for the care of any borrowed equipment',
        required: true,
        order: 3,
      },
    ],
  },
  {
    id: 'photo-media-release',
    name: 'Photo / Media Release',
    description: 'Consent for photos, social media, print materials, and video',
    icon: '📸',
    eventType: 'OTHER',
    title: 'Photo & Media Release Form',
    formDescription:
      'The school occasionally photographs and records students for educational purposes, school publications, and promotional materials. Please indicate your preferences for how images of your child may be used.',
    fields: [
      {
        fieldType: 'checkbox',
        label: 'I consent to my child being photographed for school use',
        required: false,
        order: 1,
      },
      {
        fieldType: 'checkbox',
        label: 'I consent to photos being used on the school website and social media',
        required: false,
        order: 2,
      },
      {
        fieldType: 'checkbox',
        label: 'I consent to photos being used in printed materials (newsletters, yearbook)',
        required: false,
        order: 3,
      },
      {
        fieldType: 'checkbox',
        label: 'I consent to video recording for educational or promotional purposes',
        required: false,
        order: 4,
      },
    ],
  },
  {
    id: 'medical-health-screening',
    name: 'Medical / Health Screening',
    description: 'Health screening consent with conditions, insurance, and physician info',
    icon: '🏥',
    eventType: 'OTHER',
    title: 'Medical & Health Screening Consent Form',
    formDescription:
      'The school is conducting a health screening for students. This may include vision, hearing, BMI, or other standard assessments. Please provide the required health information and your consent for your child to participate.',
    fields: [
      {
        fieldType: 'textarea',
        label: 'Known Health Conditions or Current Medications',
        required: false,
        order: 1,
      },
      { fieldType: 'text', label: 'Health Insurance Provider', required: true, order: 2 },
      { fieldType: 'text', label: 'Insurance Policy Number', required: true, order: 3 },
      { fieldType: 'text', label: 'Primary Care Physician Name', required: false, order: 4 },
      { fieldType: 'text', label: 'Physician Phone Number', required: false, order: 5 },
      {
        fieldType: 'checkbox',
        label: 'I consent to my child participating in this health screening',
        required: true,
        order: 6,
      },
    ],
  },
];
