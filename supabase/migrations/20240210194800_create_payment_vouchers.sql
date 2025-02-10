-- Create payment_vouchers table
CREATE TABLE IF NOT EXISTS public.payment_vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    requester_email TEXT NOT NULL,
    approver_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.payment_vouchers ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own vouchers
CREATE POLICY "Users can view their own vouchers"
    ON public.payment_vouchers
    FOR SELECT
    USING (
        auth.uid() = requester_id
        OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'approver')
        )
    );

-- Allow users to create vouchers
CREATE POLICY "Users can create vouchers"
    ON public.payment_vouchers
    FOR INSERT
    WITH CHECK (
        auth.uid() = requester_id
    );

-- Allow approvers and admins to update vouchers
CREATE POLICY "Approvers and admins can update vouchers"
    ON public.payment_vouchers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'approver')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.payment_vouchers
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
