import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopNav } from "@/components/layout/TopNav";
import { FileText, Plus, Users, User, LayoutDashboard, BarChart3 } from 'lucide-react';
import Auth from "./pages/Auth";
import MyComplaints from "./pages/MyComplaints";
import NewComplaint from "./pages/NewComplaint";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";

const studentNavItems = [
  { title: 'My Complaints', url: '/my-complaints', icon: FileText },
  { title: 'New', url: '/new-complaint', icon: Plus },
  { title: 'Community', url: '/community', icon: Users },
  { title: 'Profile', url: '/profile', icon: User },
];

const adminNavItems = [
  { title: 'Dashboard', url: '/admin-dashboard', icon: LayoutDashboard },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Profile', url: '/profile', icon: User },
];

const queryClient = new QueryClient();

// Smart root redirect component
const RootRedirect = () => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return role === 'admin' 
    ? <Navigate to="/admin-dashboard" replace />
    : <Navigate to="/my-complaints" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth();
  const navItems = role === 'admin' ? adminNavItems : studentNavItems;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 pb-20 md:pb-0">
          <TopNav />
          {children}
        </main>
      </div>
      <BottomNav items={navItems} />
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="/my-complaints" element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppLayout>
                  <MyComplaints />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/new-complaint" element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppLayout>
                  <NewComplaint />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppLayout>
                  <Community />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['admin', 'student']}>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminAnalytics />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
