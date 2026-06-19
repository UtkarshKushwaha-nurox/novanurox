// Razorpay webhook receiver — verifies HMAC SHA256 signature and records payments.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const signature = req.headers.get('x-razorpay-signature');
  const raw = await req.text();
  if (!signature) return new Response('Missing signature', { status: 400 });

  // Verify HMAC
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  if (expected !== signature) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(raw);
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;

  try {
    // Idempotent payment record
    if (payment) {
      await admin.from('payments').upsert({
        razorpay_payment_id: payment.id,
        razorpay_order_id: orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        event: event.event,
        raw: payment,
      }, { onConflict: 'razorpay_payment_id' });
    }

    // Update order status based on event
    if (orderId) {
      let newStatus: string | null = null;
      if (event.event === 'payment.captured') newStatus = 'paid';
      else if (event.event === 'payment.failed') newStatus = 'failed';
      else if (event.event === 'order.paid') newStatus = 'paid';

      if (newStatus) {
        await admin.from('orders').update({ status: newStatus }).eq('razorpay_order_id', orderId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('webhook error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
