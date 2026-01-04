// TaxWiseWeb/src/pages/AuthPage.tsx (Alternative - Direct Supabase approach)
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
  const { user, signIn, loading: authLoading } = useAuth();
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
      price: '₦100.00',
      rawPrice: 10000,
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
          description: 'Please fill all company details', 
          variant: 'destructive' 
        });
        return;
      }
      if (!isCompanyRep) {
        toast({ 
          title: 'Error', 
          description: 'Please confirm authorization', 
          variant: 'destructive' 
        });
        return;
      }
    }

    setLocalProcessing(true);

    try {
      console.log('🔵 Starting signup process...');
      
      // Direct Supabase signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            plan_tier: selectedPlan
          }
        }
      });

      console.log('🔵 Signup response:', signUpData);

      if (signUpError) {
        console.error('❌ Signup error:', signUpError);
        throw signUpError;
      }

      if (!signUpData.user) {
        console.error('❌ No user returned from signup');
        throw new Error('Failed to create user account');
      }

      const userId = signUpData.user.id;
      console.log('✅ User created:', userId);

      // Create/update profile using service role (bypass RLS)
      const profileData: any = {
        user_id: userId,
        full_name: `${firstName} ${lastName}`,
        email: email,
        account_type: selectedPlan === 'individual' ? 'individual' : 'corporate',
        subscription_status: 'pending',
        subscription_plan: selectedPlan,
        onboarding_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (selectedPlan !== 'individual') {
        profileData.company_name = companyName;
        profileData.company_size = companySize;
        profileData.job_title = jobTitle;
        profileData.is_company_rep = isCompanyRep;
      }

      console.log('🔵 Creating profile:', profileData);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('✅ Profile created successfully');

      // Now initiate payment
      await initiatePayment(userId, email);

    } catch (error: any) {
      console.error('❌ Signup process failed:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create account', 
        variant: 'destructive' 
      });
    } finally {
      setLocalProcessing(false);
    }
  };

  const initiatePayment = async (userId: string, userEmail: string) => {
    try {
      console.log('🔵 Initiating payment...');

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) {
        throw new Error("Invalid plan selected");
      }

      const paymentData: any = {
        email: userEmail,
        amount: plan.rawPrice,
        plan: selectedPlan,
        firstName: firstName,
        lastName: lastName,
        userId: userId
      };

      if (selectedPlan !== 'individual') {
        paymentData.companyName = companyName;
        paymentData.companySize = companySize;
        paymentData.jobTitle = jobTitle;
      }

      console.log('🔵 Payment data:', paymentData);

      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: paymentData
      });

      console.log('🔵 Payment response:', data);

      if (error) {
        console.error('❌ Payment error:', error);
        throw new Error(error.message || "Payment initialization failed");
      }

      if (!data) {
        throw new Error("No response from payment service");
      }

      if (!data.status) {
        throw new Error(data.message || "Payment initialization failed");
      }

      if (!data.data || !data.data.authorization_url) {
        console.error('❌ No authorization URL:', data);
        throw new Error("Payment URL not received from Paystack");
      }

      console.log('✅ Redirecting to Paystack...');
      
      // Redirect to Paystack
      window.location.href = data.data.authorization_url;

    } catch (error: any) {
      console.error('❌ Payment initialization failed:', error);
      
      toast({ 
        title: 'Payment Error', 
        description: error.message || 'Failed to initialize payment', 
        variant: 'destructive' 
      });

      // Wait a bit then redirect to pricing
      setTimeout(() => {
        toast({
          title: 'Redirecting',
          description: 'Taking you to pricing page to retry payment',
        });
        navigate('/pricing');
      }, 2000);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ 
        title: 'Error', 
        description: 'Please enter email and password', 
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
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
              </div>
              <Button className="w-full" type="submit">Send Reset Link</Button>
              <Button variant="ghost" className="w-full" type="button" onClick={() => setIsForgotPassword(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </form>
          ) : isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-3 pt-2">
                <Label>Select Account Type</Label>
                <RadioGroup value={selectedPlan} onValueChange={(v: any) => {
                  setSelectedPlan(v);
                  if (v === 'individual') {
                    setCompanyName('');
                    setCompanySize('');
                    setJobTitle('');
                    setIsCompanyRep(false);
                  }
                }} className="grid grid-cols-1 gap-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className={`relative flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-muted/50 ${selectedPlan === plan.id ? 'ring-2 ring-primary border-transparent bg-primary/5' : ''}`}>
                      <RadioGroupItem value={plan.id} id={plan.id} className="absolute left-3 top-3.5" />
                      <div className="flex-1 pl-8 cursor-pointer" onClick={() => setSelectedPlan(plan.id as any)}>
                        <div className="flex justify-between items-center w-full">
                          <span className="font-semibold text-sm flex items-center gap-2">
                            {plan.icon} {plan.name}
                          </span>
                          <span className="font-bold text-sm text-primary">{plan.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
              </div>

              {selectedPlan !== 'individual' && (
                <div className="space-y-4 pt-4 border-t mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Business Account:</strong> Please provide your company information
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input placeholder="e.g. Acme Corporation Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Your Job Title *</Label>
                      <Input placeholder="e.g. CEO, CFO" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Staff *</Label>
                      <Select value={companySize} onValueChange={setCompanySize} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-500">201-500</SelectItem>
                          <SelectItem value="500+">500+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <Checkbox id="rep" checked={isCompanyRep} onCheckedChange={(c) => setIsCompanyRep(c as boolean)} required className="mt-1" />
                    <Label htmlFor="rep" className="text-sm leading-tight font-normal text-gray-700 cursor-pointer">
                      I confirm that I am authorized to create this account on behalf of <strong>{companyName || 'the company'}</strong> and have the authority to enter into this agreement.
                    </Label>
                  </div>
                </div>
              )}

              <Button className="w-full mt-4 h-11 text-base" type="submit" disabled={localProcessing || authLoading}>
                {localProcessing || authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Processing...
                  </>
                ) : (
                  `Sign Up & Pay ${plans.find(p => p.id === selectedPlan)?.price}`
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
                  <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => setIsForgotPassword(true)}>
                    Forgot password?
                  </span>
                </div>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" />
              </div>
              <Button className="w-full h-11 text-base" type="submit" disabled={localProcessing || authLoading}>
                {localProcessing || authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? (
                <p>
                  Already have an account?{' '}
                  <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => setIsSignUp(false)}>
                    Sign In
                  </span>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => setIsSignUp(true)}>
                    Sign Up
                  </span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
