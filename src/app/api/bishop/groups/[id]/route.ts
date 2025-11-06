import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Group } from '@/lib/models/Group';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

// DELETE a group
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();

    // Find the group
    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Remove group reference from all users in this group
    await User.updateMany(
      { group: id },
      { $unset: { group: 1 } }
    );

    // Delete the group
    await Group.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Delete group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}

// PUT update a group
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name, leaderId } = await request.json();

    await dbConnect();

    // Find the group
    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Update group details
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { name, leader: leaderId },
      { new: true }
    ).populate('leader', 'name email');

    // If leader changed, update leader's group reference
    if (leaderId && leaderId !== group.leader?.toString()) {
      // Remove old leader's group reference
      if (group.leader) {
        await User.findByIdAndUpdate(group.leader, { $unset: { group: 1 } });
      }
      // Add new leader's group reference
      await User.findByIdAndUpdate(leaderId, { group: id });
    }

    return NextResponse.json({
      success: true,
      group: {
        _id: updatedGroup._id,
        name: updatedGroup.name,
        leader: updatedGroup.leader
      }
    });
  } catch (error: unknown) {
    console.error('Update group error:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}