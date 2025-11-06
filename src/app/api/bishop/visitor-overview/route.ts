import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Visitor } from '@/lib/models/Visitor';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all visitors
    const visitors = await Visitor.find()
      .populate('protocolTeam', 'name')
      .populate('assignedProtocolMember', 'name email')
      .sort({ createdAt: -1 });

    // Get all protocol teams
    const protocolTeams = await ProtocolTeam.find({ isActive: true })
      .populate('leader', 'name email')
      .populate('members', 'name email');

    // Calculate overall statistics
    const totalVisitors = visitors.length;
    const joiningVisitors = visitors.filter(v => v.status === 'joining').length;
    const visitingOnly = visitors.filter(v => v.status === 'visiting').length;
    const activeMonitoring = visitors.filter(v => v.monitoringStatus === 'active').length;
    const completedMonitoring = visitors.filter(v => v.monitoringStatus === 'completed').length;
    const convertedMembers = visitors.filter(v => v.monitoringStatus === 'converted-to-member').length;
    const needsAttention = visitors.filter(v => v.status === 'joining' && v.daysRemaining < 30).length;

    // Calculate conversion rate
    const conversionRate = joiningVisitors > 0 ? Math.round((convertedMembers / joiningVisitors) * 100) : 0;

    // Get recent visitor activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVisitors = visitors.filter(v => new Date(v.createdAt) >= thirtyDaysAgo);
    const recentSuggestions = visitors.reduce((acc, visitor) => {
      const recent = visitor.suggestions.filter((s: any) => new Date(s.date) >= thirtyDaysAgo);
      return acc.concat(recent.map((suggestion: any) => ({
        ...suggestion,
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        protocolTeam: visitor.protocolTeam
      })));
    }, [] as any[]).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recentExperiences = visitors.reduce((acc, visitor) => {
      const recent = visitor.experiences.filter((e: any) => new Date(e.date) >= thirtyDaysAgo);
      return acc.concat(recent.map((experience: any) => ({
        ...experience,
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        protocolTeam: visitor.protocolTeam
      })));
    }, [] as any[]).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Team performance analysis
    const teamPerformance = await Promise.all(protocolTeams.map(async (team) => {
      const teamVisitors = visitors.filter(v => v.protocolTeam._id.toString() === team._id.toString());
      const teamJoining = teamVisitors.filter(v => v.status === 'joining');
      const teamConverted = teamVisitors.filter(v => v.monitoringStatus === 'converted-to-member');
      const teamConversionRate = teamJoining.length > 0 ? Math.round((teamConverted.length / teamJoining.length) * 100) : 0;

      // Calculate average attendance rate for team's joining visitors
      const joiningVisitorsWithAttendance = teamVisitors.filter(v => v.status === 'joining' && v.visitHistory.length > 0);
      const avgAttendanceRate = joiningVisitorsWithAttendance.length > 0
        ? Math.round(joiningVisitorsWithAttendance.reduce((sum, v) => sum + v.attendanceRate, 0) / joiningVisitorsWithAttendance.length)
        : 0;

      return {
        teamId: team._id,
        teamName: team.name,
        leaderName: team.leader.name,
        totalVisitors: teamVisitors.length,
        joiningVisitors: teamJoining.length,
        convertedMembers: teamConverted.length,
        conversionRate: teamConversionRate,
        averageAttendanceRate: avgAttendanceRate,
        activeMonitoring: teamVisitors.filter(v => v.monitoringStatus === 'active').length
      };
    }));

    // Visitors needing immediate attention
    const urgentAttention = visitors.filter(visitor => {
      if (visitor.status !== 'joining') return false;
      
      // Check for various attention criteria
      const daysRemaining = visitor.daysRemaining || 0;
      const attendanceRate = visitor.attendanceRate || 0;
      const lastVisit = visitor.visitHistory.length > 0 
        ? new Date(visitor.visitHistory[visitor.visitHistory.length - 1].date)
        : new Date(visitor.createdAt);
      const daysSinceLastVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      return daysRemaining < 30 || attendanceRate < 50 || daysSinceLastVisit > 14;
    });

    // Monthly visitor trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthVisitors = visitors.filter(v => {
        const createdDate = new Date(v.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      });

      const monthJoining = monthVisitors.filter(v => v.status === 'joining');
      const monthConverted = visitors.filter(v => {
        if (v.monitoringStatus !== 'converted-to-member') return false;
        const completedDate = v.milestones.find((m: any) => m.completed && m.week === 12)?.completedDate;
        if (!completedDate) return false;
        const convertedDate = new Date(completedDate);
        return convertedDate >= monthStart && convertedDate <= monthEnd;
      });

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newVisitors: monthVisitors.length,
        joiningVisitors: monthJoining.length,
        convertedMembers: monthConverted.length,
        conversionRate: monthJoining.length > 0 ? Math.round((monthConverted.length / monthJoining.length) * 100) : 0
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalVisitors,
          joiningVisitors,
          visitingOnly,
          activeMonitoring,
          completedMonitoring,
          convertedMembers,
          conversionRate,
          totalProtocolTeams: protocolTeams.length,
          needsAttention
        },
        visitors: visitors.slice(0, 20), // Recent 20 visitors
        protocolTeams,
        teamPerformance,
        recentActivity: {
          newVisitors: recentVisitors.length,
          suggestions: recentSuggestions.slice(0, 10),
          experiences: recentExperiences.slice(0, 10)
        },
        urgentAttention: urgentAttention.slice(0, 10),
        monthlyTrends,
        insights: {
          bestPerformingTeam: teamPerformance.reduce((best, team) => 
            team.conversionRate > (best?.conversionRate || 0) ? team : best, 
            teamPerformance[0]
          ),
          mostActiveTeam: teamPerformance.reduce((most, team) => 
            team.totalVisitors > (most?.totalVisitors || 0) ? team : most, 
            teamPerformance[0]
          ),
          averageConversionRate: teamPerformance.length > 0 
            ? Math.round(teamPerformance.reduce((sum, team) => sum + team.conversionRate, 0) / teamPerformance.length)
            : 0,
          totalSuggestions: visitors.reduce((sum, v) => sum + v.suggestions.length, 0),
          averageRating: visitors.reduce((sum, v) => {
            const avgRating = v.experiences.length > 0 
              ? v.experiences.reduce((s: any, e: any) => s + e.rating, 0) / v.experiences.length 
              : 0;
            return sum + avgRating;
          }, 0) / (visitors.filter(v => v.experiences.length > 0).length || 1)
        }
      }
    });
  } catch (error: unknown) {
    console.error('Bishop visitor overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor overview' },
      { status: 500 }
    );
  }
}
