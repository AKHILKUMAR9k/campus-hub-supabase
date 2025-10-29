import { setDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { sendEmail, generateCommentNotificationEmail } from '@/lib/email-service';
import type { User } from '@/lib/types';

export interface Notification {
  id?: string;
  userId: string;
  type: 'reminder' | 'comment' | 'registration' | 'event_update' | 'system';
  title: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

/**
 * Create an in-app notification
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<void> {
  const fullNotification: Omit<Notification, 'id'> = {
    ...notification,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await setDocumentNonBlocking('notifications', fullNotification);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await setDocumentNonBlocking('notifications', { read: true }, notificationId);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  // This would require a more complex query to update multiple documents
  // For now, we'll handle this in the component
}

/**
 * Create notification for new comment on event
 */
export async function notifyEventComment(
  eventId: string,
  eventTitle: string,
  commenterName: string,
  commentText: string
): Promise<void> {
  // Get event organizer - we need to fetch the event data
  const { supabase } = await import('@/supabase/config');
  const { data: event } = await supabase.from('events').select('organizerId').eq('id', eventId).single();

  if (!event?.organizerId) return;

  await createNotification({
    userId: event.organizerId,
    type: 'comment',
    title: 'New Comment on Your Event',
    message: `${commenterName} commented on "${eventTitle}": "${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"`,
    eventId,
    eventTitle,
    actionUrl: `/dashboard/events/${eventId}`,
  });
}

/**
 * Create notification for event reminder
 */
export async function notifyEventReminder(
  userId: string,
  eventId: string,
  eventTitle: string,
  reminderTime: Date
): Promise<void> {
  await createNotification({
    userId,
    type: 'reminder',
    title: 'Event Reminder',
    message: `Reminder: "${eventTitle}" is happening soon (${reminderTime.toLocaleString()})`,
    eventId,
    eventTitle,
    actionUrl: `/dashboard/events/${eventId}`,
  });
}

/**
 * Create notification for successful registration
 */
export async function notifyRegistrationSuccess(
  userId: string,
  eventId: string,
  eventTitle: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'registration',
    title: 'Registration Confirmed',
    message: `You have successfully registered for "${eventTitle}"`,
    eventId,
    eventTitle,
    actionUrl: `/dashboard/events/${eventId}`,
  });
}

/**
 * Send email notification for comment (if enabled)
 */
export async function sendCommentEmailNotification(
  organizer: User,
  commenterName: string,
  commentText: string,
  eventTitle: string
): Promise<void> {
  if (!organizer.email || organizer.emailPreferences?.commentReplies === false) {
    return;
  }

  const emailData = generateCommentNotificationEmail(
    eventTitle,
    commenterName,
    commentText
  );
  emailData.to = organizer.email;

  try {
    await sendEmail(emailData);
  } catch (error) {
    console.error('Failed to send comment notification email:', error);
  }
}

/**
 * Get notification preferences for a user
 */
export function getNotificationPreferences(user: User) {
  return {
    emailReminders: user.emailPreferences?.eventReminders !== false,
    emailComments: user.emailPreferences?.commentReplies !== false,
    emailRegistrations: false, // Not implemented yet
    inAppNotifications: false, // Not implemented yet
  };
}
