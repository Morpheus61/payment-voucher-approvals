import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resendApiKey = process.env.RESEND_API_KEY
if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not set in environment variables')
}

const resend = new Resend(resendApiKey)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@foodstream.in'

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json()

    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
