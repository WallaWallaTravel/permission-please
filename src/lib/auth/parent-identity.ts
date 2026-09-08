export class ParentIdentityError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ParentIdentityError';
  }
}

type UserStore = {
  user: {
    findUnique: (args: { where: { email: string } }) => Promise<{
      id: string;
      email: string;
      name: string | null;
      role: string;
    } | null>;
    create: (args: {
      data: { email: string; name: string; role: 'PARENT'; schoolId: string | null };
    }) => Promise<{
      id: string;
      email: string;
      name: string | null;
      role: string;
    }>;
  };
};

/**
 * Reuse an existing PARENT by email, or create one.
 * Never attach a teacher/admin/reviewer account as a guardian.
 * One parent User may be linked to children at more than one school.
 */
export async function resolveOrCreateParent(
  db: UserStore,
  params: { email: string; name: string; schoolId: string | null }
) {
  const email = params.email.toLowerCase().trim();

  const existing = await db.user.findUnique({
    where: { email },
  });

  if (!existing) {
    const parent = await db.user.create({
      data: {
        email,
        name: params.name,
        role: 'PARENT',
        schoolId: params.schoolId,
      },
    });
    return { parent, created: true };
  }

  if (existing.role !== 'PARENT') {
    throw new ParentIdentityError(
      'That email belongs to a staff account, not a parent. Use a different email.'
    );
  }

  return { parent: existing, created: false };
}
