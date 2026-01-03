// TaxWiseWeb/src/pages/AuthPage.tsx
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, ArrowLeft, Building2, User } from 'lucide-react';

export default function AuthPage() {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // UI States
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Business Fields
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isCompanyRep, setIsCompanyRep] = useState(false);

  // Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<'individual' | 'small_business' | 'large_corporation'>('individual');

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const plans = [
    {
      id: 'individual',
      name: 'Individual',
      price: '₦1,499.90',
      rawPrice: 149990,
      description: 'Perfect for freelancers',
      icon: <User className="h-4 w-4" />
    },
    {
      id: 'small_business',
      name: 'Small Business',
      price: '₦24,999.90',
      rawPrice: 2499990,
      description: 'For growing teams',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: 'large_corporation',
      name: 'Large Corp',
      price: '₦49,999.90',
      rawPrice: 4999990,
      description: 'For organizations',
      icon: <Building2 className="h-4 w-4" />
    },
  ];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate basic fields
    if (!firstName || !lastName || !email || !password) {
      toast({ 
        title: 'Error', 
        description: 'Please fill all basic fields', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate business fields for non-individual plans
    if (selectedPlan !== 'individual') {
      if (!companyName || !companySize || !jobTitle) {
        toast({ 
          title: 'Error', 
          description: 'Please fill all company details (Company Name, Number of Staff, and Job Title)', 
          variant: 'destructive' 
        });
        return;
      }
      if (!isCompanyRep) {
        toast({ 
          title: 'Error', 
          description: 'Please confirm you have the authority to create an account for this organization', 
          variant: 'destructive' 
        });
        return;
      }
    }

    setLocalProcessing(true);

    try {
      // Step 1: Sign up user
      const { data: authData, error: signUpError } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        plan_tier: selectedPlan
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Step 2: Update profile with all information
      const profileUpdates: any = {
        user_id: authData.user.id,
        full_name: `${firstName} ${lastName}`,
        account_type: selectedPlan === 'individual' ? 'individual' : 'corporate',
        updated_at: new Date().toISOString()
      };

      // Add business fields for non-individual plans
      if (selectedPlan !== 'individual') {
        profileUpdates.company_name = companyName;
        profileUpdates.company_size = companySize;
        profileUpdates.job_title = jobTitle;
        profileUpdates.is_company_rep = isCompanyRep;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileUpdates);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error('Failed to save profile information');
      }

      // Step 3: Initiate payment
      await handlePayment(authData.user.id, email);

    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create account', 
        variant: 'destructive' 
      });
    } finally {
      setLocalProcessing(false);
    }
  };

  const handlePayment = async (userId: string, userEmail: string) => {
    try {
      // Verify session exists
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ 
          title: "Account Created", 
          description: "Please check your email to confirm your account before payment." 
        });
        return;
      }

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) {
        throw new Error("Invalid plan selected");
      }

      // Prepare payment data with all required information
      const paymentBody: any = {
        email: userEmail,
        amount: plan.rawPrice,
        plan: selectedPlan,
        firstName: firstName,
        lastName: lastName,
        userId: userId
      };

      // Add company information for business plans
      if (selectedPlan !== 'individual') {
        paymentBody.companyName = companyName;
        paymentBody.companySize = companySize;
        paymentBody.jobTitle = jobTitle;
      }

      console.log('Initiating payment with data:', paymentBody);

      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: paymentBody
      });

      if (error) {
        console.error('Payment initialization error:', error);
        throw new Error(error.message || "Payment initialization failed");
      }

      if (!data || !data.status) {
        console.error('Payment response:', data);
        throw new Error("Invalid payment response");
      }

      // Redirect to Paystack
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error("Payment URL not received");
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({ 
        title: 'Payment Error', 
        description: error.message || 'Failed to initialize payment. Please try again from the pricing page.', 
        variant: 'destructive' 
      });
      
      // Redirect to pricing page so user can try payment again
      setTimeout(() => {
        navigate('/pricing');
      }, 2000);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }
    
    setLocalProcessing(true);
    const { error } = await signIn(email, password);
    setLocalProcessing(false);
    
    if (error) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: redirectUrl 
      });
      
      if (error) throw error;
      setForgotPasswordSuccess(true);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  if (forgotPasswordSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>We've sent a password reset link to {email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setForgotPasswordSuccess(false);
                setIsForgotPassword(false);
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPassword ? 'Enter your email to restore access' : 
             isSignUp ? 'Select a plan to get started' : 'Sign in to your dashboard'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="your@email.com"
                />
              </div>
              <Button className="w-full" type="submit">Send Reset Link</Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                type="button"
                onClick={() => setIsForgotPassword(false)}
              >
