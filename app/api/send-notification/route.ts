import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: Request) {
  try {
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
