import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Initialize web-push only if VAPID keys are available
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export async function POST(req: Request) {
  try {
    // Check if push notifications are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Push notifications are not configured' },
        { status: 501 }
      )
    }

    // Check if Supabase credentials are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration is missing' },
        { status: 501 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { userId, notification } = await req.json()

    // Get user's push subscription
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (fetchError) throw fetchError

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscription found for user' },
        { status: 404 }
      )
    }

    // Send push notification to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const subscription = JSON.parse(sub.subscription)
          await webpush.sendNotification(subscription, JSON.stringify(notification))
          return { success: true }
        } catch (error: any) {
          // If subscription is expired or invalid, delete it
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('subscription', sub.subscription)
          }
          return { success: false, error: error.message }
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
