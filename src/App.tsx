import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PropertyProvider } from "@/context/PropertyContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Activities from "./pages/Activities";
import FnB from "./pages/FnB";
import Spa from "./pages/Spa";
import Transport from "./pages/Transport";
import Analytics from "./pages/Analytics";

import Comms from "./pages/Comms";
import Checkin from "./pages/Checkin";
import Reviews from "./pages/Reviews";

import Staff from "./pages/Staff";
import Payments from "./pages/Payments";
import Assets from "./pages/Assets";
import Settings from "./pages/Settings";
import HeroBanner from "./pages/HeroBanner";
import CraftedExperience from "./pages/CraftedExperience";
import RoomUpgrades from "./pages/RoomUpgrades";
import GuestManagement from "./pages/GuestManagement";
import NotFound from "./pages/NotFound";

// Analytics detail pages
import UpsellRevenueDetail from "./pages/analytics/UpsellRevenueDetail";
import GuestEngagementDetail from "./pages/analytics/GuestEngagementDetail";
import GuestSatisfactionDetail from "./pages/analytics/GuestSatisfactionDetail";
import ResponseTimeDetail from "./pages/analytics/ResponseTimeDetail";
import DigitalCheckinDetail from "./pages/analytics/DigitalCheckinDetail";
import RequestCompletionDetail from "./pages/analytics/RequestCompletionDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attempt) => Math.min(5_000 * 2 ** attempt, 30_000),
    },
  },
});

function AppContent() {
  const { isAuthenticated, isCheckingSession, logout } = useAuth();

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Login />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout onLogout={logout}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/activities" element={
              <ProtectedRoute sectionName="Experience Hub"><Activities /></ProtectedRoute>
            } />
            <Route path="/fnb" element={
              <ProtectedRoute sectionName="F&B Hub"><FnB /></ProtectedRoute>
            } />
            <Route path="/spa" element={
              <ProtectedRoute sectionName="Spa Hub"><Spa /></ProtectedRoute>
            } />
            <Route path="/transport" element={
              <ProtectedRoute sectionName="Transport Hub"><Transport /></ProtectedRoute>
            } />
            <Route path="/comms" element={
              <ProtectedRoute sectionName="Comms Hub"><Comms /></ProtectedRoute>
            } />
            <Route path="/checkin" element={
              <ProtectedRoute sectionName="Check-in Hub"><Checkin /></ProtectedRoute>
            } />
            <Route path="/guests" element={
              <ProtectedRoute sectionName="Guest Management"><GuestManagement /></ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute sectionName="Analytics"><Analytics /></ProtectedRoute>
            } />
            <Route path="/analytics/upsell-revenue" element={
              <ProtectedRoute sectionName="Analytics"><UpsellRevenueDetail /></ProtectedRoute>
            } />
            <Route path="/analytics/guest-engagement" element={
              <ProtectedRoute sectionName="Analytics"><GuestEngagementDetail /></ProtectedRoute>
            } />
            <Route path="/analytics/guest-satisfaction" element={
              <ProtectedRoute sectionName="Analytics"><GuestSatisfactionDetail /></ProtectedRoute>
            } />
            <Route path="/analytics/response-time" element={
              <ProtectedRoute sectionName="Analytics"><ResponseTimeDetail /></ProtectedRoute>
            } />
            <Route path="/analytics/digital-checkin" element={
              <ProtectedRoute sectionName="Analytics"><DigitalCheckinDetail /></ProtectedRoute>
            } />
            <Route path="/analytics/request-completion" element={
              <ProtectedRoute sectionName="Analytics"><RequestCompletionDetail /></ProtectedRoute>
            } />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/staff" element={
              <ProtectedRoute sectionName="Staff Management"><Staff /></ProtectedRoute>
            } />
            <Route path="/payments" element={<Payments />} />
            <Route path="/assets" element={
              <ProtectedRoute sectionName="App Banners"><Assets /></ProtectedRoute>
            } />
            <Route path="/assets/hero-banner" element={
              <ProtectedRoute sectionName="App Banners"><HeroBanner /></ProtectedRoute>
            } />
            <Route path="/assets/crafted-experience" element={
              <ProtectedRoute sectionName="App Banners"><CraftedExperience /></ProtectedRoute>
            } />
            <Route path="/assets/room-upgrades" element={
              <ProtectedRoute sectionName="App Banners"><RoomUpgrades /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute sectionName="Property Settings"><Settings /></ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  );
}

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <PropertyProvider>
        <AppContent />
      </PropertyProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
