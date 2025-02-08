import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get users from public.users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, mobile, role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get users from auth.users table
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
    }

    // Check for inconsistencies
    const inconsistentUsers = authUsers.filter(authUser => 
      !users.some(user => user.id === authUser.id)
    ).map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    }))

    if (inconsistentUsers.length > 0) {
      console.error('Found users in auth but not in public.users:', inconsistentUsers)
    }

    return NextResponse.json({ 
      users,
      debug: {
        authUserCount: authUsers.length,
        publicUserCount: users.length,
        inconsistentUsers
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the current user has admin access
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get new user data from request body
    const newUser = await request.json()

    // Check both auth.users and public.users tables
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers({
      filters: [
        { property: 'email', operator: 'eq', value: newUser.email }
      ]
    })

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', newUser.email)
      .single()

    if (existingAuthUser?.users?.length > 0 || existingUser) {
      // If user exists in either table, return error
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Create user in Auth
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: newUser.email,
      password: Math.random().toString(36).slice(-8),
      email_confirm: true
    })

    if (createAuthError) {
      return NextResponse.json({ error: createAuthError.message }, { status: 400 })
    }

    // Add user details to users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authData.user.id,
        email: newUser.email,
        full_name: newUser.full_name,
        mobile: newUser.mobile,
        role: newUser.role
      }])

    if (dbError) {
      // Cleanup: delete the auth user if db insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    // Send password reset email
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      newUser.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      }
    )

    if (resetError) {
      console.error('Error sending password reset email:', resetError)
      // Don't return error since user is already created
    }

    return NextResponse.json({ user: authData.user })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
