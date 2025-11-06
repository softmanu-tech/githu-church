import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/lib/models/User";
import { Group } from "@/lib/models/Group";
import { Attendance } from "@/lib/models/Attendance";
import Event from "@/lib/models/Event";
import { requireSessionAndRoles } from "@/lib/authMiddleware";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { user } = await requireSessionAndRoles(request, ["bishop"]);
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const type = url.searchParams.get("type") || "groups"; // groups, events, members

    let dateFilter = {};
    if (from || to) {
      dateFilter = {
        date: {
          ...(from ? { $gte: new Date(from) } : {}),
          ...(to ? { $lte: new Date(to) } : {}),
        },
      };
    }

    // Get all attendance records within date range
    const attendanceRecords = await Attendance.find(dateFilter)
      .populate("group", "name")
      .populate("event", "title date")
      .populate("presentMembers", "name email")
      .populate("absentMembers", "name email")
      .lean();

    let analyticsData = {};

    if (type === "groups") {
      // Group analytics - which groups have highest attendance rates
      const groups = await Group.find().populate("leader", "name email").lean();
      
      const groupAnalytics = groups.map(group => {
        const groupAttendance = attendanceRecords.filter(
          record => record.group._id.toString() === (group._id as any).toString()
        );
        
        const totalPresent = groupAttendance.reduce(
          (sum, record) => sum + (record.presentMembers?.length || 0), 0
        );
        const totalAbsent = groupAttendance.reduce(
          (sum, record) => sum + (record.absentMembers?.length || 0), 0
        );
        const totalAttendees = totalPresent + totalAbsent;
        const attendanceRate = totalAttendees > 0 
          ? (totalPresent / totalAttendees) * 100 
          : 0;
        
        return {
          groupId: (group._id as any).toString(),
          groupName: group.name,
          leaderName: group.leader?.name || "Unassigned",
          totalAttendanceRecords: groupAttendance.length,
          presentCount: totalPresent,
          absentCount: totalAbsent,
          attendanceRate: Math.round(attendanceRate)
        };
      });
      
      // Sort by attendance rate (highest first)
      analyticsData = {
        groupAnalytics: groupAnalytics.sort((a, b) => b.attendanceRate - a.attendanceRate)
      };
    } 
    else if (type === "events") {
      // Event analytics - which events had highest turnout
      const events = await Event.find(dateFilter)
        .populate("group", "name")
        .populate("createdBy", "name email")
        .lean();
      
      const eventAnalytics = events.map(event => {
        const eventAttendance = attendanceRecords.find(
          record => record.event && record.event._id.toString() === event._id.toString()
        );
        
        const presentCount = eventAttendance?.presentMembers?.length || 0;
        const absentCount = eventAttendance?.absentMembers?.length || 0;
        const totalCount = presentCount + absentCount;
        const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
        
        return {
          eventId: event._id.toString(),
          title: event.title,
          date: event.date,
          groupName: (event.group as any)?.name || "Unknown",
          presentCount,
          absentCount,
          attendanceRate: Math.round(attendanceRate),
          createdBy: (event.createdBy as any)?.name || "Unknown"
        };
      });
      
      // Sort by attendance rate (highest first)
      analyticsData = {
        eventAnalytics: eventAnalytics.sort((a, b) => b.attendanceRate - a.attendanceRate)
      };
    }
    else if (type === "members") {
      // Member analytics - which members have highest/lowest attendance
      const members = await User.find({ role: "member" })
        .populate("group", "name")
        .lean();
      
      const memberAnalytics = members.map(member => {
        const presentCount = attendanceRecords.filter(record => 
          record.presentMembers.some(m => m._id.toString() === (member._id as any).toString())
        ).length;
        
        const absentCount = attendanceRecords.filter(record => 
          record.absentMembers.some(m => m._id.toString() === (member._id as any).toString())
        ).length;
        
        const totalEvents = presentCount + absentCount;
        const attendanceRate = totalEvents > 0 ? (presentCount / totalEvents) * 100 : 0;
        
        return {
          memberId: (member._id as any).toString(),
          name: member.name,
          email: member.email,
          groupName: (member.group as any)?.name || "Unassigned",
          presentCount,
          absentCount,
          totalEvents,
          attendanceRate: Math.round(attendanceRate)
        };
      });
      
      // Sort by attendance rate (highest first)
      analyticsData = {
        memberAnalytics: memberAnalytics.sort((a, b) => b.attendanceRate - a.attendanceRate)
      };
    }

    return NextResponse.json({
      success: true,
      filter: { from, to, type },
      analytics: analyticsData
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}