import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{ token: string }>;
};

// GET /api/invite/[token] - Validate an invite token
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        school: {
          select: { id: true, name: true, subdomain: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 });
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        school: invite.school,
      },
    });
  } catch (error) {
    console.error('Error validating invite:', error);
    return NextResponse.json({ error: 'Failed to validate invite' }, { status: 500 });
  }
}
