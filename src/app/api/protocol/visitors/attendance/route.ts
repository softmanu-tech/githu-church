import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Visitor } from '@/lib/models/Visitor';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET fetch visitor attendance data
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all visitors for this protocol team
    const visitors = await Visitor.find({
      $or: [
        { assignedProtocolMember: user.id },
        { protocolTeam: (user as any).protocolTeam }
      ]
    });

    // Calculate attendance statistics
    const attendanceData = visitors.map((visitor: any) => {
      const totalVisits = visitor.visitHistory?.length || 0;
      const presentVisits = visitor.visitHistory?.filter((visit: any) => visit.attendanceStatus === 'present').length || 0;
      const attendanceRate = totalVisits > 0 ? Math.round((presentVisits / totalVisits) * 100) : 0;

      return {
        visitorId: visitor._id,
        name: visitor.name,
        email: visitor.email,
        type: visitor.type,
        status: visitor.status,
        totalVisits,
        presentVisits,
        attendanceRate,
        lastVisit: visitor.visitHistory?.length > 0 ? visitor.visitHistory[visitor.visitHistory.length - 1].date : null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        visitors: attendanceData,
        summary: {
          totalVisitors: visitors.length,
          averageAttendance: attendanceData.length > 0 
            ? Math.round(attendanceData.reduce((sum, v) => sum + v.attendanceRate, 0) / attendanceData.length)
            : 0
        }
      }
    });
  } catch (error: unknown) {
    console.error('Fetch visitor attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor attendance' },
      { status: 500 }
    );
  }
}

