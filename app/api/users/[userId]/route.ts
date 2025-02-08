import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
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

    // Delete from auth.users first
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      params.userId
    )

    if (authDeleteError) {
      return NextResponse.json({ 
        error: 'Failed to delete user from auth',
        details: authDeleteError.message
      }, { status: 500 })
    }

    // Then delete from public.users
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', params.userId)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to delete user record',
        details: dbError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
