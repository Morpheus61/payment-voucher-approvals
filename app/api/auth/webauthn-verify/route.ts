import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const body = await req.json();
  
  const { data: challengeData } = await supabaseAdmin
    .from('webauthn_challenges')
    .select('challenge')
    .single();

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challengeData?.challenge,
    requireUserVerification: true,
  });

  if (verification.verified) {
    return new Response(JSON.stringify({ verified: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Verification failed' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
