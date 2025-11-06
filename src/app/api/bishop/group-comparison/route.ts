import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/lib/models/User";
import { Group } from "@/lib/models/Group";
import { Attendance } from "@/lib/models/Attendance";
import Event from "@/lib/models/Event";
import { requireSessionAndRoles } from "@/lib/authMiddleware";

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
    
    // Date filter for queries
    const dateFilter = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Get all groups
    const groups = await Group.find()
      .populate("leader", "name email")
      .lean();

    // Get all attendance records in the date range
    const allAttendanceRecords = await Attendance.find(dateFilter).lean();

    // Calculate group comparison metrics
    const groupComparison = await Promise.all(
      groups.map(async (group) => {
        // Get group's attendance records
        const groupAttendanceRecords = allAttendanceRecords.filter(
          (record) => record.group.toString() === (group._id as any).toString()
        );

        // Calculate attendance rate
        let totalPresent = 0;
        let totalExpected = 0;

        groupAttendanceRecords.forEach((record) => {
          totalPresent += record.presentMembers?.length || 0;
          totalExpected +=
            (record.presentMembers?.length || 0) +
            (record.absentMembers?.length || 0);
        });

        const attendanceRate =
          totalExpected > 0 ? (totalPresent / totalExpected) * 100 : 0;

        // Get member count
        const memberCount = await User.countDocuments({
          group: group._id,
          role: "member",
        });

        // Get event count
        const eventCount = await Event.countDocuments({
          group: group._id,
          ...dateFilter,
        });

        return {
          group: {
            _id: group._id,
            name: group.name,
            leader: group.leader,
          },
          memberCount,
          eventCount,
          attendanceRecordCount: groupAttendanceRecords.length,
          attendanceRate: Math.round(attendanceRate),
        };
      })
    );

    // Sort groups by attendance rate (highest to lowest)
    groupComparison.sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Calculate church-wide statistics
    const churchStats = {
      totalGroups: groups.length,
      totalMembers: await User.countDocuments({ role: "member" }),
      totalEvents: await Event.countDocuments(dateFilter),
      totalAttendanceRecords: allAttendanceRecords.length,
      averageGroupAttendanceRate:
        groupComparison.reduce((sum, group) => sum + group.attendanceRate, 0) /
        (groupComparison.length || 1),
    };

    // Calculate rankings and percentiles
    const groupsWithRankings = groupComparison.map((group, index) => {
      return {
        ...group,
        ranking: index + 1,
        percentile: Math.round(
          ((groupComparison.length - index) / groupComparison.length) * 100
        ),
      };
    });

    // Calculate attendance trends over time
    const attendanceTrends = calculateAttendanceTrends(
      allAttendanceRecords,
      groups
    );

    return NextResponse.json({
      success: true,
      data: {
        dateRange: {
          startDate,
          endDate,
        },
        churchStats,
        groupComparison: groupsWithRankings,
        attendanceTrends,
      },
    });
  } catch (error: unknown) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === "string") {
      errorMsg = error;
    }
    console.error("Group comparison error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

// Helper function to calculate attendance trends over time
function calculateAttendanceTrends(attendanceRecords: any[], groups: any[]) {
  // Group attendance records by month
  const monthlyData: Record<
    string,
    Record<string, { present: number; total: number }>
  > = {};

  attendanceRecords.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const groupId = record.group.toString();

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {};
    }

    if (!monthlyData[monthKey][groupId]) {
      monthlyData[monthKey][groupId] = { present: 0, total: 0 };
    }

    monthlyData[monthKey][groupId].present += record.presentMembers?.length || 0;
    monthlyData[monthKey][groupId].total +=
      (record.presentMembers?.length || 0) +
      (record.absentMembers?.length || 0);
  });

  // Convert to array and sort by month
  const months = Object.keys(monthlyData).sort();

  return months.map((monthKey) => {
    const [year, monthNum] = monthKey.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(monthNum) - 1,
      1
    ).toLocaleString("default", { month: "long" });

    const groupRates = groups.map((group) => {
      const groupId = group._id.toString();
      const groupData = monthlyData[monthKey][groupId] || {
        present: 0,
        total: 0,
      };

      return {
        groupId,
        groupName: group.name,
        attendanceRate:
          groupData.total > 0
            ? Math.round((groupData.present / groupData.total) * 100)
            : 0,
      };
    });

    // Calculate church-wide average for this month
    let totalPresent = 0;
    let totalExpected = 0;

    Object.values(monthlyData[monthKey]).forEach((data) => {
      totalPresent += data.present;
      totalExpected += data.total;
    });

    const churchAverage =
      totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;

    return {
      month: `${monthName} ${year}`,
      churchAverage,
      groupRates,
    };
  });
}