import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { AuthenticationResponseJSON } from '@simplewebauthn/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json() as AuthenticationResponseJSON;
    
    // Get the challenge from the session
    const { data: challengeData } = await supabaseAdmin
      .from('auth_challenge')
      .select('challenge')
      .single();

    if (!challengeData?.challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the credential from the database
    const { data: credentialData } = await supabaseAdmin
      .from('credentials')
      .select('*')
      .eq('id', body.id)
      .single();

    if (!credentialData) {
      return new Response(JSON.stringify({ error: 'Credential not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin');
    const rpID = process.env.RP_ID;

    if (!origin || !rpID) {
      return new Response(JSON.stringify({ error: 'Missing origin or RP_ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: credentialData.id,
        publicKey: credentialData.publicKey,
        counter: credentialData.counter,
      }
    });

    if (verification.verified) {
      // Update the credential counter
      await supabaseAdmin
        .from('credentials')
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq('id', body.id);

      return new Response(JSON.stringify({ verified: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ verified: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('WebAuthn verification error:', error);
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
