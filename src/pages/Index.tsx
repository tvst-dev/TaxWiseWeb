/**
 * TaxWise Landing Page
 * Developed by Christera Chinyeaka, CEO Robust Technologies
 */

import { useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Calculator, TrendingUp, Shield, Users, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  // Apply system theme on initial load
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.toggle('dark', systemTheme === 'dark');
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            <span className="text-2xl font-bold">TaxWise</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          Nigeria Tax Reforms 2025 Compliant
        </Badge>
        <h1 className="text-5xl font-bold mb-6 max-w-4xl mx-auto">
          Simplify Your Nigerian
          <br />
          <span className="text-primary">Tax Management</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Track earnings, manage deductions, and calculate accurate tax obligations 
          based on Nigeria's latest 2025 tax reforms. For individuals, startups, and corporations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="min-w-48">
              Start Free Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="min-w-48">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tax management tools designed specifically for Nigerian tax laws
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 mb-2 text-success" />
              <CardTitle>Income Tracking</CardTitle>
              <CardDescription>
                Track all sources of income including salary, business income, investments, and rental income
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Multiple income categories</li>
                <li>• Monthly and yearly summaries</li>
                <li>• Export reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Smart Tax Calculator</CardTitle>
              <CardDescription>
                Automatic calculation based on Nigeria's 2025 tax brackets and latest reforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Progressive tax rates</li>
                <li>• Development levy calculation</li>
                <li>• VAT estimations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2 text-warning" />
              <CardTitle>Compliance Ready</CardTitle>
              <CardDescription>
                Stay compliant with NRS requirements and avoid penalties with timely reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Payment reminders</li>
                <li>• Penalty calculations</li>
                <li>• Filing deadlines</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tax Highlights */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">2025 Tax Highlights</h2>
            <p className="text-muted-foreground">Key changes in Nigeria's tax system</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-success mb-2">₦800,000</div>
                <p className="text-sm">Tax-free threshold for individuals</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary mb-2">₦50M</div>
                <p className="text-sm">Small business tax exemption limit</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-warning mb-2">25%</div>
                <p className="text-sm">New corporate tax rate (2026)</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-destructive mb-2">4%</div>
                <p className="text-sm">Unified Development Levy</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">For Every Type of Taxpayer</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-success" />
              <CardTitle>Individuals</CardTitle>
              <CardDescription>
                Salary earners, freelancers, and personal taxpayers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• PAYE calculations</li>
                <li>• Multiple income sources</li>
                <li>• Personal deductions</li>
                <li>• Tax relief optimization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Startups & SMEs</CardTitle>
              <CardDescription>
                Small businesses with turnover ≤ ₦50 million
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Tax exemption tracking</li>
                <li>• Business expense management</li>
                <li>• VAT calculations</li>
                <li>• Growth planning</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-warning" />
              <CardTitle>Large Companies</CardTitle>
              <CardDescription>
                Corporations with advanced tax obligations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Corporate income tax (27.5%)</li>
                <li>• Development levy (4%)</li>
                <li>• Quarterly payments</li>
                <li>• Compliance monitoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of Nigerians who trust TaxWise for their tax compliance needs
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="min-w-48">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>TaxWise By Koeta LTD</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p>&copy; 2025 TaxWise. Built for Nigeria's 2025 Tax Reforms.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
