/**
 * Email service for sending notifications
 * Uses the Next.js API route for sending emails
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateReminderEmail(eventTitle: string, eventDate: string, eventTime: string, reminderTime?: Date): EmailData {
  const reminderText = reminderTime
    ? `This is a reminder set for ${reminderTime.toLocaleString()}.`
    : 'This is your event reminder.';

  const subject = `Reminder: ${eventTitle} is coming up!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Event Reminder</h2>
      <p>Hi there!</p>
      <p>${reminderText}</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #2563eb;">${eventTitle}</h3>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${eventTime}</p>
      </div>
      <p>Don't forget to attend!</p>
      <p>Best regards,<br>Campus Hub Team</p>
    </div>
  `;

  return {
    to: '', // Will be set when called
    subject,
    html,
  };
}

export function generateCommentNotificationEmail(eventTitle: string, commenterName: string, commentText: string): EmailData {
  const subject = `New comment on "${eventTitle}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Comment on Your Event</h2>
      <p>Hi there!</p>
      <p>Someone commented on your past event "${eventTitle}":</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-style: italic;">"${commentText}"</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">- ${commenterName}</p>
      </div>
      <p>You can view all comments on the event page.</p>
      <p>Best regards,<br>Campus Hub Team</p>
    </div>
  `;

  return {
    to: '', // Will be set when called
    subject,
    html,
  };
}

export function generateRegistrationConfirmationEmail(eventTitle: string, eventDate: string, eventTime: string, venue: string): EmailData {
  const subject = `Registration Confirmed: ${eventTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Registration Confirmed!</h2>
      <p>Hi there!</p>
      <p>Your registration for the following event has been confirmed:</p>
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin: 0 0 10px 0; color: #2563eb;">${eventTitle}</h3>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${eventTime}</p>
        <p style="margin: 5px 0;"><strong>Venue:</strong> ${venue}</p>
      </div>
      <p>We look forward to seeing you there!</p>
      <p>Best regards,<br>Campus Hub Team</p>
    </div>
  `;

  return {
    to: '', // Will be set when called
    subject,
    html,
  };
}
