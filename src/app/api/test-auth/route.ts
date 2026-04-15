import { NextResponse } from 'next/server';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member', 'protocol', 'visitor']);
    return NextResponse.json({
      success: true,
      message: 'Authentication working',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
