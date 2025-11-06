// app/api/users/create-leaders/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { requireSessionAndRoles } from '@/lib/authMiddleware';

export async function POST(request: Request) {
    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, email, groupId } = await request.json();
    const password = Math.random().toString(36).slice(-8); // Generate random password

    try {
        // Verify the group exists
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group) {
                return NextResponse.json({ error: 'Group not found' }, { status: 404 });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'leader',
            group: groupId
        });

        await user.save();

        // Update the group with the new leader
        if (groupId) {
            await Group.findByIdAndUpdate(groupId, { leader: user._id });
        }

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    group: groupId
                },
                password // Only returned for demo, in production don't return this
            }
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}