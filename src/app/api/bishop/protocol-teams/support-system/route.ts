import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Visitor } from '@/lib/models/Visitor';
import { User } from '@/lib/models/User';
import { Notification } from '@/lib/models/Notification';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

// GET support recommendations and actions for protocol teams
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all teams with their performance data - handle gracefully if collections are empty
    let teams: any[] = [];
    try {
      teams = await ProtocolTeam.find({ isActive: true })
        .populate('leader', 'name email')
        .populate('members', 'name email')
        .lean();
    } catch (error) {
      console.log('ProtocolTeam collection not found or empty');
      teams = [];
    }

    let allVisitors: any[] = [];
    try {
      allVisitors = await Visitor.find({}).lean();
    } catch (error) {
      console.log('Visitor collection not found or empty');
      allVisitors = [];
    }

    // Analyze each team's performance
    const teamAnalysis = await Promise.all(teams.map(async (team) => {
      const teamVisitors = allVisitors.filter(v => 
        v.protocolTeam && v.protocolTeam.toString() === team._id.toString()
      );

      // Calculate metrics
      const totalVisitors = teamVisitors.length;
      const joiningVisitors = teamVisitors.filter(v => v.status === 'joining').length;
      const convertedMembers = teamVisitors.filter(v => v.monitoringStatus === 'converted-to-member').length;
      const activeVisitors = teamVisitors.filter(v => v.monitoringStatus === 'active').length;
      const conversionRate = joiningVisitors > 0 ? Math.round((convertedMembers / joiningVisitors) * 100) : 0;

      // Calculate growth trend (last 3 months vs previous 3 months)
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      const recentVisitors = teamVisitors.filter(v => new Date(v.createdAt) >= threeMonthsAgo).length;
      const previousVisitors = teamVisitors.filter(v => {
        const date = new Date(v.createdAt);
        return date >= sixMonthsAgo && date < threeMonthsAgo;
      }).length;

      const growthTrend = previousVisitors > 0 ? ((recentVisitors - previousVisitors) / previousVisitors) * 100 : 0;
      const trendDirection = growthTrend > 5 ? 'growing' : growthTrend < -5 ? 'declining' : 'stable';

      // Check for visitors at risk (active for >2.5 months)
      const visitorsAtRisk = teamVisitors.filter(v => {
        if (v.monitoringStatus !== 'active') return false;
        const daysSinceStart = v.monitoringStartDate ? 
          Math.floor((now.getTime() - new Date(v.monitoringStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        return daysSinceStart > 75; // 2.5 months
      });

      return {
        teamId: team._id,
        teamName: team.name,
        leader: team.leader,
        memberCount: team.members.length,
        metrics: {
          totalVisitors,
          joiningVisitors,
          convertedMembers,
          activeVisitors,
          conversionRate,
          growthTrend,
          trendDirection,
          visitorsAtRisk: visitorsAtRisk.length
        },
        visitorsAtRiskDetails: visitorsAtRisk.map(v => ({
          name: v.name,
          email: v.email,
          daysSinceStart: v.monitoringStartDate ? 
            Math.floor((now.getTime() - new Date(v.monitoringStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
        }))
      };
    }));

    // 1. TEAMS NEEDING SUPPORT (declining growth)
    const decliningTeams = teamAnalysis.filter(team => team.metrics.trendDirection === 'declining');
    
    // 2. HIGH-PERFORMING TEAMS (for best practices)
    const highPerformingTeams = teamAnalysis
      .filter(team => team.metrics.conversionRate >= 50 || team.metrics.trendDirection === 'growing')
      .sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate);

    // 3. TEAMS NEEDING TRAINING (low conversion rates)
    const lowConversionTeams = teamAnalysis.filter(team => 
      team.metrics.conversionRate < 30 && team.metrics.joiningVisitors >= 3
    );

    // 4. ACTIVE VISITOR MONITORING ALERTS
    const teamsWithRiskyVisitors = teamAnalysis.filter(team => team.metrics.visitorsAtRisk > 0);
    const totalVisitorsAtRisk = teamAnalysis.reduce((sum, team) => sum + team.metrics.visitorsAtRisk, 0);

    // 5. TOP PERFORMING TEAMS (for recognition)
    const topPerformingTeams = teamAnalysis
      .sort((a, b) => {
        const scoreA = (a.metrics.conversionRate * 0.6) + (Math.max(a.metrics.growthTrend, 0) * 0.4);
        const scoreB = (b.metrics.conversionRate * 0.6) + (Math.max(b.metrics.growthTrend, 0) * 0.4);
        return scoreB - scoreA;
      })
      .slice(0, 3);

    // Generate specific action items
    const actionItems = {
      supportActions: decliningTeams.map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        leaderName: team.leader.name,
        leaderEmail: team.leader.email,
        issue: 'Declining growth trend',
        growthTrend: team.metrics.growthTrend,
        recommendedActions: [
          'Schedule one-on-one meeting with team leader',
          'Review current visitor outreach strategies',
          'Provide additional resources and training',
          'Consider pairing with high-performing team for mentorship'
        ],
        priority: team.metrics.growthTrend < -20 ? 'High' : 'Medium'
      })),

      bestPractices: await Promise.all(highPerformingTeams.slice(0, 3).map(async (team) => {
        // Get actual documented strategies for this team
        const { ProtocolStrategy } = await import('@/lib/models/ProtocolStrategy');
        const teamStrategies = await ProtocolStrategy.find({ 
          protocolTeam: team.teamId, 
          status: { $in: ['approved', 'featured'] }
        }).limit(3);

        const realSuccessFactors = teamStrategies.length > 0 ? 
          teamStrategies.map(s => s.title) : 
          ['Team has not yet documented their success strategies'];

        const realInsights = teamStrategies.length > 0 ? 
          teamStrategies.map(s => `${s.title}: ${s.measuredResults.improvementPercentage.toFixed(1)}% improvement`) :
          [
            `Achieved ${team.metrics.conversionRate}% conversion rate`,
            `${team.metrics.growthTrend > 0 ? 'Growing' : 'Maintaining'} visitor base`,
            `Managing ${team.metrics.activeVisitors} active visitors effectively`
          ];

        return {
          teamId: team.teamId,
          teamName: team.teamName,
          leaderName: team.leader.name,
          conversionRate: team.metrics.conversionRate,
          growthTrend: team.metrics.growthTrend,
          successFactors: realSuccessFactors,
          shareableInsights: realInsights,
          documentedStrategies: teamStrategies.length,
          hasRealStrategies: teamStrategies.length > 0
        };
      })),

      trainingNeeds: lowConversionTeams.map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        leaderName: team.leader.name,
        leaderEmail: team.leader.email,
        conversionRate: team.metrics.conversionRate,
        joiningVisitors: team.metrics.joiningVisitors,
        recommendedActions: [
          'Visitor conversion techniques',
          'Follow-up communication skills',
          'Relationship building strategies',
          'Spiritual mentoring approaches'
        ],
        priority: team.metrics.conversionRate < 15 ? 'High' : 'Medium'
      })),

      monitoringAlerts: teamsWithRiskyVisitors.map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        leaderName: team.leader.name,
        leaderEmail: team.leader.email,
        visitorsAtRisk: team.metrics.visitorsAtRisk,
        riskDetails: team.visitorsAtRiskDetails,
        recommendedActions: [
          'Contact visitors approaching 3-month deadline',
          'Schedule conversion decision meetings',
          'Provide additional spiritual support',
          'Consider extending monitoring period if needed'
        ]
      })),

      recognition: topPerformingTeams.map((team, index) => ({
        rank: index + 1,
        teamId: team.teamId,
        teamName: team.teamName,
        leaderName: team.leader.name,
        achievements: {
          conversionRate: team.metrics.conversionRate,
          growthTrend: team.metrics.growthTrend,
          totalVisitors: team.metrics.totalVisitors,
          activeVisitors: team.metrics.activeVisitors
        },
        recognitionType: index === 0 ? 'Top Performer' : index === 1 ? 'Excellence Award' : 'Outstanding Achievement',
        suggestedRewards: [
          'Public recognition in church announcements',
          'Certificate of excellence',
          'Team appreciation event',
          'Leadership development opportunities'
        ]
      }))
    };

    // Generate summary statistics
    const summary = {
      totalTeams: teamAnalysis.length,
      teamsNeedingSupport: decliningTeams.length,
      highPerformingTeams: highPerformingTeams.length,
      teamsNeedingTraining: lowConversionTeams.length,
      totalVisitorsAtRisk,
      teamsWithRiskyVisitors: teamsWithRiskyVisitors.length,
      averageConversionRate: Math.round(
        teamAnalysis.reduce((sum, team) => sum + team.metrics.conversionRate, 0) / teamAnalysis.length
      ),
      teamsGrowing: teamAnalysis.filter(t => t.metrics.trendDirection === 'growing').length,
      teamsStable: teamAnalysis.filter(t => t.metrics.trendDirection === 'stable').length,
      teamsdeclining: teamAnalysis.filter(t => t.metrics.trendDirection === 'declining').length
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        actionItems,
        teamAnalysis: teamAnalysis.map(team => ({
          teamId: team.teamId,
          teamName: team.teamName,
          leader: team.leader.name,
          metrics: team.metrics
        }))
      }
    });
  } catch (error: unknown) {
    console.error('Protocol teams support system error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support system data' },
      { status: 500 }
    );
  }
}

// POST create support actions (notifications, training schedules, etc.)
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionType, teamId, message, priority } = await request.json();

    await dbConnect();

    // Get team details
    const team = await ProtocolTeam.findById(teamId).populate('leader', 'name email');
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Create notification for team leader
    const notification = new Notification({
      recipient: team.leader._id,
      type: 'system',
      title: `Protocol Team Support: ${actionType}`,
      message: message,
      relatedId: teamId,
      isRead: false
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: 'Support action created successfully',
      data: {
        notificationId: notification._id,
        teamName: team.name,
        leaderName: team.leader.name
      }
    });
  } catch (error: unknown) {
    console.error('Create support action error:', error);
    return NextResponse.json(
      { error: 'Failed to create support action' },
      { status: 500 }
    );
  }
}
