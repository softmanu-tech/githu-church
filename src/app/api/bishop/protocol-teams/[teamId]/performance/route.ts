import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Visitor } from '@/lib/models/Visitor';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET protocol team performance report
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
      .populate('leader', 'name email')
      .populate('members', 'name email');

    if (!team) {
      return NextResponse.json({ error: 'Protocol team not found' }, { status: 404 });
    }

    // Get all visitors for this team
    const visitors = await Visitor.find({ protocolTeam: teamId });

    // Calculate performance metrics
    const totalVisitors = visitors.length;
    const joiningVisitors = visitors.filter(v => v.status === 'joining').length;
    const visitingOnly = visitors.filter(v => v.status === 'visiting').length;
    const activeMonitoring = visitors.filter(v => v.monitoringStatus === 'active').length;
    const completedMonitoring = visitors.filter(v => v.monitoringStatus === 'completed').length;
    const convertedMembers = visitors.filter(v => v.monitoringStatus === 'converted-to-member').length;

    // Calculate conversion rate
    const conversionRate = joiningVisitors > 0 ? Math.round((convertedMembers / joiningVisitors) * 100) : 0;

    // Get visitors by month for trend analysis
    const visitorsByMonth = visitors.reduce((acc: any, visitor) => {
      const month = new Date(visitor.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, joining: 0, visiting: 0 };
      }
      acc[month].total++;
      if (visitor.status === 'joining') acc[month].joining++;
      if (visitor.status === 'visiting') acc[month].visiting++;
      return acc;
    }, {});

    // Convert to chart data
    const monthlyTrend = Object.keys(visitorsByMonth)
      .sort()
      .slice(-6) // Last 6 months
      .map(month => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        total: visitorsByMonth[month].total,
        joining: visitorsByMonth[month].joining,
        visiting: visitorsByMonth[month].visiting
      }));

    // Get top performing members (based on visitor assignments and conversions)
    const memberPerformance = await Promise.all(
      team.members.map(async (member: any) => {
        const assignedVisitors = await Visitor.find({ assignedProtocolMember: member._id });
        const conversions = assignedVisitors.filter(v => v.monitoringStatus === 'converted-to-member').length;
        
        return {
          name: member.name,
          email: member.email,
          assignedVisitors: assignedVisitors.length,
          conversions,
          conversionRate: assignedVisitors.length > 0 ? Math.round((conversions / assignedVisitors.length) * 100) : 0
        };
      })
    );

    // Get recent visitor activities
    const recentActivities = visitors
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(visitor => ({
        visitorName: visitor.name,
        action: visitor.status === 'joining' ? 'Joined for monitoring' : 'Visited church',
        date: visitor.createdAt,
        status: visitor.monitoringStatus,
        assignedTo: visitor.assignedProtocolMember
      }));

    // Calculate performance insights
    const insights = {
      totalVisitorsThisMonth: visitors.filter(v => 
        new Date(v.createdAt).getMonth() === new Date().getMonth() &&
        new Date(v.createdAt).getFullYear() === new Date().getFullYear()
      ).length,
      averageVisitorsPerMember: Math.round(totalVisitors / team.members.length),
      highestConversionMember: memberPerformance.reduce((prev, current) => 
        prev.conversionRate > current.conversionRate ? prev : current
      ),
      visitorsNeedingAttention: visitors.filter(v => 
        v.status === 'joining' && 
        v.monitoringStatus === 'active' &&
        v.daysRemaining !== undefined && 
        v.daysRemaining < 30
      ).length
    };

    return NextResponse.json({
      success: true,
      data: {
        team: {
          _id: team._id,
          name: team.name,
          description: team.description,
          leader: team.leader,
          memberCount: team.members.length
        },
        statistics: {
          totalVisitors,
          joiningVisitors,
          visitingOnly,
          activeMonitoring,
          completedMonitoring,
          convertedMembers,
          conversionRate
        },
        monthlyTrend,
        memberPerformance,
        recentActivities,
        insights
      }
    });
  } catch (error: unknown) {
    console.error('Protocol team performance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team performance data' },
      { status: 500 }
    );
  }
}
