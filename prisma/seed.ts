import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      name: 'Ms. Johnson',
      password: await hash('password123', 10),
      role: 'TEACHER',
    },
  });
  console.log('✅ Created teacher:', teacher.email);

  // Create test parent 1
  const parent1 = await prisma.user.upsert({
    where: { email: 'parent1@test.com' },
    update: {},
    create: {
      email: 'parent1@test.com',
      name: 'John Smith',
      password: await hash('password123', 10),
      role: 'PARENT',
    },
  });
  console.log('✅ Created parent 1:', parent1.email);

  // Create test parent 2
  const parent2 = await prisma.user.upsert({
    where: { email: 'parent2@test.com' },
    update: {},
    create: {
      email: 'parent2@test.com',
      name: 'Sarah Williams',
      password: await hash('password123', 10),
      role: 'PARENT',
    },
  });
  console.log('✅ Created parent 2:', parent2.email);

  // Create test admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Principal Adams',
      password: await hash('password123', 10),
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin:', admin.email);

  // Create test students
  const student1 = await prisma.student.create({
    data: {
      name: 'Emma Smith',
      grade: '3rd Grade',
      parents: {
        create: {
          parentId: parent1.id,
          relationship: 'father',
        },
      },
    },
  });
  console.log('✅ Created student 1:', student1.name);

  const student2 = await prisma.student.create({
    data: {
      name: 'Liam Williams',
      grade: '3rd Grade',
      parents: {
        create: {
          parentId: parent2.id,
          relationship: 'mother',
        },
      },
    },
  });
  console.log('✅ Created student 2:', student2.name);

  const student3 = await prisma.student.create({
    data: {
      name: 'Olivia Johnson',
      grade: '4th Grade',
      parents: {
        create: {
          parentId: parent1.id,
          relationship: 'father',
        },
      },
    },
  });
  console.log('✅ Created student 3:', student3.name);

  // Create sample permission form
  const zooTripForm = await prisma.permissionForm.create({
    data: {
      teacherId: teacher.id,
      title: 'Zoo Field Trip',
      description:
        'Annual field trip to the City Zoo. Students will explore various animal exhibits and attend an educational presentation about wildlife conservation. Lunch will be provided. Please ensure your child wears comfortable walking shoes.',
      eventDate: new Date('2025-12-15T09:00:00'),
      eventType: 'FIELD_TRIP',
      deadline: new Date('2025-12-01T23:59:59'),
      status: 'ACTIVE',
      fields: {
        create: [
          {
            fieldType: 'text',
            label: 'Emergency Contact Number',
            required: true,
            order: 1,
          },
          {
            fieldType: 'checkbox',
            label: 'I give permission for my child to be photographed',
            required: false,
            order: 2,
          },
          {
            fieldType: 'text',
            label: 'Any allergies or medical conditions we should know about?',
            required: false,
            order: 3,
          },
        ],
      },
    },
  });
  console.log('✅ Created form:', zooTripForm.title);

  // Create another sample form
  const sportsForm = await prisma.permissionForm.create({
    data: {
      teacherId: teacher.id,
      title: 'Basketball Tournament',
      description:
        'Our class basketball team will be participating in the inter-school tournament. The tournament will be held at Lincoln Elementary. Transportation will be provided.',
      eventDate: new Date('2025-11-25T14:00:00'),
      eventType: 'SPORTS',
      deadline: new Date('2025-11-20T23:59:59'),
      status: 'ACTIVE',
      fields: {
        create: [
          {
            fieldType: 'text',
            label: 'Parent Contact Number',
            required: true,
            order: 1,
          },
          {
            fieldType: 'checkbox',
            label: 'My child has appropriate athletic shoes',
            required: true,
            order: 2,
          },
        ],
      },
    },
  });
  console.log('✅ Created form:', sportsForm.title);

  // Create a draft form
  const draftForm = await prisma.permissionForm.create({
    data: {
      teacherId: teacher.id,
      title: 'Science Museum Visit',
      description: 'Planning a visit to the Science Museum. Details to be finalized.',
      eventDate: new Date('2026-01-15T10:00:00'),
      eventType: 'FIELD_TRIP',
      deadline: new Date('2026-01-01T23:59:59'),
      status: 'DRAFT',
    },
  });
  console.log('✅ Created draft form:', draftForm.title);

  // Create a sample submission (parent1 signed for Emma)
  await prisma.formSubmission.create({
    data: {
      formId: zooTripForm.id,
      parentId: parent1.id,
      studentId: student1.id,
      signatureData:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      signedAt: new Date(),
      ipAddress: '127.0.0.1',
      status: 'SIGNED',
      responses: {
        create: [
          {
            fieldId: (await prisma.formField.findFirst({
              where: { formId: zooTripForm.id, order: 1 },
            }))!.id,
            response: '555-0123',
          },
          {
            fieldId: (await prisma.formField.findFirst({
              where: { formId: zooTripForm.id, order: 2 },
            }))!.id,
            response: 'true',
          },
          {
            fieldId: (await prisma.formField.findFirst({
              where: { formId: zooTripForm.id, order: 3 },
            }))!.id,
            response: 'Peanut allergy',
          },
        ],
      },
    },
  });
  console.log('✅ Created sample submission');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Test Accounts Created:');
  console.log('━'.repeat(50));
  console.log('Teacher: teacher@test.com / password123');
  console.log('Parent 1: parent1@test.com / password123');
  console.log('Parent 2: parent2@test.com / password123');
  console.log('Admin: admin@test.com / password123');
  console.log('━'.repeat(50));
  console.log('\n👥 Students: Emma Smith, Liam Williams, Olivia Johnson');
  console.log('📋 Forms: 2 active, 1 draft');
  console.log('✍️  Signatures: 1 completed');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
