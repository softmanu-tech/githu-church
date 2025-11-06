import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Visitor } from '@/lib/models/Visitor';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET fetch visitor milestones
export async function GET(
  request: Request,
  { params }: { params: { visitorId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visitorId } = params;

    await dbConnect();

    // Get visitor with milestones
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Check if protocol member has access to this visitor
    if (visitor.assignedProtocolMember?.toString() !== user.id && 
        visitor.protocolTeam?.toString() !== (user as any).protocolTeam?.toString()) {
      return NextResponse.json({ error: 'Unauthorized to view this visitor' }, { status: 403 });
    }

    // Calculate monitoring progress
    const completedMilestones = visitor.milestones.filter((m: any) => m.completed).length;
    const monitoringProgress = Math.round((completedMilestones / 12) * 100);

    return NextResponse.json({
      success: true,
      data: {
        milestones: visitor.milestones,
        monitoringProgress,
        monitoringStatus: visitor.monitoringStatus,
        visitor: {
          id: visitor._id,
          name: visitor.name,
          type: visitor.type,
          monitoringStartDate: visitor.monitoringStartDate,
          monitoringEndDate: visitor.monitoringEndDate
        }
      }
    });
  } catch (error: unknown) {
    console.error('Fetch visitor milestones error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

// PUT update visitor milestone
export async function PUT(
  request: Request,
  { params }: { params: { visitorId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visitorId } = params;
    const { week, completed, notes } = await request.json();

    await dbConnect();

    // Validate inputs
    if (!week || week < 1 || week > 12) {
      return NextResponse.json({ 
        error: 'Week must be between 1 and 12' 
      }, { status: 400 });
    }

    // Get visitor
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Check if protocol member has access to this visitor
    if (visitor.assignedProtocolMember?.toString() !== user.id && 
        visitor.protocolTeam?.toString() !== (user as any).protocolTeam?.toString()) {
      return NextResponse.json({ error: 'Unauthorized to update this visitor' }, { status: 403 });
    }

    // Find or create milestone
    let milestone = visitor.milestones.find((m: any) => m.week === week);
    
    if (milestone) {
      // Update existing milestone
      milestone.completed = completed;
      milestone.protocolMemberNotes = notes;
      if (completed && !milestone.completedDate) {
        milestone.completedDate = new Date();
      } else if (!completed) {
        milestone.completedDate = undefined;
      }
    } else {
      // Create new milestone
      visitor.milestones.push({
        week,
        completed,
        notes: '',
        protocolMemberNotes: notes,
        completedDate: completed ? new Date() : undefined
      });
    }

    // Calculate new monitoring progress
    const completedMilestones = visitor.milestones.filter((m: any) => m.completed).length;
    const monitoringProgress = Math.round((completedMilestones / 12) * 100);

    // Update visitor progress if significant change
    if (monitoringProgress >= 100 && visitor.monitoringStatus === 'active') {
      visitor.monitoringStatus = 'completed';
    }

    await visitor.save();

    return NextResponse.json({
      success: true,
      data: {
        milestone: milestone || visitor.milestones.find((m: any) => m.week === week),
        milestones: visitor.milestones,
        monitoringProgress,
        monitoringStatus: visitor.monitoringStatus
      },
      message: `Week ${week} milestone updated successfully`
    });
  } catch (error: unknown) {
    console.error('Update visitor milestone error:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}
