import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { PrayerRequest } from '@/lib/models/PrayerRequest';
import { User } from '@/lib/models/User';

// GET all prayer requests for Bishop
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all prayer requests with member details
    const prayerRequests = await PrayerRequest.find({ isActive: true })
      .populate('member', 'name email phone')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: prayerRequests.length,
      pending: prayerRequests.filter(r => r.status === 'pending').length,
      inProgress: prayerRequests.filter(r => r.status === 'in-progress').length,
      answered: prayerRequests.filter(r => r.status === 'answered').length,
      urgent: prayerRequests.filter(r => r.priority === 'urgent').length,
      byCategory: prayerRequests.reduce((acc, request) => {
        acc[request.category] = (acc[request.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        prayerRequests: prayerRequests.map(request => ({
          _id: request._id,
          member: {
            _id: request.member._id,
            name: request.member.name,
            email: request.member.email,
            phone: request.member.phone
          },
          title: request.title,
          description: request.description,
          category: request.category,
          priority: request.priority,
          status: request.status,
          isPrivate: request.isPrivate,
          createdAt: request.createdAt,
          bishopNotes: request.bishopNotes,
          answeredDate: request.answeredDate,
          tags: request.tags,
          daysSinceSubmission: request.daysSinceSubmission
        })),
        stats
      }
    });
  } catch (error: unknown) {
    console.error('Get bishop prayer requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayer requests' },
      { status: 500 }
    );
  }
}
