import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Notification } from '@/lib/models/Notification';

// Mark a notification as read
export async function PATCH(
  request: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    // Authentication (all roles can update their notifications)
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = params;
    await dbConnect();

    // Find the notification and verify it belongs to the user
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.recipient.toString() !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this notification' },
        { status: 403 }
      );
    }

    // Mark as read
    notification.isRead = true;
    await notification.save();

    return NextResponse.json({
      success: true,
      data: {
        notification,
      },
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Notification update error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// Delete a notification
export async function DELETE(
  request: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    // Authentication (all roles can delete their notifications)
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = params;
    await dbConnect();

    // Find the notification and verify it belongs to the user
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.recipient.toString() !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this notification' },
        { status: 403 }
      );
    }

    // Delete the notification
    await Notification.findByIdAndDelete(notificationId);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Notification deletion error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}