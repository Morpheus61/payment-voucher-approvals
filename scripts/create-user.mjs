import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUser(email, temporaryPassword) {
  try {
    // Create the user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true // Auto-confirms the email
    })

    if (createError) throw createError

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    if (resetError) throw resetError

    console.log('User created successfully:', user)
    console.log('Password reset email sent to:', email)
  } catch (err) {
    console.error('Error creating user:', err.message)
  }
}

// Usage example:
// createUser('user@example.com', 'temporary-password-123')
