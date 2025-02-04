-- Verify user data
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.mobile,
    u.role,
    u.created_at,
    u.updated_at
FROM public.users u
WHERE u.email = 'motty.philip@gmail.com';

-- Update user if data is missing
UPDATE public.users
SET 
    full_name = COALESCE(full_name, 'Motty Philip'),
    mobile = COALESCE(mobile, ''),
    role = COALESCE(role, 'approver'),
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE email = 'motty.philip@gmail.com'
RETURNING *;
