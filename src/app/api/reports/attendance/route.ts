import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Parser } from 'json2csv';

export async function GET(request: Request) {
  try {
    // Authentication - only bishops and leaders can generate reports
    const { user } = await requireSessionAndRoles(request, ['bishop', 'leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') 
      ? new Date(url.searchParams.get('startDate') as string) 
      : new Date(new Date().setDate(new Date().getDate() - 30)); // Default to last 30 days
    const endDate = url.searchParams.get('endDate') 
      ? new Date(url.searchParams.get('endDate') as string) 
      : new Date();
    const groupId = url.searchParams.get('groupId');
    const format = url.searchParams.get('format') || 'json';
    const reportType = url.searchParams.get('type') || 'summary';

    await dbConnect();

    // Determine which groups to include based on user role
    let groupIds: string[] = [];
    
    if (user.role === 'bishop') {
      if (groupId) {
        // Bishop can request report for a specific group
        groupIds = [groupId];
      } else {
        // Bishop can see all groups
        const groups = await Group.find().select('_id');
        groupIds = groups.map(group => group._id.toString());
      }
    } else if (user.role === 'leader') {
      // Leader can only see their own group
      const leader = await User.findById(user.id);
      if (!leader || !leader.group) {
        return NextResponse.json({ 
          error: 'Leader does not have an assigned group' 
        }, { status: 400 });
      }
      groupIds = [leader.group.toString()];
      
      // If groupId is specified, ensure it matches the leader's group
      if (groupId && groupId !== leader.group.toString()) {
        return NextResponse.json({ 
          error: 'You do not have permission to access this group' 
        }, { status: 403 });
      }
    }

    // Date filter for queries
    const dateFilter = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Generate the appropriate report based on type
    let reportData;
    
    if (reportType === 'summary') {
      reportData = await generateSummaryReport(groupIds, dateFilter);
    } else if (reportType === 'detailed') {
      reportData = await generateDetailedReport(groupIds, dateFilter);
    } else if (reportType === 'member') {
      reportData = await generateMemberReport(groupIds, dateFilter);
    } else {
      return NextResponse.json({ 
        error: 'Invalid report type' 
      }, { status: 400 });
    }

    // Return the report in the requested format
    if (format === 'csv') {
      const fields = Object.keys(reportData[0] || {});
      const parser = new Parser({ fields });
      const csv = parser.parse(reportData);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: reportData
      });
    }
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Report generation error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// Helper function to generate a summary report
async function generateSummaryReport(groupIds: string[], dateFilter: any) {
  // Get all groups
  const groups = await Group.find({
    _id: { $in: groupIds }
  }).populate('leader', 'name email');

  // Generate summary for each group
  const summaryData = await Promise.all(
    groups.map(async (group) => {
      // Get attendance records for this group
      const attendanceRecords = await Attendance.find({
        group: group._id,
        ...dateFilter
      });

      // Calculate attendance statistics
      let totalPresent = 0;
      let totalExpected = 0;

      attendanceRecords.forEach((record) => {
        totalPresent += record.presentMembers?.length || 0;
        totalExpected +=
          (record.presentMembers?.length || 0) +
          (record.absentMembers?.length || 0);
      });

      const attendanceRate =
        totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;

      // Get event count
      const eventCount = await Event.countDocuments({
        group: group._id,
        ...dateFilter
      });

      // Get member count
      const memberCount = await User.countDocuments({
        group: group._id,
        role: 'member'
      });

      return {
        groupId: group._id.toString(),
        groupName: group.name,
        leaderName: group.leader ? group.leader.name : 'No Leader',
        leaderEmail: group.leader ? group.leader.email : 'N/A',
        memberCount,
        eventCount,
        attendanceRecordCount: attendanceRecords.length,
        totalPresent,
        totalExpected,
        attendanceRate: `${attendanceRate}%`,
        reportPeriod: `${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}`
      };
    })
  );

  return summaryData;
}

// Helper function to generate a detailed report
async function generateDetailedReport(groupIds: string[], dateFilter: any) {
  // Get all attendance records for the specified groups
  const attendanceRecords = await Attendance.find({
    group: { $in: groupIds },
    ...dateFilter
  })
    .populate('group', 'name')
    .populate('event', 'title date')
    .populate('recordedBy', 'name')
    .sort({ date: -1 });

  // Transform into report format
  const detailedData = attendanceRecords.map(record => {
    return {
      date: record.date.toLocaleDateString(),
      groupName: (record.group as any).name,
      eventTitle: record.event ? (record.event as any).title : 'N/A',
      eventDate: record.event ? (record.event as any).date.toLocaleDateString() : 'N/A',
      presentCount: record.presentMembers.length,
      absentCount: record.absentMembers.length,
      attendanceRate: `${Math.round((record.presentMembers.length / (record.presentMembers.length + record.absentMembers.length)) * 100)}%`,
      recordedBy: (record.recordedBy as any).name,
      notes: record.notes || 'N/A'
    };
  });

  return detailedData;
}

// Helper function to generate a member-focused report
async function generateMemberReport(groupIds: string[], dateFilter: any) {
  // Get all members in the specified groups
  const members = await User.find({
    group: { $in: groupIds },
    role: 'member'
  }).populate('group', 'name');

  // Get all attendance records for the specified groups
  const attendanceRecords = await Attendance.find({
    group: { $in: groupIds },
    ...dateFilter
  });

  // Calculate attendance for each member
  const memberData = await Promise.all(
    members.map(async (member) => {
      let presentCount = 0;
      let totalCount = 0;

      attendanceRecords.forEach(record => {
        const isPresentInRecord = record.presentMembers.some(
          id => id.toString() === member._id.toString()
        );
        const isAbsentInRecord = record.absentMembers.some(
          id => id.toString() === member._id.toString()
        );

        if (isPresentInRecord || isAbsentInRecord) {
          totalCount++;
          if (isPresentInRecord) presentCount++;
        }
      });

      const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      return {
        memberId: member._id.toString(),
        memberName: member.name,
        memberEmail: member.email,
        groupName: member.group.name,
        eventsAttended: presentCount,
        eventsAbsent: totalCount - presentCount,
        totalEvents: totalCount,
        attendanceRate: `${attendanceRate}%`,
        reportPeriod: `${dateFilter.date.$gte.toLocaleDateString()} to ${dateFilter.date.$lte.toLocaleDateString()}`
      };
    })
  );

  return memberData;
}