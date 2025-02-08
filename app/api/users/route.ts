import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
    console.log('Received request to create new user')

    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify token and get user
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.getUser(token)
    
    if (getUserError || !user) {
      console.error('Auth error:', getUserError)
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: getUserError?.message 
      }, { status: 401 })
    }

    // Verify admin role
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userData) {
      console.error('Role verification error:', roleError)
      return NextResponse.json({ 
        error: 'Failed to verify user role',
        details: roleError?.message
      }, { status: 500 })
    }

    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Admin access required'
      }, { status: 403 })
    }

    // Process new user data
    const newUser = await request.json()
    
    // Validate required fields
    if (!newUser.email || !newUser.full_name || !newUser.role) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Email, full name, and role are required'
      }, { status: 400 })
    }

    // Create user in Auth
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: newUser.email,
      password: Math.random().toString(36).slice(-8),
      email_confirm: true,
      user_metadata: {
        full_name: newUser.full_name
      }
    })

    if (createAuthError) {
      console.error('Auth user creation error:', createAuthError)
      return NextResponse.json({ 
        error: 'Failed to create auth user',
        details: createAuthError.message 
      }, { status: 400 })
    }

    if (!authData?.user) {
      console.error('Auth user created but no user data returned')
      return NextResponse.json({ 
        error: 'Failed to create user properly'
      }, { status: 500 })
    }

    // Add to users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authData.user.id,
        email: newUser.email,
        full_name: newUser.full_name,
        mobile: newUser.mobile?.replace(/\+/g, ''),
        role: newUser.role
      }])

    if (dbError) {
      // Cleanup auth user if db insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to create user record',
        details: dbError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      user: authData.user
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
