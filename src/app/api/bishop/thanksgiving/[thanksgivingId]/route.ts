import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Thanksgiving } from '@/lib/models/Thanksgiving';

// PUT update thanksgiving message status or bishop notes
export async function PUT(request: Request, { params }: { params: { thanksgivingId: string } }) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { thanksgivingId } = params;
    const { status, bishopNotes } = await request.json();

    const updateFields: any = {};
    if (status) {
      updateFields.status = status;
      if (status === 'acknowledged') {
        updateFields.acknowledgedDate = new Date();
      } else if (status === 'pending' || status === 'in-progress' || status === 'closed') {
        updateFields.acknowledgedDate = undefined; // Clear acknowledged date if status changes
      }
    }
    if (bishopNotes !== undefined) { // Allow setting to empty string
      updateFields.bishopNotes = bishopNotes;
    }

    const updatedThanksgiving = await Thanksgiving.findByIdAndUpdate(
      thanksgivingId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedThanksgiving) {
      return NextResponse.json({ error: 'Thanksgiving message not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thanksgiving message updated successfully',
      data: updatedThanksgiving,
    });
  } catch (error: unknown) {
    console.error('Error updating thanksgiving message:', error);
    return NextResponse.json(
      { error: 'Failed to update thanksgiving message' },
      { status: 500 }
    );
  }
}
