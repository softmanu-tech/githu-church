import dbConnect from './dbConnect';
import { User } from './models/User';
import { Notification } from './models/Notification';
import Event from './models/Event';
import { Group } from './models/Group';
import { Attendance } from './models/Attendance';

// Create a notification for a single user
export async function createNotification(
  recipientId: string,
  type: 'event' | 'attendance' | 'system',
  title: string,
  message: string,
  relatedId?: string
) {
  await dbConnect();

  const notification = new Notification({
    recipient: recipientId,
    type,
    title,
    message,
    relatedId,
    isRead: false
  });

  return notification.save();
}

// Create notifications for all members of a group
export async function notifyGroupMembers(
  groupId: string,
  type: 'event' | 'attendance' | 'system',
  title: string,
  message: string,
  relatedId?: string
) {
  await dbConnect();

  // Get all members of the group
  const members = await User.find({ group: groupId, role: 'member' });
  const leader = await User.findOne({ group: groupId, role: 'leader' });

  const notifications = [];

  // Create notifications for each member
  for (const member of members) {
    notifications.push({
      recipient: member._id,
      type,
      title,
      message,
      relatedId,
      isRead: false
    });
  }

  // Create notification for the leader
  if (leader) {
    notifications.push({
      recipient: leader._id,
      type,
      title,
      message,
      relatedId,
      isRead: false
    });
  }

  if (notifications.length > 0) {
    return Notification.insertMany(notifications);
  }

  return [];
}

// Create notifications for upcoming events
export async function createUpcomingEventNotifications() {
  await dbConnect();

  // Get events happening in the next 24 hours
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const today = new Date();
  
  const upcomingEvents = await Event.find({
    date: { $gte: today, $lte: tomorrow }
  }).populate('group');

  for (const event of upcomingEvents) {
    // Create notification for all members of the group
    await notifyGroupMembers(
      event.group._id.toString(),
      'event',
      'Upcoming Event',
      `Reminder: "${event.title}" is happening on ${event.date.toLocaleDateString()}`,
      event._id.toString()
    );
  }
}

// Create notifications for leaders to mark attendance
export async function createAttendanceReminderNotifications() {
  await dbConnect();

  // Get events from the past 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const today = new Date();
  
  const recentEvents = await Event.find({
    date: { $gte: yesterday, $lte: today }
  });

  for (const event of recentEvents) {
    // Check if attendance has been marked
    const attendanceExists = await Attendance.findOne({ event: event._id });
    
    if (!attendanceExists) {
      // Find the leader of the group for this event
      const group = await Group.findById(event.group);
      if (group && group.leader) {
        await createNotification(
          group.leader.toString(),
          'attendance',
          'Mark Attendance Required',
          `Please mark attendance for the event "${event.title}" that took place on ${event.date.toLocaleDateString()}`,
          event._id.toString()
        );
      }
    }
  }
}