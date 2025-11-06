import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Visitor } from '@/lib/models/Visitor';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET fetch attendance-based alerts for protocol members
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

    const alerts = [];

    // Check for various alert conditions
    for (const visitor of visitors) {
      const visitorAlerts = [];

      // Check attendance patterns
      if (visitor.visitHistory && visitor.visitHistory.length > 0) {
        const recentVisits = visitor.visitHistory
          .filter((visit: any) => {
            const visitDate = new Date(visit.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return visitDate >= thirtyDaysAgo;
          })
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Alert: No visits in last 2 weeks
        const lastVisit = recentVisits[0];
        if (lastVisit) {
          const daysSinceLastVisit = Math.floor(
            (new Date().getTime() - new Date(lastVisit.date).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastVisit > 14) {
            visitorAlerts.push({
              type: 'warning',
              message: `No visits in ${daysSinceLastVisit} days`,
              priority: 'high',
              action: 'Follow up with visitor'
            });
          }
        }

        // Alert: Declining attendance pattern
        if (recentVisits.length >= 4) {
          const last4Visits = recentVisits.slice(0, 4);
          const presentCount = last4Visits.filter((visit: any) => visit.attendanceStatus === 'present').length;
          
          if (presentCount <= 1) {
            visitorAlerts.push({
              type: 'critical',
              message: 'Declining attendance pattern - only attended 1 of last 4 services',
              priority: 'urgent',
              action: 'Schedule immediate follow-up'
            });
          }
        }

        // Alert: Low overall attendance rate
        if (visitor.attendanceRate < 50 && visitor.visitHistory.length >= 3) {
          visitorAlerts.push({
            type: 'warning',
            message: `Low attendance rate: ${visitor.attendanceRate}%`,
            priority: 'medium',
            action: 'Review visitor engagement strategy'
          });
        }
      }

      // Check milestone progress
      if (visitor.milestones && visitor.milestones.length > 0) {
        const completedMilestones = visitor.milestones.filter((m: any) => m.completed).length;
        const milestoneProgress = Math.round((completedMilestones / 12) * 100);
        
        // Alert: Slow milestone progress
        if (milestoneProgress < 25 && visitor.monitoringStatus === 'active') {
          const daysInMonitoring = visitor.monitoringStartDate 
            ? Math.floor((new Date().getTime() - new Date(visitor.monitoringStartDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          
          if (daysInMonitoring > 30) {
            visitorAlerts.push({
              type: 'warning',
              message: `Slow milestone progress: ${milestoneProgress}% after ${daysInMonitoring} days`,
              priority: 'medium',
              action: 'Increase milestone support'
            });
          }
        }
      }

      // Check monitoring status
      if (visitor.monitoringStatus === 'needs-attention') {
        visitorAlerts.push({
          type: 'critical',
          message: 'Visitor flagged for attention',
          priority: 'urgent',
          action: 'Immediate intervention required'
        });
      }

      // Add visitor alerts if any exist
      if (visitorAlerts.length > 0) {
        alerts.push({
          visitorId: visitor._id,
          visitorName: visitor.name,
          visitorEmail: visitor.email,
          monitoringStatus: visitor.monitoringStatus,
          attendanceRate: visitor.attendanceRate,
          alerts: visitorAlerts
        });
      }
    }

    // Sort alerts by priority
    const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
    alerts.sort((a, b) => {
      const aMaxPriority = Math.max(...a.alerts.map(alert => priorityOrder[alert.priority as keyof typeof priorityOrder]));
      const bMaxPriority = Math.max(...b.alerts.map(alert => priorityOrder[alert.priority as keyof typeof priorityOrder]));
      return bMaxPriority - aMaxPriority;
    });

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary: {
          totalAlerts: alerts.length,
          urgentAlerts: alerts.filter(a => a.alerts.some(alert => alert.priority === 'urgent')).length,
          highPriorityAlerts: alerts.filter(a => a.alerts.some(alert => alert.priority === 'high')).length,
          mediumPriorityAlerts: alerts.filter(a => a.alerts.some(alert => alert.priority === 'medium')).length
        }
      }
    });
  } catch (error: unknown) {
    console.error('Fetch visitor alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor alerts' },
      { status: 500 }
    );
  }
}
