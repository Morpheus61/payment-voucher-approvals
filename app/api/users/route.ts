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
    const { data: { users: authUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (listUsersError) {
      console.error('Error fetching auth users:', listUsersError)
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
    console.log('Received request to create new user')
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the current user has admin access
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.getUser(token)
    
    if (getUserError) {
      console.error('Error getting user from token:', getUserError)
      return NextResponse.json({ error: 'Unauthorized', details: getUserError.message }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found from token')
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 })
    }

    // Verify user is an admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user role:', userError)
      return NextResponse.json({ error: 'Failed to verify user role', details: userError.message }, { status: 500 })
    }

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      console.error('User not authorized - Required admin role')
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get new user data from request body
    const newUser = await request.json()
    console.log('New user data:', newUser)

    // Validate required fields
    if (!newUser.email || !newUser.full_name || !newUser.role) {
      console.error('Missing required fields')
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Email, full name, and role are required'
      }, { status: 400 })
    }

    // Check both auth.users and public.users tables
    const { data: { users: authUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (listUsersError) {
      console.error('Error fetching auth users:', listUsersError)
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
    }

    const existingAuthUser = authUsers.find(user => user.email === newUser.email)

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', newUser.email)
      .single()

    if (existingAuthUser || existingUser) {
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
      console.error('Error creating auth user:', createAuthError)
      return NextResponse.json({ error: createAuthError.message }, { status: 400 })
    }

    if (!authData?.user?.id) {
      console.error('Auth user created but no ID returned')
      return NextResponse.json({ error: 'Failed to create user properly' }, { status: 500 })
    }

    // Add user details to users table
    const formattedMobile = newUser.mobile?.replace(/\+/g, '') // Remove + from mobile number if present
    
    console.log('Attempting to insert user with data:', {
      id: authData.user.id,
      email: newUser.email,
      full_name: newUser.full_name,
      mobile: formattedMobile,
      role: newUser.role || 'requester'
    })

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authData.user.id,
        email: newUser.email,
        full_name: newUser.full_name,
        mobile: formattedMobile,
        role: newUser.role || 'requester'
      }])

    if (dbError) {
      console.error('Error inserting into users table:', dbError)
      console.error('Error code:', dbError.code)
      console.error('Error details:', dbError.details)
      
      // Cleanup: delete the auth user if db insert fails
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (deleteError) {
        console.error('Failed to cleanup auth user after db error:', deleteError)
      }
      return NextResponse.json({ 
        error: 'Failed to create user in database',
        details: `${dbError.message}${dbError.details ? ` - ${dbError.details}` : ''}`
      }, { status: 400 })
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
