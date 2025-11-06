import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

// DELETE a leader
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();

    // Find the leader
    const leader = await User.findById(id);
    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    if (leader.role !== 'leader') {
      return NextResponse.json({ error: 'User is not a leader' }, { status: 400 });
    }

    // If leader has a group, remove the group's leader reference
    if (leader.group) {
      await Group.findByIdAndUpdate(leader.group, { $unset: { leader: 1 } });
    }

    // Delete the leader
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Leader deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Delete leader error:', error);
    return NextResponse.json(
      { error: 'Failed to delete leader' },
      { status: 500 }
    );
  }
}

// PUT update a leader
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authentication check
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name, email, groupId } = await request.json();

    await dbConnect();

    // Find the leader
    const leader = await User.findById(id);
    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    if (leader.role !== 'leader') {
      return NextResponse.json({ error: 'User is not a leader' }, { status: 400 });
    }

    // Update leader details
    const updatedLeader = await User.findByIdAndUpdate(
      id,
      { name, email, group: groupId },
      { new: true }
    ).populate('group', 'name');

    // If group changed, update group's leader reference
    if (groupId && groupId !== leader.group?.toString()) {
      // Remove old group's leader reference
      if (leader.group) {
        await Group.findByIdAndUpdate(leader.group, { $unset: { leader: 1 } });
      }
      // Add new group's leader reference
      await Group.findByIdAndUpdate(groupId, { leader: id });
    }

    return NextResponse.json({
      success: true,
      leader: {
        _id: updatedLeader._id,
        name: updatedLeader.name,
        email: updatedLeader.email,
        group: updatedLeader.group
      }
    });
  } catch (error: unknown) {
    console.error('Update leader error:', error);
    return NextResponse.json(
      { error: 'Failed to update leader' },
      { status: 500 }
    );
  }
}