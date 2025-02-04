-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all users
CREATE POLICY "Allow authenticated users to read all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to insert new users
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

-- Allow admins to update users
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

-- Allow admins to delete users
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
