import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Group } from '@/lib/models/Group';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

// ➕ CREATE a group
export async function POST(request: Request) {
    try {
        // 1. Strict Authentication
        const { user } = await requireSessionAndRoles(request, ['bishop']);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, leaderId } = await request.json();
        await dbConnect();

        // Create the group
        const group = new Group({ name });
        
        // If a leader is specified, assign them to this group
        if (leaderId) {
            const leader = await User.findById(leaderId);
            if (!leader) {
                return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
            }
            
            group.leader = leaderId;
            await group.save();
            
            // Update the leader's group reference
            await User.findByIdAndUpdate(leaderId, { group: group._id });
        } else {
            await group.save();
        }

        return NextResponse.json({ success: true, group });
    } catch (error: unknown) {
        let errorMsg = 'Unknown error';
        if (error instanceof Error) {
            errorMsg = error.message;
        } else if (typeof error === 'string') {
            errorMsg = error;
        }
        console.error('Group creation error:', error);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}

// 📄 LIST all groups
export async function GET(request: Request) {
    try {
        // 1. Strict Authentication
        const { user } = await requireSessionAndRoles(request, ['bishop']);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const groups = await Group.find().populate('leader', 'name email');
        return NextResponse.json({ success: true, groups });
    } catch (error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
