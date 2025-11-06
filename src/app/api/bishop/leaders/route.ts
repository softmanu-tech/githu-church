import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

// ➕ CREATE a leaders and assign to a groups
export async function POST(req: Request) {
    try {
        // Authentication check
        const { user } = await requireSessionAndRoles(req, ['bishop']);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, email, password, groupId } = await req.json();
        
        // Validate required fields
        if (!name || !email || !password || !groupId) {
            return NextResponse.json({ 
                error: 'Name, email, password, and groupId are required' 
            }, { status: 400 });
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ 
                error: 'User with this email already exists' 
            }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const leader = new User({
            name,
            email,
            password: hashedPassword,
            role: 'leader',
            group: groupId,
        });
        await leader.save();

        return NextResponse.json({ 
            success: true, 
            leader: {
                _id: leader._id,
                name: leader.name,
                email: leader.email,
                role: leader.role,
                group: leader.group
            }
        });
    } catch (error: unknown) {
        console.error('Create leader error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to create leader' 
        }, { status: 500 });
    }
}

// 📄 LIST all leaders
export async function GET(req: Request) {
    try {
        // Authentication check
        const { user } = await requireSessionAndRoles(req, ['bishop']);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const leaders = await User.find({ role: 'leader' })
            .populate('group', 'name')
            .select('-password') // Exclude password for security
            .lean();
            
        return NextResponse.json({ 
            success: true, 
            leaders: leaders.map(leader => ({
                _id: leader._id,
                name: leader.name,
                email: leader.email,
                role: leader.role,
                group: leader.group
            }))
        });
    } catch (error: unknown) {
        console.error('Get leaders error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch leaders' 
        }, { status: 500 });
    }
}
