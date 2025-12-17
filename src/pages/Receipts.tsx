import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt as ReceiptIcon, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Receipt {
  id: string;
  vendor_name: string;
  category: string;
  amount: number;
  created_at: string;
}

export default function Receipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (user) fetchReceipts();
  }, [user]);

  const fetchReceipts = async () => {
    const { data } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setReceipts(data as Receipt[]);
  };

  const addReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('receipts').insert({
        user_id: user.id,
        vendor_name: vendor,
        category: category,
        amount: parseFloat(amount),
        description: `Expense at ${vendor}`
      });

      if (error) throw error;

      toast({ 
        title: "Receipt Logged", 
        description: "Added to tax deductions automatically." 
      });
      setShowForm(false);
      setVendor(''); setCategory(''); setAmount('');
      fetchReceipts();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save receipt.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Receipts & Expenses</h1>
          <p className="text-muted-foreground">Track business costs</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Log Expense
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-orange-200 bg-orange-50/30">
          <CardHeader><CardTitle>Log New Expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addReceipt} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Vendor / Store</Label>
                  <Input required value={vendor} onChange={e => setVendor(e.target.value)} placeholder="e.g. Apple Store" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input required value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Hardware" />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input required type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="destructive" className="bg-orange-600 hover:bg-orange-700">Save Receipt</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {receipts.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ReceiptIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-bold">{r.vendor_name}</h4>
                <p className="text-sm text-muted-foreground">{r.category}</p>
              </div>
            </div>
            <div className="font-bold text-lg text-red-600">
              -₦{r.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
