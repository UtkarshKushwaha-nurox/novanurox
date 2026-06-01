import { supabase } from "./supabase";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export type CheckoutArgs = {
  amount: number; // paise
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
};

export type CheckoutResult =
  | { status: "success"; payment_id: string; order_id: string }
  | { status: "failed"; message: string }
  | { status: "dismissed" };

export async function startRazorpayCheckout(args: CheckoutArgs): Promise<CheckoutResult> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    return { status: "failed", message: "Failed to load payment gateway." };
  }

  const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
    body: {
      amount: args.amount,
      currency: args.currency ?? "INR",
      receipt: args.receipt,
    },
  });
  if (error || !data?.order_id) {
    return { status: "failed", message: error?.message || data?.error || "Could not create order." };
  }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      order_id: data.order_id,
      name: args.name ?? "Nova Nurox",
      description: args.description ?? "Course Payment",
      prefill: args.prefill,
      notes: args.notes,
      theme: args.theme ?? { color: "#00ffa3" },
      modal: {
        ondismiss: () => resolve({ status: "dismissed" }),
      },
      handler: async (resp: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const { data: verify, error: vErr } = await supabase.functions.invoke(
          "razorpay-verify-payment",
          { body: resp },
        );
        if (vErr || !verify?.verified) {
          resolve({ status: "failed", message: vErr?.message || "Payment verification failed." });
          return;
        }
        resolve({
          status: "success",
          payment_id: resp.razorpay_payment_id,
          order_id: resp.razorpay_order_id,
        });
      },
    });

    rzp.open();
  });
}
