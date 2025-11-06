import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Notification } from '@/lib/models/Notification';

// Get notifications for the current user
export async function GET(request: Request) {
  try {
    // Authenticate user (any role can access their notifications)
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    await dbConnect();

    // Build query
    const query: any = { recipient: user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: user.id,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      }
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Notifications retrieval error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Create a notification (for system use)
export async function POST(request: Request) {
  try {
    // Only allow bishop to create notifications
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId, type, title, message, relatedId } = await request.json();
    await dbConnect();

    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      relatedId,
      isRead: false
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Notification creation error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Mark notifications as read
export async function PUT(request: Request) {
  try {
    // Authentication - all roles can update their notifications
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds, markAll } = await request.json();
    await dbConnect();

    if (markAll) {
      // Mark all notifications as read
      await Notification.updateMany(
        { recipient: user.id },
        { isRead: true }
      );

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          recipient: user.id // Ensure user can only update their own notifications
        },
        { isRead: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read'
      });
    } else {
      return NextResponse.json({
        error: 'Either notificationIds or markAll must be provided'
      }, { status: 400 });
    }
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Notifications update error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
