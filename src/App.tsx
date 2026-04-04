import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ThemeProvider } from "@/hooks/useTheme";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Books from "./pages/Books";
import Marketplace from "./pages/Marketplace";
import Sell from "./pages/Sell";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetail";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/books" element={<Books />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-primary">Loading...</div></div>}><Admin /></Suspense>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
