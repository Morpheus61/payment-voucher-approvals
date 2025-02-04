-- Check if the users table exists, if not create it
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    mobile TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'approver', 'requester')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Update existing user if exists
UPDATE public.users
SET 
    role = 'approver',
    full_name = 'Motty Philip',
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE email = 'motty.philip@gmail.com';

-- If user doesn't exist in the users table but exists in auth.users, insert them
INSERT INTO public.users (id, email, full_name, role, mobile)
SELECT 
    au.id,
    'motty.philip@gmail.com',
    'Motty Philip',
    'approver',
    ''
FROM auth.users au
WHERE au.email = 'motty.philip@gmail.com'
    AND NOT EXISTS (
        SELECT 1 FROM public.users u WHERE u.email = 'motty.philip@gmail.com'
    );
