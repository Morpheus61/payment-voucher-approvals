import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'compliance@foodstream.in';

export async function POST(request: Request) {
  if (!resend) {
    console.error('RESEND_API_KEY is not configured in environment variables');
    return NextResponse.json(
      { error: 'Email service is not configured' },
      { status: 500 }
    );
  }

  try {
    const { to, subject, html } = await request.json();

    const data = await resend.emails.send({
      from: `Payment Approvals <${RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': `pv-${new Date().getTime()}`,
      },
      tags: [
        {
          name: 'category',
          value: 'payment-voucher-approvals'
        }
      ]
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
