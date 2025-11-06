import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// Import models in dependency order
import '@/lib/models/ProtocolTeam';
import '@/lib/models/Visitor';
import '@/lib/models/User';

import { Visitor } from '@/lib/models/Visitor';

// GET individual visitor details
export async function GET(
  request: Request,
  { params }: { params: { visitorId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { visitorId } = params;

    // Find visitor and ensure it belongs to this protocol member
    const visitor = await Visitor.findOne({
      _id: visitorId,
      $or: [
        { assignedProtocolMember: user.id },
        { protocolTeam: (user as any).protocolTeam }
      ]
    });

    if (!visitor) {
      return NextResponse.json({ 
        error: 'Visitor not found or access denied' 
      }, { status: 404 });
    }

    // Return visitor data with all details
    return NextResponse.json({
      success: true,
      data: {
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        address: visitor.address,
        age: visitor.age,
        occupation: visitor.occupation,
        maritalStatus: visitor.maritalStatus,
        type: visitor.type,
        status: visitor.status,
        monitoringStatus: visitor.monitoringStatus,
        monitoringStartDate: visitor.monitoringStartDate,
        monitoringEndDate: visitor.monitoringEndDate,
        attendanceRate: visitor.attendanceRate,
        monitoringProgress: visitor.monitoringProgress,
        daysRemaining: visitor.daysRemaining,
        createdAt: visitor.createdAt,
        visitHistory: visitor.visitHistory || [],
        suggestions: visitor.suggestions || [],
        experiences: visitor.experiences || [],
        milestones: visitor.milestones || [],
        integrationChecklist: visitor.integrationChecklist || {
          welcomePackage: false,
          homeVisit: false,
          smallGroupIntro: false,
          ministryOpportunities: false,
          mentorAssigned: false,
          regularCheckIns: false
        },
        emergencyContact: visitor.emergencyContact,
        referredBy: visitor.referredBy,
        howDidYouHear: visitor.howDidYouHear,
        previousChurch: visitor.previousChurch,
        isActive: visitor.isActive,
        canLogin: visitor.canLogin
      }
    });
  } catch (error: unknown) {
    console.error('Get visitor details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor details' },
      { status: 500 }
    );
  }
}

// PUT update visitor details
export async function PUT(
  request: Request,
  { params }: { params: { visitorId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visitorId } = params;
    const updateData = await request.json();

    await dbConnect();

    // Find visitor and ensure it belongs to this protocol member
    const visitor = await Visitor.findOne({
      _id: visitorId,
      $or: [
        { assignedProtocolMember: user.id },
        { protocolTeam: (user as any).protocolTeam }
      ]
    });

    if (!visitor) {
      return NextResponse.json({ 
        error: 'Visitor not found or access denied' 
      }, { status: 404 });
    }

    // Update visitor with provided data
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        visitor[key] = updateData[key];
      }
    });

    await visitor.save();

    return NextResponse.json({
      success: true,
      message: 'Visitor updated successfully',
      data: {
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        status: visitor.status,
        monitoringStatus: visitor.monitoringStatus
      }
    });
  } catch (error: unknown) {
    console.error('Update visitor error:', error);
    return NextResponse.json(
      { error: 'Failed to update visitor' },
      { status: 500 }
    );
  }
}
