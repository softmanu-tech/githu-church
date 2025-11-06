import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Communication } from '@/lib/models/Communication';

export const dynamic = 'force-dynamic';

// PATCH - Mark communication as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader', 'member', 'protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const communicationId = params.id;

    if (!communicationId) {
      return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 });
    }

    // Check if already read
    const communication = await Communication.findById(communicationId);
    if (!communication) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    const alreadyRead = communication.readBy.some((read: any) => read.userId.toString() === user.id);
    
    if (!alreadyRead) {
      communication.readBy.push({
        userId: user.id,
        readAt: new Date()
      });
      await communication.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Communication marked as read'
    });
  } catch (error) {
    console.error('Error marking communication as read:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
