import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/shared/TicketCard';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  visibility: string;
  upvote_count: number;
  created_at: string;
  created_by: string;
};

const AdminDashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('severity', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading tickets',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const openTickets = tickets.filter((t) => t.status === 'open');
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold text-foreground mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList className="bg-sky-50">
          <TabsTrigger value="open" className="data-[state=active]:bg-background">
            Open ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-background">
            In Progress ({inProgressTickets.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-background">
            Resolved ({resolvedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No open tickets</p>
            </div>
          ) : (
            openTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {inProgressTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tickets in progress</p>
            </div>
          ) : (
            inProgressTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resolved tickets</p>
            </div>
          ) : (
            resolvedTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
