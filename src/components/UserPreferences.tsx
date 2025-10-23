import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Moon, Sun, Monitor } from 'lucide-react';

interface UserPreferencesProps {
  onClose: () => void;
}

interface Preferences {
  theme_mode: 'light' | 'dark' | 'system';
  entry_notifications: boolean;
  tax_payment_notifications: boolean;
}

export function UserPreferences({ onClose }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    theme_mode: 'system',
    entry_notifications: true,
    tax_payment_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    applyTheme(preferences.theme_mode);
  }, [preferences.theme_mode]);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        // Create default preferences if they don't exist
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user?.id,
              theme_mode: 'system',
              entry_notifications: true,
              tax_payment_notifications: true,
            });
          
          if (insertError) throw insertError;
        } else {
          throw error;
        }
      } else {
        setPreferences({
          theme_mode: data.theme_mode as 'light' | 'dark' | 'system',
          entry_notifications: data.entry_notifications,
          tax_payment_notifications: data.tax_payment_notifications,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Preferences saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse">Loading preferences...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Preferences</DialogTitle>
          <DialogDescription>
            Customize your app experience and notification settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Theme</CardTitle>
              <CardDescription>
                Choose how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="text-sm font-medium">Theme Mode</label>
                <Select
                  value={preferences.theme_mode}
                  onValueChange={(value: any) => updatePreference('theme_mode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System Default
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Entry Notifications</label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when entries are added or updated
                  </p>
                </div>
                <Switch
                  checked={preferences.entry_notifications}
                  onCheckedChange={(checked) => updatePreference('entry_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Tax Payment Alerts</label>
                  <p className="text-xs text-muted-foreground">
                    Receive reminders about upcoming tax payments
                  </p>
                </div>
                <Switch
                  checked={preferences.tax_payment_notifications}
                  onCheckedChange={(checked) => updatePreference('tax_payment_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}