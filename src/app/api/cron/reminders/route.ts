import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { sendEventReminders, sendAttendanceReminders } from '@/lib/utils/notifications';

// This endpoint should be called by a cron job or scheduler
export async function POST(request: Request) {
  try {
    // Simple API key validation (in production, use a more secure method)
    const { authorization } = Object.fromEntries(request.headers);
    const apiKey = process.env.CRON_API_KEY;
    
    if (!apiKey || authorization !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Send event reminders for events happening tomorrow
    const eventReminderCount = await sendEventReminders(1);
    
    // Send attendance marking reminders for yesterday's events
    const attendanceReminderCount = await sendAttendanceReminders();
    
    return NextResponse.json({
      success: true,
      data: {
        eventRemindersSent: eventReminderCount,
        attendanceRemindersSent: attendanceReminderCount,
      },
    });
  } catch (error: unknown) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error('Reminders error:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}