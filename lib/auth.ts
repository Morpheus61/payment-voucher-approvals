import { createClient } from '@supabase/supabase-js'

// Auth-specific helper functions using the singleton client

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
