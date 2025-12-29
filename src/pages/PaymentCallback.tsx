import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const reference = searchParams.get('reference'); // Paystack standard param
  // Sometimes Paystack appends 'trxref' instead
  const trxref = searchParams.get('trxref') || reference;

  useEffect(() => {
    if (trxref) {
      verifyPayment(trxref);
    } else {
      // If no reference, user probably navigated here manually
      navigate('/dashboard');
    }
  }, [trxref]);

  const verifyPayment = async (ref: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { reference: ref }
      });

      if (error || !data.status) throw new Error(data?.message || "Verification failed");

      setStatus('success');
      toast({ title: "Success!", description: "Subscription activated successfully." });
      
      // Delay redirect slightly so user sees success state
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (e) {
      console.error(e);
      setStatus('failed');
      toast({ 
        title: "Verification Failed", 
        description: "Could not verify payment. Please contact support.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center py-10">
        <CardContent>
          {status === 'verifying' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Verifying Payment...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your transaction.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 animate-in zoom-in duration-300">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
              <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-red-700">Verification Failed</h2>
              <p className="text-muted-foreground">We couldn't confirm your payment.</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-primary underline mt-4 inline-block"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
