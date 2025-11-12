import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/shared/TicketCard';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function MyComplaints() {
  const { user } = useAuth();
  
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

  const activeTickets = tickets?.filter(t => t.status !== 'resolved') || [];
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved') || [];

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">My Complaints</h1>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active">Active ({activeTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : activeTickets.length === 0 ? (
            <p className="text-muted-foreground">No active complaints. Hope your day's going smoothly 😊</p>
          ) : (
            activeTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </TabsContent>
        
        <TabsContent value="resolved" className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : resolvedTickets.length === 0 ? (
            <p className="text-muted-foreground">No resolved complaints yet.</p>
          ) : (
            resolvedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}