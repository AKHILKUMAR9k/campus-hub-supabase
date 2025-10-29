import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@campushub.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email sending disabled.');
      return NextResponse.json({ success: false, message: 'Email service not configured' }, { status: 500 });
    }

    const body: EmailRequest = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, message: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
  }
}
