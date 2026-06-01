import { useState } from "react";
import { Loader2 } from "lucide-react";
import { startRazorpayCheckout, type CheckoutArgs } from "@/lib/razorpay";

type Props = {
  amount: number; // paise
  label?: string;
  className?: string;
  checkoutOptions?: Omit<CheckoutArgs, "amount">;
  onSuccess?: (payment_id: string, order_id: string) => void;
};

export function RazorpayButton({
  amount,
  label = "Pay with Razorpay",
  className,
  checkoutOptions,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setMessage(null);
    setLoading(true);
    const result = await startRazorpayCheckout({ amount, ...checkoutOptions });
    setLoading(false);
    if (result.status === "success") {
      setMessage("Payment successful!");
      onSuccess?.(result.payment_id, result.order_id);
    } else if (result.status === "failed") {
      setMessage(result.message);
    } else {
      setMessage("Payment cancelled.");
    }
  }

  return (
    <div className="inline-flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon h-12 px-7 text-sm font-bold text-background shadow-neon hover:scale-[1.01] transition-smooth disabled:opacity-60"
        }
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Processing..." : label}
      </button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}
