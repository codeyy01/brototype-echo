import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { CommunityTicketCard } from '@/components/community/CommunityTicketCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { StudentTicketDetailSheet } from '@/components/student/StudentTicketDetailSheet';

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

const Community = () => {
  const { user } = useAuth();
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState<string | null>(null);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (user) {
      fetchUserUpvotes();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data: active, error: activeError } = await supabase
        .from('tickets')
        .select('*')
        .eq('visibility', 'public')
        .neq('status', 'resolved')
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      setActiveTickets(active || []);
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

  const fetchUserUpvotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ticket_upvotes')
        .select('ticket_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setUserUpvotes(new Set(data.map((upvote) => upvote.ticket_id)));
    } catch (error: any) {
      console.error('Error fetching upvotes:', error);
    }
  };

  const handleUpvote = async (ticketId: string) => {
    if (!user || upvoting) return;

    setUpvoting(ticketId);

    try {
      const hasUpvoted = userUpvotes.has(ticketId);

      if (hasUpvoted) {
        const { error } = await supabase
          .from('ticket_upvotes')
          .delete()
          .eq('ticket_id', ticketId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserUpvotes((prev) => {
          const next = new Set(prev);
          next.delete(ticketId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('ticket_upvotes')
          .insert({ ticket_id: ticketId, user_id: user.id });

        if (error) throw error;

        setUserUpvotes((prev) => new Set(prev).add(ticketId));
      }

      await fetchTickets();
    } catch (error: any) {
      toast({
        title: 'Error updating upvote',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpvoting(null);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsSheetOpen(true);
  };

  const filterTickets = (tickets: Ticket[]) => {
    if (!searchQuery.trim()) return tickets;
    
    const query = searchQuery.toLowerCase();
    return tickets.filter(ticket => 
      ticket.title.toLowerCase().includes(query) || 
      ticket.description.toLowerCase().includes(query)
    );
  };

  const filteredActiveTickets = filterTickets(activeTickets);

  if (loading) {
    return (
      <div className="container mx-auto p-6 pb-24 md:pb-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Gradient */}
      <div className="bg-gradient-to-b from-primary/10 to-background pb-8 pt-6 border-b border-border">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground text-center tracking-tight mb-6">
            Community Voices
          </h1>
          
          {/* Floating Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-background shadow-md rounded-full border-0 overflow-hidden">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by title or description..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 py-6 pb-24 md:pb-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredActiveTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery ? 'No matching tickets found.' : 'No active public complaints yet. Be the first to share your voice! 🎤'}
              </p>
            </div>
          ) : (
            filteredActiveTickets.map((ticket) => (
              <CommunityTicketCard
                key={ticket.id}
                ticket={ticket}
                onUpvote={handleUpvote}
                onOpen={handleTicketClick}
                hasUpvoted={userUpvotes.has(ticket.id)}
                isUpvoting={upvoting === ticket.id}
              />
            ))
          )}
        </div>
      </div>

      <StudentTicketDetailSheet
        ticket={selectedTicket}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        isPublicView={true}
      />
    </div>
  );
};

export default Community;
