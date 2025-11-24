import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User, Phone, MapPin, Briefcase, Hash, Users, Home, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProfileData {
  full_name: string;
  tin: string;
  phone_number: string;
  address: string;
  occupation: string;
  marital_status: string;
  is_resident: boolean;
  number_of_dependents: number;
  annual_rent_paid: number;
}

export function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    tin: '',
    phone_number: '',
    address: '',
    occupation: '',
    marital_status: 'single',
    is_resident: true,
    number_of_dependents: 0,
    annual_rent_paid: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && !error) {
        setProfile({
          full_name: data.full_name || '',
          tin: data.tin || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          occupation: data.occupation || '',
          marital_status: data.marital_status || 'single',
          is_resident: data.is_resident !== false,
          number_of_dependents: data.number_of_dependents || 0,
          annual_rent_paid: data.annual_rent_paid || 0,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile saved successfully',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // CRA Calculations
  const basicRelief = 200000;
  const rentRelief = Math.min((profile.annual_rent_paid || 0) * 0.20, 100000);
  const dependentsRelief = Math.min(profile.number_of_dependents || 0, 4) * 5000;
  const totalCRA = basicRelief + rentRelief + dependentsRelief;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Basic details for your tax profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
              <Input
                id="tin"
                value={profile.tin}
                onChange={(e) => updateField('tin', e.target.value)}
                placeholder="Optional"
                icon={<Hash className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone_number}
                onChange={(e) => updateField('phone_number', e.target.value)}
                placeholder="+234 XXX XXX XXXX"
                icon={<Phone className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={profile.occupation}
                onChange={(e) => updateField('occupation', e.target.value)}
                placeholder="Your occupation"
                icon={<Briefcase className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Full address"
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select
                value={profile.marital_status}
                onValueChange={(value) => updateField('marital_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_resident">Nigerian Tax Resident</Label>
                <p className="text-xs text-muted-foreground">
                  Are you a resident for tax purposes?
                </p>
              </div>
              <Switch
                id="is_resident"
                checked={profile.is_resident}
                onCheckedChange={(checked) => updateField('is_resident', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Relief Information */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Tax Relief Information
          </CardTitle>
          <CardDescription>
            Details for calculating your Consolidated Relief Allowance (CRA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Number of Dependents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Number of Dependents</Label>
                <p className="text-sm text-muted-foreground">
                  Max 4 dependents (₦5,000 relief each)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateField('number_of_dependents', Math.max(0, profile.number_of_dependents - 1))}
                  disabled={profile.number_of_dependents <= 0}
                >
                  -
                </Button>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {profile.number_of_dependents}
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateField('number_of_dependents', Math.min(4, profile.number_of_dependents + 1))}
                  disabled={profile.number_of_dependents >= 4}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Tax Relief: ₦{dependentsRelief.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Annual Rent */}
          <div className="space-y-2">
            <Label htmlFor="annual_rent">Annual Rent Paid</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₦
              </span>
              <Input
                id="annual_rent"
                type="number"
                value={profile.annual_rent_paid}
                onChange={(e) => updateField('annual_rent_paid', Number(e.target.value))}
                placeholder="0"
                className="pl-8"
                min="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              20% of rent (max ₦100,000 relief)
            </p>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Tax Relief: ₦{rentRelief.toLocaleString()}
              </p>
            </div>
          </div>

          {/* CRA Summary */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-lg text-white space-y-3">
            <h4 className="font-semibold">Estimated Tax Relief (CRA)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between opacity-90">
                <span>Basic Relief</span>
                <span>₦{basicRelief.toLocaleString()}</span>
              </div>
              <div className="flex justify-between opacity-90">
                <span>Rent Relief</span>
                <span>₦{rentRelief.toLocaleString()}</span>
              </div>
              <div className="flex justify-between opacity-90">
                <span>Dependents Relief</span>
                <span>₦{dependentsRelief.toLocaleString()}</span>
              </div>
              <div className="border-t border-white/30 pt-2 flex justify-between font-bold text-base">
                <span>Total CRA</span>
                <span>₦{totalCRA.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
