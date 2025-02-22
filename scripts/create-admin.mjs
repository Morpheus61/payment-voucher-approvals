import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://usdlagyqeaveewjlncjk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGxhZ3lxZWF2ZWV3amxuY2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI5MzIzMSwiZXhwIjoyMDUzODY5MjMxfQ.QEA_r0uJNGLYHONCV8MCDAbrBmaeL0XPDnLDKVrhSRI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdmin() {
  try {
    // Create admin user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'compliance@foodstream.in',
      password: 'Motty1968',
      email_confirm: true
    })

    if (authError) {
      console.error('Auth Error:', authError)
      return
    }

    console.log('Auth user created:', authData.user.id)

    // Add user details to users table
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: 'compliance@foodstream.in',
          role: 'admin',
          full_name: 'Super Admin',
        }
      ])

    if (dbError) {
      console.error('Database Error:', dbError)
      return
    }

    console.log('Super admin user created successfully!')
  } catch (error) {
    console.error('Error setting up admin:', error)
  }
}

setupAdmin()
