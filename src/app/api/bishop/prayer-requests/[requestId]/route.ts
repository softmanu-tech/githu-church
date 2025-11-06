import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { PrayerRequest } from '@/lib/models/PrayerRequest';

// PUT update prayer request
export async function PUT(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;
    const { status, bishopNotes } = await request.json();

    await dbConnect();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (bishopNotes !== undefined) updateData.bishopNotes = bishopNotes;
    
    // If marking as answered, set answered date
    if (status === 'answered') {
      updateData.answeredDate = new Date();
    }

    const prayerRequest = await PrayerRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    ).populate('member', 'name email phone');

    if (!prayerRequest) {
      return NextResponse.json({ error: 'Prayer request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prayer request updated successfully',
      data: {
        _id: prayerRequest._id,
        status: prayerRequest.status,
        bishopNotes: prayerRequest.bishopNotes,
        answeredDate: prayerRequest.answeredDate
      }
    });
  } catch (error: unknown) {
    console.error('Update prayer request error:', error);
    return NextResponse.json(
      { error: 'Failed to update prayer request' },
      { status: 500 }
    );
  }
}
