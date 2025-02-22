-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.users;
DROP POLICY IF EXISTS "Allow admins to insert users" ON public.users;
DROP POLICY IF EXISTS "Allow admins to update users" ON public.users;
DROP POLICY IF EXISTS "Allow admins to delete users" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies with proper permissions
CREATE POLICY "Allow authenticated users to read all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Allow admins to update users"
ON public.users
FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Allow admins to delete users"
ON public.users
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'super_admin')
    )
);

-- Verify Motty Philip's data
SELECT * FROM public.users WHERE email = 'motty.philip@gmail.com';

-- Update Motty Philip's data if needed
UPDATE public.users
SET 
    full_name = 'Motty Philip',
    role = 'approver',
    mobile = COALESCE(mobile, ''),
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE email = 'motty.philip@gmail.com'
RETURNING *;

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
