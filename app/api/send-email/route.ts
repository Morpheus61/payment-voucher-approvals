import { Resend } from 'resend'
import { NextResponse } from 'next/server'

// Validate environment variables
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'compliance@foodstream.in'

if (!resendApiKey) {
  console.error('RESEND_API_KEY is not set in environment variables')
}

// Initialize Resend only if we have an API key
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(req: Request) {
  try {
    // Check if Resend is initialized
    if (!resend) {
      throw new Error('Email service is not configured properly')
    }

    const { to, subject, html } = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error sending email:', error)
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
