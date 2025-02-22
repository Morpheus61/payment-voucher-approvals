-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to notify approvers
CREATE OR REPLACE FUNCTION notify_approvers()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify on new vouchers
    IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
        -- Get all approvers
        PERFORM
            pg_notify(
                'new_voucher',
                json_build_object(
                    'user_id', approver.id,
                    'title', 'New Voucher Request',
                    'body', format('New voucher request from %s for %s', NEW.requester_name, NEW.amount),
                    'data', json_build_object(
                        'url', format('/admin/voucher/%s', NEW.id),
                        'voucher_id', NEW.id
                    )
                )::text
            )
        FROM public.users approver
        WHERE approver.role = 'approver';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to notify requesters
CREATE OR REPLACE FUNCTION notify_requester()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify when status changes to approved or rejected
    IF (TG_OP = 'UPDATE' AND 
        OLD.status = 'pending' AND 
        (NEW.status = 'approved' OR NEW.status = 'rejected')) THEN
        
        PERFORM
            pg_notify(
                'voucher_decision',
                json_build_object(
                    'user_id', NEW.requester_id,
                    'title', format('Voucher %s', NEW.status),
                    'body', format(
                        'Your voucher for %s has been %s', 
                        NEW.amount,
                        NEW.status
                    ),
                    'data', json_build_object(
                        'url', format('/voucher/%s', NEW.id),
                        'voucher_id', NEW.id
                    )
                )::text
            )
        FROM public.users
        WHERE id = NEW.requester_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS voucher_notify_approvers ON public.vouchers;
CREATE TRIGGER voucher_notify_approvers
    AFTER INSERT ON public.vouchers
    FOR EACH ROW
    EXECUTE FUNCTION notify_approvers();

DROP TRIGGER IF EXISTS voucher_notify_requester ON public.vouchers;
CREATE TRIGGER voucher_notify_requester
    AFTER UPDATE ON public.vouchers
    FOR EACH ROW
    EXECUTE FUNCTION notify_requester();
