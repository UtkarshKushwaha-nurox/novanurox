// Creates a Razorpay order server-side and returns order details to the client.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { amount, currency = 'INR', receipt, notes } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount (in paise)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optional: capture user from JWT
    let userId: string | null = null;
    const auth = req.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data } = await sb.auth.getUser(auth.replace('Bearer ', ''));
      userId = data.user?.id ?? null;
    }

    // Create order via Razorpay REST API
    const basic = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${basic}` },
      body: JSON.stringify({
        amount, currency, receipt: receipt ?? `rcpt_${Date.now()}`,
        notes: { ...(notes ?? {}), user_id: userId ?? '' },
      }),
    });

    const order = await rzpRes.json();
    if (!rzpRes.ok) {
      return new Response(JSON.stringify({ error: order }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Persist order using service role (bypasses RLS)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await admin.from('orders').insert({
      razorpay_order_id: order.id,
      user_id: userId,
      amount, currency, status: 'created',
      receipt: order.receipt, notes: order.notes ?? {},
    });

    return new Response(JSON.stringify({ order, keyId: KEY_ID }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
