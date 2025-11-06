import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Visitor } from '@/lib/models/Visitor';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET specific protocol team details
export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    await dbConnect();

    // Get team details
    const team = await ProtocolTeam.findById(teamId)
      .populate('leader', 'name email phone')
      .populate('members', 'name email phone')
      .populate('createdBy', 'name email');

    if (!team) {
      return NextResponse.json({ error: 'Protocol team not found' }, { status: 404 });
    }

    // Get team statistics
    const totalVisitors = await Visitor.countDocuments({ protocolTeam: teamId });
    const joiningVisitors = await Visitor.countDocuments({ 
      protocolTeam: teamId, 
      status: 'joining' 
    });
    const activeMonitoring = await Visitor.countDocuments({ 
      protocolTeam: teamId, 
      monitoringStatus: 'active' 
    });
    const convertedMembers = await Visitor.countDocuments({ 
      protocolTeam: teamId, 
      monitoringStatus: 'converted-to-member' 
    });

    const conversionRate = joiningVisitors > 0 ? Math.round((convertedMembers / joiningVisitors) * 100) : 0;

    // Get recent visitors for this team
    const visitors = await Visitor.find({ protocolTeam: teamId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('name email status monitoringStatus attendanceRate daysRemaining createdAt');

    return NextResponse.json({
      success: true,
      data: {
        ...team.toObject(),
        stats: {
          totalVisitors,
          joiningVisitors,
          activeMonitoring,
          convertedMembers,
          conversionRate
        },
        visitors
      }
    });
  } catch (error: unknown) {
    console.error('Protocol team details fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team details' },
      { status: 500 }
    );
  }
}

// PUT update protocol team
export async function PUT(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    const { name, description, responsibilities } = await request.json();

    await dbConnect();

    const team = await ProtocolTeam.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Protocol team not found' }, { status: 404 });
    }

    // Update team details
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (responsibilities) team.responsibilities = responsibilities;

    await team.save();

    return NextResponse.json({
      success: true,
      data: team,
      message: 'Protocol team updated successfully'
    });
  } catch (error: unknown) {
    console.error('Protocol team update error:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE protocol team
export async function DELETE(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;
    await dbConnect();

    const team = await ProtocolTeam.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Protocol team not found' }, { status: 404 });
    }

    // Check if team has active visitors
    const activeVisitors = await Visitor.countDocuments({ 
      protocolTeam: teamId, 
      monitoringStatus: 'active' 
    });

    if (activeVisitors > 0) {
      return NextResponse.json({ 
        error: `Cannot delete team with ${activeVisitors} active visitors. Please reassign them first.` 
      }, { status: 400 });
    }

    // Soft delete - mark as inactive instead of deleting
    team.isActive = false;
    await team.save();

    return NextResponse.json({
      success: true,
      message: 'Protocol team deactivated successfully'
    });
  } catch (error: unknown) {
    console.error('Protocol team deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
