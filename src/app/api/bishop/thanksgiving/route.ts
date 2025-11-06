import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Thanksgiving } from '@/lib/models/Thanksgiving';
import { User } from '@/lib/models/User';

// GET all thanksgiving messages for Bishop
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const thanksgivingMessages = await Thanksgiving.find({ isActive: true })
      .populate('member', 'name email phone')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: thanksgivingMessages.length,
      pending: thanksgivingMessages.filter(t => t.status === 'pending').length,
      inProgress: thanksgivingMessages.filter(t => t.status === 'in-progress').length,
      acknowledged: thanksgivingMessages.filter(t => t.status === 'acknowledged').length,
      urgent: thanksgivingMessages.filter(t => t.priority === 'urgent').length,
      byCategory: thanksgivingMessages.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        thanksgivingMessages,
        stats
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching bishop thanksgiving messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thanksgiving messages' },
      { status: 500 }
    );
  }
}
