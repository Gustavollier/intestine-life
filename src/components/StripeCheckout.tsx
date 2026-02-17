import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(
  "pk_test_51T1fJqEHQV2CTGY3Zw8UK0JBAMDF33KlCCdLZfAgeMHpN7nahzJaiPdTYHHTYP7owm3W9rNtK3m6QW0Eb9GpyRc600Xge2Quy9"
);

interface StripeCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeCheckout({ open, onOpenChange }: StripeCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("create-checkout");
    if (fnError || !data?.clientSecret) {
      const msg = fnError?.message || "Erro ao iniciar checkout";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret as string;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl sm:max-w-xl md:max-w-2xl [&>button]:z-50">
        <div className="min-h-[400px] max-h-[85vh] overflow-y-auto">
          {error ? (
            <div className="flex items-center justify-center h-[400px] p-6 text-center text-destructive text-sm">
              {error}
            </div>
          ) : (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
