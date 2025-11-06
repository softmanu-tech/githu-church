import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/lib/models/User";
import { Group } from "@/lib/models/Group";
import { Attendance } from "@/lib/models/Attendance";
import Event from "@/lib/models/Event";
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    // Strict Authentication
    const { user } = await requireSessionAndRoles(request, ["bishop"]);
    if (!user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate")
      ? new Date(url.searchParams.get("startDate") as string)
      : new Date(new Date().setDate(new Date().getDate() - 90)); // Default to last 90 days
    const endDate = url.searchParams.get("endDate")
      ? new Date(url.searchParams.get("endDate") as string)
      : new Date();
    const groupId = url.searchParams.get("groupId");

    // Date filter for queries
    const dateFilter = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Get all groups or a specific group
    const groupQuery = groupId ? { _id: groupId } : {};
    const groups = await Group.find(groupQuery)
      .populate("leader", "name email")
      .lean();

    // Get detailed performance data for each group
    const groupPerformance = await Promise.all(
      groups.map(async (group) => {
        // Get members in this group
        const members = await User.find({ group: group._id, role: "member" })
          .select("_id name email")
          .lean();

        // Get events for this group in the date range
        const events = await Event.find({
          group: group._id,
          ...dateFilter,
        })
          .sort({ date: -1 })
          .lean();

        // Get attendance records for this group in the date range
        const attendanceRecords = await Attendance.find({
          group: group._id,
          ...dateFilter,
        })
          .populate("event", "title date")
          .sort({ date: -1 })
          .lean();

        // Calculate overall attendance rate
        let totalPresent = 0;
        let totalExpected = 0;

        attendanceRecords.forEach((record) => {
          totalPresent += record.presentMembers?.length || 0;
          totalExpected +=
            (record.presentMembers?.length || 0) +
            (record.absentMembers?.length || 0);
        });

        const attendanceRate =
          totalExpected > 0 ? (totalPresent / totalExpected) * 100 : 0;

        // Calculate attendance trend (comparing first half to second half of period)
        const sortedRecords = [...attendanceRecords].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let trend = "stable";
        if (sortedRecords.length >= 4) {
          const midpoint = Math.floor(sortedRecords.length / 2);
          const firstHalf = sortedRecords.slice(0, midpoint);
          const secondHalf = sortedRecords.slice(midpoint);

          let firstHalfPresent = 0;
          let firstHalfTotal = 0;
          let secondHalfPresent = 0;
          let secondHalfTotal = 0;

          firstHalf.forEach((record) => {
            firstHalfPresent += record.presentMembers?.length || 0;
            firstHalfTotal +=
              (record.presentMembers?.length || 0) +
              (record.absentMembers?.length || 0);
          });

          secondHalf.forEach((record) => {
            secondHalfPresent += record.presentMembers?.length || 0;
            secondHalfTotal +=
              (record.presentMembers?.length || 0) +
              (record.absentMembers?.length || 0);
          });

          const firstHalfRate =
            firstHalfTotal > 0 ? (firstHalfPresent / firstHalfTotal) * 100 : 0;
          const secondHalfRate =
            secondHalfTotal > 0
              ? (secondHalfPresent / secondHalfTotal) * 100
              : 0;

          const difference = secondHalfRate - firstHalfRate;
          if (difference >= 10) trend = "improving";
          else if (difference <= -10) trend = "declining";
        }

        // Calculate member attendance consistency
        const memberAttendance = members.map((member) => {
          let present = 0;
          let total = 0;

          attendanceRecords.forEach((record) => {
            const isPresentInRecord = record.presentMembers?.some(
              (id) => id.toString() === (member._id as any).toString()
            );
            const isAbsentInRecord = record.absentMembers?.some(
              (id) => id.toString() === (member._id as any).toString()
            );

            if (isPresentInRecord || isAbsentInRecord) {
              total++;
              if (isPresentInRecord) present++;
            }
          });

          return {
            member: {
              _id: member._id,
              name: member.name,
              email: member.email,
            },
            attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
            eventsAttended: present,
            totalEvents: total,
          };
        });

        // Sort members by attendance rate (highest to lowest)
        memberAttendance.sort((a, b) => b.attendanceRate - a.attendanceRate);

        // Calculate monthly attendance patterns
        const monthlyPatterns = calculateMonthlyPatterns(attendanceRecords);

        return {
          group: {
            _id: group._id,
            name: group.name,
            leader: group.leader,
          },
          stats: {
            memberCount: members.length,
            eventCount: events.length,
            attendanceRecordCount: attendanceRecords.length,
            overallAttendanceRate: Math.round(attendanceRate),
            trend,
          },
          memberAttendance: memberAttendance,
          monthlyPatterns,
          recentEvents: events.slice(0, 5).map((event) => ({
            _id: event._id,
            title: event.title,
            date: event.date,
            attendanceRate: calculateEventAttendanceRate(
              event._id,
              attendanceRecords
            ),
          })),
        };
      })
    );

    // Sort groups by attendance rate (highest to lowest)
    groupPerformance.sort(
      (a, b) => b.stats.overallAttendanceRate - a.stats.overallAttendanceRate
    );

    return NextResponse.json({
      success: true,
      data: {
        dateRange: {
          startDate,
          endDate,
        },
        groupPerformance,
      },
    });
  } catch (error: unknown) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === "string") {
      errorMsg = error;
    }
    console.error("Group performance analysis error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// Helper function to calculate event attendance rate
function calculateEventAttendanceRate(
  eventId: Types.ObjectId,
  attendanceRecords: any[]
) {
  const eventAttendance = attendanceRecords.find(
    (record) =>
      record.event && record.event._id.toString() === eventId.toString()
  );

  if (!eventAttendance) return 0;

  const totalMembers =
    (eventAttendance.presentMembers?.length || 0) +
    (eventAttendance.absentMembers?.length || 0);

  return totalMembers > 0
    ? Math.round(
        ((eventAttendance.presentMembers?.length || 0) / totalMembers) * 100
      )
    : 0;
}

// Helper function to calculate monthly attendance patterns
function calculateMonthlyPatterns(attendanceRecords: any[]) {
  const monthlyData: Record<string, { present: number; total: number }> = {};

  attendanceRecords.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { present: 0, total: 0 };
    }

    monthlyData[monthKey].present += record.presentMembers?.length || 0;
    monthlyData[monthKey].total +=
      (record.presentMembers?.length || 0) +
      (record.absentMembers?.length || 0);
  });

  return Object.entries(monthlyData)
    .map(([month, data]) => {
      const [year, monthNum] = month.split("-");
      const monthName = new Date(
        parseInt(year),
        parseInt(monthNum) - 1,
        1
      ).toLocaleString("default", { month: "long" });

      return {
        month: `${monthName} ${year}`,
        attendanceRate:
          data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        presentCount: data.present,
        totalCount: data.total,
      };
    })
    .sort((a, b) => {
      const [aMonthName, aYear] = a.month.split(" ");
      const [bMonthName, bYear] = b.month.split(" ");

      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);

      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return months.indexOf(aMonthName) - months.indexOf(bMonthName);
    });
}