import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, FileText, Shield } from 'lucide-react';

export default function Profile() {
  const { user, role, signOut } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    const fetchTicketCount = async () => {
      if (!user) return;
      
      try {
        let query = supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true });

        if (role === 'admin') {
          // For admins, count all resolved tickets system-wide
          query = query.eq('status', 'resolved');
        } else {
          // For students, count their own tickets
          query = query.eq('created_by', user.id);
        }

        const { count, error } = await query;

        if (error) throw error;
        setTicketCount(count || 0);
      } catch (error) {
        console.error('Error fetching ticket count:', error);
      }
    };

    fetchTicketCount();
  }, [user, role]);

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-foreground">Profile</h1>
      
      <Card className="overflow-hidden bg-background border border-border shadow-sm">
        {/* Hero Header with Gradient */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 md:p-8 text-center border-b border-border">
          <Avatar className="w-20 h-20 md:w-24 md:h-24 mx-auto border-4 border-background shadow-lg">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl md:text-3xl font-bold">
              {user?.email ? getInitials(user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            {user?.email?.split('@')[0] || 'User'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 p-6 border-b border-border bg-muted/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {role === 'admin' ? 'Resolved Complaints' : 'Total Complaints'}
              </p>
            </div>
            <p className="text-3xl font-bold text-foreground">{ticketCount}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</p>
            </div>
            <Badge className="mt-1 bg-primary/10 text-primary border border-primary/30 capitalize text-sm px-3 py-1">
              {role || 'student'}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Account Information Card */}
          <div className="bg-background rounded-xl border border-border p-4 md:p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Account Information</h3>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
              <p className="text-foreground font-medium">{user?.email}</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={signOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}