import { supabase } from '@/lib/supabaseClient'

// Initialize Supabase client only when needed
function getSupabaseClient() {
  return supabase
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribeToPushNotifications() {
  try {
    // Check if VAPID public key is available
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.log('Push notifications are not configured')
      return false
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    })

    try {
      // Get Supabase client
      const supabaseClient = getSupabaseClient()

      // Store the subscription in Supabase
      const { error } = await supabaseClient
        .from('push_subscriptions')
        .upsert({
          user_id: (await supabaseClient.auth.getUser()).data.user?.id,
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      return true
    } catch (dbError) {
      console.error('Error storing push subscription:', dbError)
      // Clean up the push subscription since we couldn't store it
      await subscription.unsubscribe()
      return false
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return false
  }
}

export async function sendNotification(userId: string, title: string, body: string, data?: any) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification: {
          title,
          body,
          data
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      // If push notifications are not configured, log it but don't treat it as an error
      if (response.status === 501) {
        console.log('Push notifications are not configured')
        return true
      }
      throw new Error(error.error || 'Failed to send notification')
    }
    return true
  } catch (error) {
    console.error('Error sending notification:', error)
    return false
  }
}
