import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/shared/TicketCard';
import { StudentTicketDetailSheet } from '@/components/student/StudentTicketDetailSheet';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function MyComplaints() {
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: upvotedTickets, isLoading: isLoadingUpvoted } = useQuery({
    queryKey: ['upvoted-tickets', user?.id],
    queryFn: async () => {
      const { data: upvotes, error: upvotesError } = await supabase
        .from('ticket_upvotes')
        .select('ticket_id')
        .eq('user_id', user?.id);
      
      if (upvotesError) throw upvotesError;
      
      if (!upvotes || upvotes.length === 0) return [];
      
      const ticketIds = upvotes.map(u => u.ticket_id);
      
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .in('id', ticketIds)
        .neq('created_by', user?.id)
        .eq('visibility', 'public')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false });
      
      if (ticketsError) throw ticketsError;
      return tickets;
    },
    enabled: !!user,
  });

  const activeTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress') || [];
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved') || [];
  const followingTickets = upvotedTickets || [];

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">My Complaints</h1>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="active">Active ({activeTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
          <TabsTrigger value="following">Following ({followingTickets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : activeTickets.length === 0 ? (
            <p className="text-muted-foreground">No active complaints. Hope your day's going smoothly 😊</p>
          ) : (
            activeTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={() => setSelectedTicket(ticket)}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="resolved" className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : resolvedTickets.length === 0 ? (
            <p className="text-muted-foreground">No resolved complaints yet.</p>
          ) : (
            resolvedTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {isLoadingUpvoted ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : followingTickets.length === 0 ? (
            <p className="text-muted-foreground">No issues you're following. Visit the Community tab to find issues to support.</p>
          ) : (
            followingTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket}
                onClick={() => setSelectedTicket(ticket)}
                showUpvotes
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <StudentTicketDetailSheet
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      />
    </div>
  );
}