// POST record visitor attendance
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attendanceRecords, visitorId, eventType, attendanceStatus, notes, date } = await request.json();

    await dbConnect();

    // Handle multiple attendance records
    if (attendanceRecords && Array.isArray(attendanceRecords)) {
      const results = [];
      
      for (const record of attendanceRecords) {
        const visitor = await Visitor.findById(record.visitorId);
        if (!visitor) {
          console.error(`Visitor not found: ${record.visitorId}`);
          continue;
        }

        // Check if protocol member has access to this visitor
        if (visitor.assignedProtocolMember?.toString() !== user.id && 
            visitor.protocolTeam?.toString() !== (user as any).protocolTeam?.toString()) {
          console.error(`Unauthorized access to visitor: ${record.visitorId}`);
          continue;
        }

        // Initialize visit history if it doesn't exist
        if (!visitor.visitHistory) {
          visitor.visitHistory = [];
        }

        // Add new visit record
        visitor.visitHistory.push({
          date: record.date || new Date().toISOString(),
          eventType: record.eventType || 'Sunday Service',
          attendanceStatus: record.attendanceStatus || 'present',
          notes: record.notes || ''
        });

        // Calculate new attendance rate
        const totalVisits = visitor.visitHistory.length;
        const presentVisits = visitor.visitHistory.filter((visit: any) => visit.attendanceStatus === 'present').length;
        visitor.attendanceRate = totalVisits > 0 ? Math.round((presentVisits / totalVisits) * 100) : 0;

        // Auto-complete attendance-related milestones
        await updateAttendanceBasedMilestones(visitor, record.attendanceStatus);

        // Update monitoring status based on progress
        await updateMonitoringStatus(visitor);

        await visitor.save();
        
        results.push({
          visitorId: visitor._id,
          name: visitor.name,
          attendanceRate: visitor.attendanceRate
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          results,
          totalMarked: results.length
        },
        message: `Attendance recorded for ${results.length} visitors`
      });
    }

    // Handle single attendance record (backward compatibility)
    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
    }

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Check if protocol member has access to this visitor
    if (visitor.assignedProtocolMember?.toString() !== user.id && 
        visitor.protocolTeam?.toString() !== (user as any).protocolTeam?.toString()) {
      return NextResponse.json({ error: 'Unauthorized to update this visitor' }, { status: 403 });
    }

    // Initialize visit history if it doesn't exist
    if (!visitor.visitHistory) {
      visitor.visitHistory = [];
    }

    // Add new visit record
    visitor.visitHistory.push({
      date: date || new Date().toISOString(),
      eventType: eventType || 'Sunday Service',
      attendanceStatus: attendanceStatus || 'present',
      notes: notes || ''
    });

    // Calculate new attendance rate
    const totalVisits = visitor.visitHistory.length;
    const presentVisits = visitor.visitHistory.filter((visit: any) => visit.attendanceStatus === 'present').length;
    visitor.attendanceRate = totalVisits > 0 ? Math.round((presentVisits / totalVisits) * 100) : 0;

    // Auto-complete attendance-related milestones
    await updateAttendanceBasedMilestones(visitor, attendanceStatus);

    // Update monitoring status based on progress
    await updateMonitoringStatus(visitor);

    await visitor.save();

    return NextResponse.json({
      success: true,
      data: {
        visitHistory: visitor.visitHistory,
        attendanceRate: visitor.attendanceRate
      },
      message: 'Attendance recorded successfully'
    });
  } catch (error: unknown) {
    console.error('Record visitor attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
}

// Helper function to update milestones based on attendance
async function updateAttendanceBasedMilestones(visitor: any, attendanceStatus: string) {
  if (!visitor.milestones) {
    visitor.milestones = [];
  }

  // Define attendance-based milestone mappings
  const attendanceMilestones = {
    // Week 5: Attend Small Group (requires 2+ Sunday services)
    5: { minServices: 2, description: 'Attend Small Group' },
    // Week 7: Volunteer Opportunity (requires 4+ Sunday services)
    7: { minServices: 4, description: 'Volunteer Opportunity' },
    // Week 9: Regular Check-ins (requires 6+ Sunday services)
    9: { minServices: 6, description: 'Regular Check-ins' }
  };

  // Count Sunday services attended
  const sundayServicesAttended = visitor.visitHistory.filter((visit: any) => 
    visit.eventType === 'Sunday Service' && visit.attendanceStatus === 'present'
  ).length;

  // Check and auto-complete milestones based on attendance
  for (const [week, requirement] of Object.entries(attendanceMilestones)) {
    const weekNum = parseInt(week);
    
    if (sundayServicesAttended >= requirement.minServices) {
      // Find or create milestone
      let milestone = visitor.milestones.find((m: any) => m.week === weekNum);
      
      if (!milestone) {
        milestone = {
          week: weekNum,
          completed: false,
          notes: '',
          protocolMemberNotes: '',
          completedDate: undefined
        };
        visitor.milestones.push(milestone);
      }
      
      // Auto-complete if not already completed
      if (!milestone.completed) {
        milestone.completed = true;
        milestone.protocolMemberNotes = `Auto-completed: Attended ${sundayServicesAttended} Sunday services (minimum required: ${requirement.minServices})`;
        milestone.completedDate = new Date();
      }
    }
  }
}

// Helper function to update monitoring status based on overall progress
async function updateMonitoringStatus(visitor: any) {
  if (!visitor.milestones) return;

  // Calculate milestone progress
  const completedMilestones = visitor.milestones.filter((m: any) => m.completed).length;
  const milestoneProgress = Math.round((completedMilestones / 12) * 100);

  // Calculate attendance progress (weighted 30% of total progress)
  const attendanceProgress = Math.min(visitor.attendanceRate || 0, 100) * 0.3;
  
  // Calculate integration progress (weighted 20% of total progress)
  const integrationProgress = visitor.integrationProgress || 0;
  const integrationWeighted = integrationProgress * 0.2;

  // Calculate overall progress (milestones 50%, attendance 30%, integration 20%)
  const overallProgress = (milestoneProgress * 0.5) + attendanceProgress + integrationWeighted;

  // Update monitoring status based on progress and attendance patterns
  if (overallProgress >= 100 && visitor.monitoringStatus === 'active') {
    visitor.monitoringStatus = 'completed';
  } else if (visitor.attendanceRate < 30 && visitor.monitoringStatus === 'active') {
    // Flag for attention if attendance is very low
    visitor.monitoringStatus = 'needs-attention';
  } else if (visitor.monitoringStatus === 'needs-attention' && visitor.attendanceRate >= 50) {
    // Restore to active if attendance improves
    visitor.monitoringStatus = 'active';
  }

  // Update monitoring progress
  visitor.monitoringProgress = Math.round(overallProgress);
}