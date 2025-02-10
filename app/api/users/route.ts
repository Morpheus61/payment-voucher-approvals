import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth'

export async function GET() {
  try {
    // Get users from public.users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, mobile, role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email, role, full_name, mobile } = await request.json()

    // Create the user in auth.users
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        mobile,
        role
      }
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return NextResponse.json({ error: createUserError.message }, { status: 500 })
    }

    // Insert the user into public.users table
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authUser.user.id,
          email,
          full_name,
          mobile,
          role
        }
      ])

    if (insertError) {
      console.error('Error inserting user data:', insertError)
      // Attempt to clean up the auth user since we couldn't create the full user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ user: authUser.user })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
