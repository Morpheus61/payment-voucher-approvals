import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdmin() {
  try {
    // Create admin user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'compliance@foodstream.in',
      password: 'Motty1968',
      email_confirm: true
    })

    if (authError) throw authError

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

    if (dbError) throw dbError

    console.log('Super admin user created successfully!')
  } catch (error) {
    console.error('Error setting up admin:', error)
  }
}

setupAdmin()
