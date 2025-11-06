import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ProtocolTeam } from '@/lib/models/ProtocolTeam';
import { Visitor } from '@/lib/models/Visitor';
import { User } from '@/lib/models/User';
import { Notification } from '@/lib/models/Notification';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET automated monitoring alerts
export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    
    // Get all active visitors across all teams
    const activeVisitors = await Visitor.find({ monitoringStatus: 'active' })
      .populate('protocolTeam', 'name')
      .populate('assignedProtocolMember', 'name email');

    // Categorize visitors by urgency
    const criticalVisitors: any[] = []; // < 1 week remaining
    const urgentVisitors: any[] = [];   // 1-2 weeks remaining
    const warningVisitors: any[] = [];  // 2-4 weeks remaining
    const normalVisitors: any[] = [];   // > 4 weeks remaining

    activeVisitors.forEach(visitor => {
      const startDate = visitor.monitoringStartDate ? new Date(visitor.monitoringStartDate) : new Date(visitor.createdAt);
      const endDate = new Date(startDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days later
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const visitorData = {
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        daysRemaining,
        teamName: visitor.protocolTeam?.name || 'Unknown Team',
        assignedMember: visitor.assignedProtocolMember?.name || 'Unassigned',
        assignedMemberEmail: visitor.assignedProtocolMember?.email || '',
        startDate: startDate,
        endDate: endDate
      };

      if (daysRemaining <= 7) {
        criticalVisitors.push(visitorData);
      } else if (daysRemaining <= 14) {
        urgentVisitors.push(visitorData);
      } else if (daysRemaining <= 28) {
        warningVisitors.push(visitorData);
      } else {
        normalVisitors.push(visitorData);
      }
    });

    // Generate automated recommendations
    const automatedRecommendations = [];

    // Critical visitors (immediate action needed)
    if (criticalVisitors.length > 0) {
      automatedRecommendations.push({
        type: 'CRITICAL',
        title: 'Immediate Action Required',
        description: `${criticalVisitors.length} visitors have less than 1 week remaining in their monitoring period`,
        action: 'Schedule conversion meetings immediately',
        visitors: criticalVisitors,
        priority: 'Critical'
      });
    }

    // Urgent visitors (action needed soon)
    if (urgentVisitors.length > 0) {
      automatedRecommendations.push({
        type: 'URGENT',
        title: 'Action Needed Soon',
        description: `${urgentVisitors.length} visitors have 1-2 weeks remaining in their monitoring period`,
        action: 'Begin conversion preparation and discussions',
        visitors: urgentVisitors,
        priority: 'High'
      });
    }

    // Warning visitors (prepare for action)
    if (warningVisitors.length > 0) {
      automatedRecommendations.push({
        type: 'WARNING',
        title: 'Prepare for Conversion Discussions',
        description: `${warningVisitors.length} visitors have 2-4 weeks remaining in their monitoring period`,
        action: 'Start preparing conversion materials and meetings',
        visitors: warningVisitors,
        priority: 'Medium'
      });
    }

    // Team-specific alerts
    const teamAlerts: any = {};
    [...criticalVisitors, ...urgentVisitors, ...warningVisitors].forEach(visitor => {
      if (!teamAlerts[visitor.teamName]) {
        teamAlerts[visitor.teamName] = {
          teamName: visitor.teamName,
          critical: 0,
          urgent: 0,
          warning: 0,
          visitors: []
        };
      }
      
      teamAlerts[visitor.teamName].visitors.push(visitor);
      
      if (visitor.daysRemaining <= 7) teamAlerts[visitor.teamName].critical++;
      else if (visitor.daysRemaining <= 14) teamAlerts[visitor.teamName].urgent++;
      else teamAlerts[visitor.teamName].warning++;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalActiveVisitors: activeVisitors.length,
          criticalCount: criticalVisitors.length,
          urgentCount: urgentVisitors.length,
          warningCount: warningVisitors.length,
          normalCount: normalVisitors.length
        },
        recommendations: automatedRecommendations,
        teamAlerts: Object.values(teamAlerts),
        visitorDetails: {
          critical: criticalVisitors,
          urgent: urgentVisitors,
          warning: warningVisitors,
          normal: normalVisitors.slice(0, 10) // Limit normal visitors display
        }
      }
    });
  } catch (error: unknown) {
    console.error('Automated alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automated alerts' },
      { status: 500 }
    );
  }
}

// POST send automated notifications to protocol teams
export async function POST(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertType, teamIds, customMessage } = await request.json();

    await dbConnect();

    let notificationsSent = 0;
    const results = [];

    for (const teamId of teamIds) {
      const team = await ProtocolTeam.findById(teamId).populate('leader', 'name email');
      if (!team) continue;

      // Create notification for team leader
      const notification = new Notification({
        recipient: team.leader._id,
        sender: user.id,
        type: alertType,
        title: `Automated Alert: ${alertType}`,
        message: customMessage || `Automated monitoring alert for your protocol team: ${team.name}`,
        priority: alertType === 'CRITICAL' ? 'High' : alertType === 'URGENT' ? 'High' : 'Medium',
        relatedEntity: {
          entityType: 'ProtocolTeam',
          entityId: teamId
        }
      });

      await notification.save();
      notificationsSent++;
      
      results.push({
        teamName: team.name,
        leaderName: team.leader.name,
        notificationId: notification._id
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${notificationsSent} automated notifications`,
      data: {
        notificationsSent,
        results
      }
    });
  } catch (error: unknown) {
    console.error('Send automated alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to send automated alerts' },
      { status: 500 }
    );
  }
}
