import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { initiatePayment, PaymentData } from '@/lib/paystack';
import { Loader2, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Sign up state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [userType, setUserType] = useState<'individual' | 'startup' | 'big_firm'>('individual');
  const [selectedPlan, setSelectedPlan] = useState<'individual' | 'small_business' | 'large_corporation'>('individual');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');

  // Check for password reset flow - redirect to separate reset page
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      // Redirect to the dedicated reset password page
      navigate('/reset-password', { replace: true });
    }
  }, [navigate]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !signUpEmail || !signUpPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (signUpPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setPaymentProcessing(true);

    try {
      // Get plan details
      const plan = plans.find(p => p.tier === selectedPlan);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Extract amount from price string (remove ₦ and commas)
      const amount = parseFloat(plan.price.replace('₦', '').replace(',', ''));

      // First create the user account
      const { error: signUpError } = await signUp(signUpEmail, signUpPassword, {
        firstName,
        lastName,
        userType,
      });

      if (signUpError) {
        throw signUpError;
      }

      // Then initiate payment for the selected plan
      const paymentData: PaymentData = {
        email: signUpEmail,
        amount: amount,
        plan: selectedPlan,
        userId: '', // Will be set by the payment handler after user creation
        isSignUp: true,
      };

      await initiatePayment(paymentData);

    } catch (error: unknown) {
      console.error('Error during signup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const plans = [
    {
      name: 'Individuals',
      tier: 'individual',
      price: '₦1,499.90',
      description: 'Perfect for individuals',
    },
    {
      name: 'Small Businesses',
      tier: 'small_business',
      price: '₦24,999.90',
      description: 'For growing businesses',
    },
    {
      name: 'Large Corporations',
      tier: 'large_corporation',
      price: '₦49,999.90',
      description: 'For large organizations',
    },
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signInEmail || !signInPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await signIn(signInEmail, signInPassword);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // CRITICAL: Set redirect to the reset-password page
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      console.log('Sending password reset email with redirect:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setForgotPasswordSuccess(true);
      console.log('Password reset email sent successfully');

    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Forgot Password Success Screen
  if (forgotPasswordSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a password reset link to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                A password reset link has been sent to <strong>{resetEmail}</strong>. 
                Please check your inbox and click the link to reset your password.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• The link will expire in 1 hour</p>
              <p>• Check your spam folder if you don't see the email</p>
              <p>• Click the link to be redirected to the password reset page</p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setForgotPasswordSuccess(false);
                  setIsForgotPassword(false);
                  setResetEmail('');
                }}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
              <Button 
                onClick={() => {
                  setForgotPasswordSuccess(false);
                  setResetEmail('');
                }}
                variant="ghost"
                className="flex-1"
              >
                Send Another Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPassword
              ? 'Enter your email to receive a password reset link'
              : isSignUp
              ? 'Sign up to start managing your taxes'
              : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setIsForgotPassword(false)}
                type="button"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </form>
          ) : isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signUpEmail">Email</Label>
                <Input
                  id="signUpEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signUpPassword">Password</Label>
                <Input
                  id="signUpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label>Choose Your Plan</Label>
                <RadioGroup value={selectedPlan} onValueChange={(value: 'individual' | 'small_business' | 'large_corporation') => setSelectedPlan(value)}>
                  {plans.map((plan) => (
                    <div key={plan.tier} className="flex items-center space-x-2">
                      <RadioGroupItem value={plan.tier} id={plan.tier} />
                      <Label htmlFor={plan.tier} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-sm text-muted-foreground">{plan.price}/month</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full" disabled={loading || paymentProcessing}>
                {loading || paymentProcessing ? 'Processing...' : `Create Account & Pay ${plans.find(p => p.tier === selectedPlan)?.price}/month`}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signInEmail">Email</Label>
                <Input
                  id="signInEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signInPassword">Password</Label>
                <Input
                  id="signInPassword"
                  type="password"
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Button
                variant="link"
                onClick={() => setIsForgotPassword(true)}
                type="button"
                className="w-full"
              >
                Forgot password?
              </Button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                type="button"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
