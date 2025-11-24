import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Code, Copy, Eye, EyeOff, Key, Trash2, ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  subscription_tier: string;
  usage: number;
  created_at: string;
  status: string;
  user_id: string;
  key_hash: string;
  updated_at: string;
}

export default function DeveloperPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{ tier: string } | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (user) {
      checkSubscription();
      fetchApiKeys();
    }
  }, [user]);

  const checkSubscription = async () => {
    const { data } = await supabase
      .from('api_subscriptions')
      .select('tier')
      .single();

    setSubscription(data);
    setCheckingAccess(false);
  };

  const fetchApiKeys = async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive',
      });
      return;
    }

    setApiKeys(data || []);
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a key name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Generate a random API key
    const randomKey = `tw_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const keyPrefix = randomKey.substring(0, 10);

    const { error } = await supabase.from('api_keys').insert({
      user_id: user?.id,
      name: newKeyName,
      key_hash: randomKey,
      prefix: keyPrefix,
      subscription_tier: subscription?.tier || 'free',
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate API key',
        variant: 'destructive',
      });
      return;
    }

    setGeneratedKey(randomKey);
    setNewKeyName('');
    fetchApiKeys();

    toast({
      title: 'Success',
      description: 'API key generated successfully',
    });
  };

  const deleteApiKey = async (id: string) => {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive',
      });
      return;
    }

    fetchApiKeys();
    toast({
      title: 'Success',
      description: 'API key deleted',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  const rateLimits = {
    individuals: '1,000 requests/month',
    small_businesses: '10,000 requests/month',
    large_corporations: '100,000 requests/month',
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">Checking access...</div>
        </div>
      </div>
    );
  }

  // Require paid subscription for API access
  if (!subscription) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="mb-6">
              <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-3xl font-bold mb-2">Developer API Access</h1>
              <p className="text-muted-foreground text-lg">
                Upgrade to Pro or Enterprise to access our powerful Tax Calculation API
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>API Features</CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-3">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Generate API Keys</p>
                    <p className="text-sm text-muted-foreground">
                      Create and manage multiple API keys for your applications
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">RESTful API Access</p>
                    <p className="text-sm text-muted-foreground">
                      Integrate tax calculations directly into your applications
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Usage Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Track API usage and monitor request patterns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button size="lg" onClick={() => navigate('/pricing')}>
              View Plans & Upgrade
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Developer Portal</h1>
            <p className="text-muted-foreground">
              Generate and manage API keys for TaxWise Tax Calculation API
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {subscription.tier.toUpperCase()} Plan
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Individuals Tier</CardTitle>
              <CardDescription>Perfect for testing and small projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">₦1,499.90/month</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ 1,000 requests/month</li>
                  <li>✓ Basic tax calculations</li>
                  <li>✓ Community support</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Small Businesses Tier</CardTitle>
              <CardDescription>For production applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">₦24,999.90/month</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ 10,000 requests/month</li>
                  <li>✓ Advanced calculations</li>
                  <li>✓ Priority support</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">
                  Upgrade to Small Businesses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate New API Key</CardTitle>
            <CardDescription>Create a new API key for your application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={generateApiKey} disabled={loading}>
                  <Key className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </div>
            </div>

            {generatedKey && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Your new API key:</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <code className="text-sm break-all">
                  {showKey ? generatedKey : '•'.repeat(generatedKey.length)}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Save this key now. You won't be able to see it again.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>Manage your existing API keys</CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No API keys yet. Generate one to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{key.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {key.prefix}••••••••
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Tier: <span className="font-semibold">{key.subscription_tier}</span>
                        </span>
                        <span>
                          Usage: <span className="font-semibold">{key.usage}</span> requests this month
                        </span>
                        <span>
                          Limit: <span className="font-semibold">{rateLimits[key.subscription_tier as keyof typeof rateLimits]}</span>
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              <Code className="h-5 w-5 inline mr-2" />
              API Documentation
            </CardTitle>
            <CardDescription>How to use the TaxWise Tax Calculation API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Endpoint</h3>
              <code className="block p-3 bg-muted rounded text-sm">
                POST https://kzvrcgmrcqwctcpebskk.supabase.co/functions/v1/calculate-tax
              </code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Headers</h3>
              <code className="block p-3 bg-muted rounded text-sm">
                x-api-key: YOUR_API_KEY<br />
                Content-Type: application/json
              </code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Request Body</h3>
              <code className="block p-3 bg-muted rounded text-sm whitespace-pre">
{`{
  "income": 5000000,
  "deductions": 500000,
  "year": 2025
}`}
              </code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Example (JavaScript)</h3>
              <code className="block p-3 bg-muted rounded text-sm whitespace-pre overflow-x-auto">
{`const response = await fetch(
  'https://kzvrcgmrcqwctcpebskk.supabase.co/functions/v1/calculate-tax',
  {
    method: 'POST',
    headers: {
      'x-api-key': 'YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      income: 5000000,
      deductions: 500000,
    }),
  }
);

const data = await response.json();
console.log(data);`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
