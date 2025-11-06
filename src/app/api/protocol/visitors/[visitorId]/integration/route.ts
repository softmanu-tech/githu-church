import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Visitor } from '@/lib/models/Visitor';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

// GET fetch visitor integration checklist
export async function GET(
  request: Request,
  { params }: { params: { visitorId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['protocol']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visitorId } = params;

    await dbConnect();

    // Get visitor with integration checklist
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Check if protocol member has access to this visitor
    if (visitor.assignedProtocolMember?.toString() !== user.id && 
        visitor.protocolTeam?.toString() !== (user as any).protocolTeam?.toString()) {
      return NextResponse.json({ error: 'Unauthorized to view this visitor' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        integrationChecklist: visitor.integrationChecklist || {
          welcomePackage: false,
          homeVisit: false,
          smallGroupIntro: false,
          ministryOpportunities: false,
          mentorAssigned: false,
          regularCheckIns: false
        },
        visitor: {
          id: visitor._id,
          name: visitor.name,
          type: visitor.type,
          status: visitor.status
        }
      }
    });
  } catch (error: unknown) {
    console.error('Fetch visitor integration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration checklist' },
      { status: 500 }
    );
  }
}

// PUT update visitor integration checklist
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
    const { checklistItem, completed } = await request.json();

    await dbConnect();

    // Get visitor
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Check if protocol member has access to this visitor
    if (visitor.assignedProtocolMember?.toString() !== user.id && 
        visitor.protocolTeam?.toString() !== (user as any).protocolTeam?.toString()) {
      return NextResponse.json({ error: 'Unauthorized to update this visitor' }, { status: 403 });
    }

    // Initialize integration checklist if it doesn't exist
    if (!visitor.integrationChecklist) {
      visitor.integrationChecklist = {
        welcomePackage: false,
        homeVisit: false,
        smallGroupIntro: false,
        ministryOpportunities: false,
        mentorAssigned: false,
        regularCheckIns: false
      };
    }

    // Update the specific checklist item
    if (checklistItem && visitor.integrationChecklist.hasOwnProperty(checklistItem)) {
      visitor.integrationChecklist[checklistItem] = completed;
    }

    await visitor.save();

    return NextResponse.json({
      success: true,
      data: {
        integrationChecklist: visitor.integrationChecklist
      },
      message: `Integration checklist updated successfully`
    });
  } catch (error: unknown) {
    console.error('Update visitor integration error:', error);
    return NextResponse.json(
      { error: 'Failed to update integration checklist' },
      { status: 500 }
    );
  }
}