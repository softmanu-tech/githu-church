import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';

export async function GET(request: Request) {
    try {
        // 1. Strict Authentication
        const { user } = await requireSessionAndRoles(request, ['leader']);
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const url = new URL(request.url);
        const memberId = url.searchParams.get('memberId');
        const startDate = url.searchParams.get('startDate') 
            ? new Date(url.searchParams.get('startDate') as string) 
            : new Date(new Date().setDate(new Date().getDate() - 90)); // Default to last 90 days
        const endDate = url.searchParams.get('endDate') 
            ? new Date(url.searchParams.get('endDate') as string) 
            : new Date();

        if (!memberId) {
            return NextResponse.json({ 
                error: 'Member ID is required' 
            }, { status: 400 });
        }

        await dbConnect();

        // Get the leader's group
        const leader = await User.findById(user.id);
        if (!leader || !leader.group) {
            return NextResponse.json({ 
                error: 'Leader does not have an assigned group' 
            }, { status: 400 });
        }

        // Verify the member belongs to the leader's group
        const member = await User.findOne({ 
            _id: memberId,
            group: leader.group,
            role: 'member'
        });

        if (!member) {
            return NextResponse.json({ 
                error: 'Member not found in your group' 
            }, { status: 404 });
        }

        // Get all attendance records for the leader's group within the date range
        const attendanceRecords = await Attendance.find({
            group: leader.group,
            date: { $gte: startDate, $lte: endDate },
            $or: [
                { presentMembers: memberId },
                { absentMembers: memberId }
            ]
        }).sort({ date: -1 }).populate('event');

        // Get all events for the leader's group within the date range
        const events = await Event.find({
            group: leader.group,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });

        // Calculate attendance history
        const attendanceHistory = attendanceRecords.map(record => {
            const isPresent = record.presentMembers.some(id => id.toString() === memberId);
            
            return {
                date: record.date,
                status: isPresent ? 'present' : 'absent',
                event: record.event,
                notes: record.notes
            };
        });

        // Calculate attendance patterns
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayPatterns = daysOfWeek.map(day => {
            const dayIndex = daysOfWeek.indexOf(day);
            const dayRecords = attendanceRecords.filter(record => new Date(record.date).getDay() === dayIndex);
            
            if (dayRecords.length === 0) return { day, percentage: 0, count: 0 };
            
            const presentCount = dayRecords.filter(record => 
                record.presentMembers.some(id => id.toString() === memberId)
            ).length;
            
            return {
                day,
                percentage: Math.round((presentCount / dayRecords.length) * 100),
                count: dayRecords.length
            };
        });

        // Calculate monthly trends
        const monthlyTrends = calculateMonthlyTrends(memberId, attendanceRecords);

        // Calculate consecutive attendance streaks
        const { currentStreak, longestStreak } = calculateStreaks(attendanceHistory);

        return NextResponse.json({
            success: true,
            data: {
                member: {
                    _id: member._id,
                    name: member.name,
                    email: member.email,
                    phone: member.phone
                },
                summary: {
                    totalEvents: events.length,
                    attendedEvents: attendanceHistory.filter(record => record.status === 'present').length,
                    missedEvents: attendanceHistory.filter(record => record.status === 'absent').length,
                    attendanceRate: attendanceHistory.length > 0 
                        ? Math.round((attendanceHistory.filter(record => record.status === 'present').length / attendanceHistory.length) * 100) 
                        : 0
                },
                streaks: {
                    current: currentStreak,
                    longest: longestStreak
                },
                patterns: {
                    dayOfWeek: dayPatterns,
                    monthly: monthlyTrends
                },
                history: attendanceHistory
            }
        });
    } catch (error: unknown) {
        let errorMsg = 'Unknown error';
        if (error instanceof Error) {
            errorMsg = error.message;
        } else if (typeof error === 'string') {
            errorMsg = error;
        }
        console.error('Member attendance details error:', error);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}

// Helper function to calculate monthly attendance trends
function calculateMonthlyTrends(memberId: string, attendanceRecords: any[]) {
    const months: Record<string, { present: number, total: number }> = {};
    
    attendanceRecords.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!months[monthKey]) {
            months[monthKey] = { present: 0, total: 0 };
        }
        
        months[monthKey].total++;
        
        if (record.presentMembers.some((id: any) => id.toString() === memberId)) {
            months[monthKey].present++;
        }
    });
    
    return Object.entries(months).map(([month, data]) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'long' });
        
        return {
            month: `${monthName} ${year}`,
            percentage: Math.round((data.present / data.total) * 100),
            count: data.total
        };
    }).sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
}

// Helper function to calculate attendance streaks
function calculateStreaks(attendanceHistory: any[]) {
    // Sort by date (oldest first)
    const sortedHistory = [...attendanceHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let currentCount = 0;
    
    sortedHistory.forEach((record, index) => {
        if (record.status === 'present') {
            currentCount++;
            
            // Update longest streak if current count is higher
            if (currentCount > longestStreak) {
                longestStreak = currentCount;
            }
            
            // If this is the most recent record and it's present, update current streak
            if (index === sortedHistory.length - 1) {
                currentStreak = currentCount;
            }
        } else {
            // Reset current count on absence
            currentCount = 0;
            
            // If this is the most recent record and it's absent, current streak is 0
            if (index === sortedHistory.length - 1) {
                currentStreak = 0;
            }
        }
    });
    
    return { currentStreak, longestStreak };
}