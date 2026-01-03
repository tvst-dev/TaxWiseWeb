// TaxWiseWeb/src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import DeveloperPortal from "./pages/DeveloperPortal";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import SubscriptionPage from "./pages/SubscriptionPage";
import ResetPassword from './pages/ResetPassword';
import PaymentCallback from './pages/PaymentCallback';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Payment Callback - Requires Auth but not Active Subscription */}
            <Route 
              path="/payment-callback" 
              element={
                <ProtectedRoute requiresActiveSubscription={false}>
                  <PaymentCallback />
                </ProtectedRoute>
              } 
            />
            
            {/* Pricing Page - Requires Auth but not Active Subscription */}
            <Route 
              path="/pricing" 
              element={
                <ProtectedRoute requiresActiveSubscription={false}>
                  <PricingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes - Require Active Subscription */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/developer" 
              element={
                <ProtectedRoute>
                  <DeveloperPortal />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
