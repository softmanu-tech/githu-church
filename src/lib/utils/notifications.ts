import { Notification } from '../models/Notification';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import Event from '@/lib/models/Event';
import { Attendance } from '@/lib/models/Attendance';
import mongoose from 'mongoose';

// Send notification to a single user
export async function sendNotification({
  recipientId,
  title,
  message,
  type,
  relatedTo,
}: {
  recipientId: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type: 'event' | 'attendance' | 'system' | 'reminder';
  relatedTo?: {
    model: 'Event' | 'Attendance' | 'Group' | 'User';
    id: mongoose.Types.ObjectId | string;
  };
}) {
  const notification = new Notification({
    recipient: recipientId,
    title,
    message,
    type,
    relatedTo,
  });

  return notification.save();
}

// Send notification to all members of a group
export async function sendGroupNotification({
  groupId,
  title,
  message,
  type,
  relatedTo,
  includeLeader = true,
}: {
  groupId: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type: 'event' | 'attendance' | 'system' | 'reminder';
  relatedTo?: {
    model: 'Event' | 'Attendance' | 'Group' | 'User';
    id: mongoose.Types.ObjectId | string;
  };
  includeLeader?: boolean;
}) {
  // Get all members of the group
  const group = await Group.findById(groupId).populate('members').lean();
  if (!group) throw new Error('Group not found');

  const notifications = [];

  // Send to members
  // Fix: Type assertion to tell TypeScript that members exists and is an array
  const members = (group as any)?.members ?? [];
  for (const memberId of members) {
    const notification = new Notification({
      recipient: memberId,
      title,
      message,
      type,
      relatedTo,
    });
    notifications.push(notification);
  }

  // Send to leader if requested
  if (includeLeader && 'leader' in group && group.leader) {
    const notification = new Notification({
      recipient: group.leader as mongoose.Types.ObjectId,
      title,
      message,
      type,
      relatedTo,
    });
    notifications.push(notification);
  }

  // Save all notifications
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  return notifications.length;
}

// Send notification to all leaders
export async function sendLeadersNotification({
  title,
  message,
  type,
  relatedTo,
}: {
  title: string;
  message: string;
  type: 'event' | 'attendance' | 'system' | 'reminder';
  relatedTo?: {
    model: 'Event' | 'Attendance' | 'Group' | 'User';
    id: mongoose.Types.ObjectId | string;
  };
}) {
  // Get all leaders
  const leaders = await User.find({ role: 'leader' }).select('_id').lean();

  const notifications = leaders.map(
    (leader) =>
      new Notification({
        recipient: leader._id,
        title,
        message,
        type,
        relatedTo,
      })
  );

  // Save all notifications
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  return notifications.length;
}

// Send reminder for upcoming events
export async function sendEventReminders(daysInAdvance = 1) {
  
  // Find events happening in the next X days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysInAdvance);
  
  const upcomingEvents = await Event.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate('group').lean();
  
  let reminderCount = 0;
  
  for (const event of upcomingEvents) {
    // Format date for message
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Send to group members
    const membersCount = await sendGroupNotification({
      groupId: event.group._id,
      title: 'Upcoming Event Reminder',
      message: `Reminder: "${event.title}" is scheduled for ${eventDate}${event.location ? ` at ${event.location}` : ''}.`,
      type: 'reminder',
      relatedTo: {
        model: 'Event',
        id: (event as { _id: mongoose.Types.ObjectId })._id.toString()
      }
    });
    
    reminderCount += membersCount;
  }
  
  return reminderCount;
}

// Send attendance marking reminders to leaders
export async function sendAttendanceReminders() {
  
  // Find events from yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const recentEvents = await Event.find({
    date: { $gte: yesterday, $lt: today }
  }).lean();
  
  let reminderCount = 0;
  
  for (const event of recentEvents) {
    // Check if attendance has been marked
    const attendanceExists = await Attendance.findOne({ event: event._id });
    
    if (!attendanceExists) {
      // Get the leader for this group
      const group = await Group.findById(event.group).populate('leader').lean();
      
      if (group && (group as any).leader) {
        // Send reminder to leader
        await sendNotification({
          recipientId: (group as any).leader._id,
          title: 'Attendance Marking Reminder',
          message: `Please mark attendance for the event "${event.title}" that took place yesterday.`,
          type: 'reminder',
          relatedTo: {
            model: 'Event',
            id: event._id
          }
        });
        
        reminderCount++;
      }
    }
  }
  
  return reminderCount;
}