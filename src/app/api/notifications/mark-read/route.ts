import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Notification } from '@/lib/models/Notification';

export async function POST(request: Request) {
  try {
    let user;
    try {
      ({ user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']));
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let notificationIds: string[] | undefined;
    let markAll: boolean | undefined;
    try {
      ({ notificationIds, markAll } = await request.json());
    } catch {
      return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
    }
    await dbConnect();

    if (markAll) {
      // Mark all notifications as read
      await Notification.updateMany(
        { recipient: user.id, isRead: false },
        { isRead: true }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          recipient: user.id 
        },
        { isRead: true }
      );
    } else {
      return NextResponse.json({ 
        error: 'Either notificationIds or markAll must be provided' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Mark notifications read error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}