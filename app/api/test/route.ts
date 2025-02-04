import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'

export async function GET() {
  try {
    return NextResponse.json({
      productionReady: true,
      domain: 'www.foodstream.in',
      resendConfigured: !!resend,
      envLoaded: !!process.env.RESEND_API_KEY
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
