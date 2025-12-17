import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Invoice {
  id: string;
  client_name: string;
  title: string;
  amount: number;
  status: 'pending' | 'paid';
  created_at: string;
}

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setInvoices(data as Invoice[]);
    setLoading(false);
  };

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        client_name: clientName,
        title: title,
        amount: parseFloat(amount),
        status: 'pending'
      });

      if (error) throw error;

      toast({ title: "Invoice Created", description: "Saved successfully." });
      setShowForm(false);
      // Reset form
      setClientName(''); setTitle(''); setAmount('');
      fetchInvoices();
    } catch (error) {
      toast({ title: "Error", description: "Could not create invoice.", variant: "destructive" });
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id);

      if (error) throw error;

      toast({ 
        title: "Payment Recorded", 
        description: "This has been automatically added to your Earnings." 
      });
      fetchInvoices();
    } catch (error) {
      toast({ title: "Error", description: "Update failed.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage client billing</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader><CardTitle>Create New Invoice</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createInvoice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label>Service Description</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Website Design" />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input required type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Generate Invoice</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((inv) => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{inv.client_name}</h3>
                    <p className="text-sm text-muted-foreground">{inv.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-xl">₦{inv.amount.toLocaleString()}</div>
                    <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className={inv.status === 'paid' ? 'bg-green-600' : ''}>
                      {inv.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {inv.status !== 'paid' && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => markAsPaid(inv.id)}>
                      <Check className="mr-2 h-4 w-4" /> Mark Paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {invoices.length === 0 && !showForm && (
            <div className="text-center text-muted-foreground py-10">No invoices found. Create your first one!</div>
          )}
        </div>
      )}
    </div>
  );
}
