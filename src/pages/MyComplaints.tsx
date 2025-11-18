import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/shared/TicketCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { StudentTicketDetailSheet } from '@/components/student/StudentTicketDetailSheet';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MyComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filterTickets = (tickets: any[]) => {
    if (!searchQuery.trim()) return tickets;
    
    const query = searchQuery.toLowerCase();
    return tickets.filter(ticket => 
      ticket.title.toLowerCase().includes(query) || 
      ticket.description.toLowerCase().includes(query)
    );
  };

  const filteredActiveTickets = filterTickets(activeTickets);
  const filteredResolvedTickets = filterTickets(resolvedTickets);
  const filteredFollowingTickets = filterTickets(followingTickets);

  // Handle opening ticket from notification link
  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (ticketId && tickets) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        // Clear the query parameter
        setSearchParams({});
      }
    }
  }, [searchParams, tickets, setSearchParams]);

  const deleteMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast({
        title: 'Ticket deleted',
        description: 'Your complaint has been deleted successfully',
      });
      setTicketToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete ticket. Please try again.',
        variant: 'destructive',
      });
      console.error('Delete error:', error);
    },
  });

  const handleEdit = (ticket: any) => {
    navigate('/new-complaint', { state: { editTicket: ticket } });
  };

  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId);
  };

  const handleDeleteConfirm = () => {
    if (ticketToDelete) {
      deleteMutation.mutate(ticketToDelete);
    }
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">My Complaints</h1>
      
      <div className="mb-6">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title or description..."
        />
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="active">Active ({filteredActiveTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({filteredResolvedTickets.length})</TabsTrigger>
          <TabsTrigger value="following">Following ({filteredFollowingTickets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredActiveTickets.length === 0 ? (
            <p className="text-muted-foreground">
              {searchQuery ? 'No matching active complaints found.' : 'No active complaints. Hope your day\'s going smoothly 😊'}
            </p>
          ) : (
            filteredActiveTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={() => setSelectedTicket(ticket)}
                currentUserId={user?.id}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="resolved" className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredResolvedTickets.length === 0 ? (
            <p className="text-muted-foreground">
              {searchQuery ? 'No matching resolved complaints found.' : 'No resolved complaints yet.'}
            </p>
          ) : (
            filteredResolvedTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket}
                onClick={() => setSelectedTicket(ticket)}
                currentUserId={user?.id}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {isLoadingUpvoted ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredFollowingTickets.length === 0 ? (
            <p className="text-muted-foreground">
              {searchQuery ? 'No matching tickets found.' : "No issues you're following. Visit the Community tab to find issues to support."}
            </p>
          ) : (
            filteredFollowingTickets.map(ticket => (
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

      <AlertDialog open={!!ticketToDelete} onOpenChange={(open) => !open && setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this complaint? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}