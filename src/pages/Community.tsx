import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { TicketCard } from '@/components/shared/TicketCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ThumbsUp, Loader2 } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="container mx-auto p-6 pb-24 md:pb-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-24 md:pb-6">
      <h1 className="text-3xl font-semibold text-foreground mb-6">Community Voices</h1>

      <div className="space-y-4">
        {activeTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active community issues yet. Be the first to share!</p>
          </div>
        ) : (
          activeTickets.map((ticket) => (
            <div key={ticket.id} className="relative">
              <TicketCard ticket={ticket} />
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant={userUpvotes.has(ticket.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpvote(ticket.id)}
                  disabled={upvoting === ticket.id}
                  className="gap-2"
                >
                  {upvoting === ticket.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  Me Too ({ticket.upvote_count})
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;
