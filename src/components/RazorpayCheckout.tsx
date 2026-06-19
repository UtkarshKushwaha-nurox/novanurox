import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window { Razorpay: any }
}

function loadScript(src: string) {
  return new Promise<boolean>((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Props = {
  amount: number; // in rupees
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  onSuccess?: (paymentId: string, orderId: string) => void;
  className?: string;
  children?: React.ReactNode;
};

export function RazorpayCheckout({
  amount, name = "Nova Nurox", description = "Payment",
  prefill, notes, onSuccess, className, children,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setLoading(true);
    try {
      const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!ok) throw new Error("Failed to load Razorpay");

      const { data, error: fnErr } = await supabase.functions.invoke("razorpay-create-order", {
        body: { amount: Math.round(amount * 100), currency: "INR", notes },
      });
      if (fnErr || !data?.order) throw new Error(fnErr?.message || "Could not create order");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name, description, prefill, notes,
        theme: { color: "#0ea5e9" },
        handler: (resp: any) => {
          // Final source of truth is the webhook; this is just UX.
          onSuccess?.(resp.razorpay_payment_id, resp.razorpay_order_id);
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.on("payment.failed", (r: any) => setError(r?.error?.description || "Payment failed"));
      rzp.open();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={pay} disabled={loading} className={className}>
        {loading ? <Loader2 className="size-4 animate-spin inline mr-2" /> : null}
        {children ?? `Pay ₹${amount}`}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
