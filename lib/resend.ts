// lib/resend.ts
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable')
}

// Initialize with just the API key as per v4.1.2
export const resend = new Resend(RESEND_API_KEY)