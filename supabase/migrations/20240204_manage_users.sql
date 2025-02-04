-- Function to create a new user
CREATE OR REPLACE FUNCTION create_new_user(
    p_email TEXT,
    p_full_name TEXT,
    p_mobile TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'user'
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    mobile TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Insert into users table
    RETURN QUERY
    INSERT INTO public.users (
        email,
        full_name,
        mobile,
        role,
        created_at,
        updated_at
    )
    VALUES (
        p_email,
        p_full_name,
        p_mobile,
        p_role,
        TIMEZONE('utc'::text, NOW()),
        TIMEZONE('utc'::text, NOW())
    )
    RETURNING 
        users.id,
        users.email,
        users.full_name,
        users.mobile,
        users.role,
        users.created_at,
        users.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function to update user details
CREATE OR REPLACE FUNCTION update_user_details(
    p_email TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_mobile TEXT DEFAULT NULL,
    p_role TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    mobile TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.users
    SET
        full_name = COALESCE(p_full_name, full_name),
        mobile = COALESCE(p_mobile, mobile),
        role = COALESCE(p_role, role),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE email = p_email
    RETURNING 
        users.id,
        users.email,
        users.full_name,
        users.mobile,
        users.role,
        users.created_at,
        users.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- Create a new user
-- SELECT * FROM create_new_user('john.doe@example.com', 'John Doe', '+1234567890', 'approver');

-- Update user details
-- SELECT * FROM update_user_details('john.doe@example.com', 'John M. Doe', '+9876543210');
