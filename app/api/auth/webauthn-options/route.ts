import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  const options = await generateAuthenticationOptions({
    timeout: 60000,
    userVerification: 'required',
  });

  await supabaseAdmin
    .from('webauthn_challenges')
    .upsert({ challenge: options.challenge });

  return new Response(JSON.stringify(options), {
    headers: { 'Content-Type': 'application/json' },
  });
}
