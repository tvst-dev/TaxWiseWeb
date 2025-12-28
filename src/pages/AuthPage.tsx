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
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // UI States
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);

  // Standard Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Business Specific Fields
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isCompanyRep, setIsCompanyRep] = useState(false);

  // Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<'individual' | 'small_business' | 'large_corporation'>('individual');

  // Handle Redirection if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // --- PLANS CONFIGURATION ---
  const plans = [
    {
      id: 'individual',
      name: 'Individuals',
      price: '₦1,499.90',
      rawPrice: 149990,
      description: 'Perfect for individuals',
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30'
    },
    {
      id: 'small_business',
      name: 'Small Businesses',
      price: '₦24,999.90',
      rawPrice: 2499990,
      description: 'For growing businesses',
      color: 'bg-green-50 border-green-200 dark:bg-green-950/30'
    },
    {
      id: 'large_corporation',
      name: 'Large Corporations',
      price: '₦49,999.90',
      rawPrice: 4999990,
      description: 'For large organizations',
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30'
    },
  ];

  // --- HANDLERS ---

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation
    if (!firstName || !lastName || !email || !password) {
      toast({ title: 'Error', description: 'Please fill all basic fields', variant: 'destructive' });
      return;
    }

    if (selectedPlan !== 'individual') {
      if (!companyName || !companySize || !jobTitle) {
        toast({ title: 'Error', description: 'Please fill all company details', variant: 'destructive' });
        return;
      }
      if (!isCompanyRep) {
        toast({ title: 'Error', description: 'You must confirm you are a company representative', variant: 'destructive' });
        return;
      }
    }

    setLocalProcessing(true);

    try {
      // 2. Sign Up
      const { data: authData, error: signUpError } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        plan_tier: selectedPlan
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // 3. Prepare Profile Data
        const profileUpdates: any = {
          user_id: authData.user.id,
          full_name: `${firstName} ${lastName}`,
          account_type: selectedPlan === 'individual' ? 'individual' : 'corporate',
          updated_at: new Date().toISOString()
        };

        // Add Business Fields if applicable
        if (selectedPlan !== 'individual') {
          profileUpdates.company_name = companyName;
          profileUpdates.company_size = companySize;
          profileUpdates.job_title = jobTitle;
          profileUpdates.is_company_rep = isCompanyRep;
        }

        // 4. Create Profile Entry
        await supabase.from('profiles').upsert(profileUpdates);

        // 5. Trigger Payment
        await handlePayment(authData.user.id, email);
      }

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLocalProcessing(false);
    }
  };

  const handlePayment = async (userId: string, userEmail: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ 
          title: "Account Created", 
          description: "Please check your email to confirm your account, then log in to complete payment." 
        });
        return;
      }

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error("Invalid plan");

      // Call Payment Edge Function
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          email: userEmail,
          amount: plan.rawPrice,
          plan: selectedPlan,
          firstName,
          lastName
        }
      });

      if (error || !data.status) throw new Error("Payment initialization failed");

      // Redirect to Paystack
      window.location.href = data.data.authorization_url;

    } catch (e) {
      navigate('/dashboard'); 
    }
  };

  // ... (handleSignIn and handleForgotPassword remain the same) ...
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLocalProcessing(true);
    const { error } = await signIn(email, password);
    setLocalProcessing(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
      if (error) throw error;
      setForgotPasswordSuccess(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
            <Button variant="outline" className="w-full" onClick={() => setForgotPasswordSuccess(false)}>
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
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button className="w-full" type="submit">Send Reset Link</Button>
              <Button variant="ghost" className="w-full" onClick={() => setIsForgotPassword(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </form>
          ) : isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Plan Selection */}
              <div className="space-y-3 pt-2">
                <Label>Choose Your Plan</Label>
                <RadioGroup value={selectedPlan} onValueChange={(v: any) => setSelectedPlan(v)}>
                  {plans.map((plan) => (
                    <div key={plan.id} className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-all ${plan.color} ${selectedPlan === plan.id ? 'ring-2 ring-primary border-transparent' : 'hover:bg-gray-50'}`}>
                      <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedPlan(plan.id as any)}>
                        <div className="flex justify-between items-center w-full">
                          <span className="font-semibold text-sm">{plan.name}</span>
                          <span className="font-bold text-sm text-primary">{plan.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>

              {/* DYNAMIC BUSINESS FIELDS */}
              {selectedPlan !== 'individual' && (
                <div className="space-y-4 pt-4 border-t mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold text-sm">Company Details</h4>
                  
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input placeholder="e.g. Robust Tech Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input placeholder="e.g. CEO" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Employees</Label>
                      <Select value={companySize} onValueChange={setCompanySize} required>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="50-200">50-200</SelectItem>
                          <SelectItem value="200+">200+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox id="rep" checked={isCompanyRep} onCheckedChange={(c) => setIsCompanyRep(c as boolean)} required />
                    <Label htmlFor="rep" className="text-xs leading-tight font-normal">
                      I confirm I am authorized to create this account on behalf of the company.
                    </Label>
                  </div>
                </div>
              )}

              <Button className="w-full mt-4" type="submit" disabled={localProcessing || authLoading}>
                {localProcessing || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                 `Sign Up & Pay ${plans.find(p => p.id === selectedPlan)?.price}`}
              </Button>
            </form>
          ) : (
            // Sign In Form
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
                  <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => setIsForgotPassword(true)}>Forgot password?</span>
                </div>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button className="w-full" type="submit" disabled={localProcessing || authLoading}>
                {localProcessing || authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-6 text-center text-sm">
              {isSignUp ? (
                <p>Already have an account? <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => setIsSignUp(false)}>Sign In</span></p>
              ) : (
                <p>Don't have an account? <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => setIsSignUp(true)}>Sign Up</span></p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
