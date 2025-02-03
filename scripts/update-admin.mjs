import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://usdlagyqeaveewjlncjk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGxhZ3lxZWF2ZWV3amxuY2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI5MzIzMSwiZXhwIjoyMDUzODY5MjMxfQ.QEA_r0uJNGLYHONCV8MCDAbrBmaeL0XPDnLDKVrhSRI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateAdmin() {
  try {
    // Update password
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      '4a298883-8259-415a-ab76-cd78f7d4d37f',
      { password: 'Motty1968' }
    )

    if (authError) {
      console.error('Auth Error:', authError)
      return
    }

    console.log('Password updated for user:', authData.user.id)

    // Update user details in users table
    const { error: dbError } = await supabase
      .from('users')
      .upsert([
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

    console.log('Super admin user updated successfully!')
  } catch (error) {
    console.error('Error updating admin:', error)
  }
}

updateAdmin()
