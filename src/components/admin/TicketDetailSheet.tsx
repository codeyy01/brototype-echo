import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityIcon } from '@/components/shared/SeverityIcon';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ThumbsUp, Paperclip } from 'lucide-react';

interface Ticket {
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
  attachment_url: string | null;
}

interface AdminResponse {
  id: string;
  text: string;
  created_at: string;
  admin_id: string;
}

interface TicketDetailSheetProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const TicketDetailSheet = ({ ticket, open, onOpenChange, onUpdate }: TicketDetailSheetProps) => {
  const [status, setStatus] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [originalStatus, setOriginalStatus] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [responseText, setResponseText] = useState('');
  const [responses, setResponses] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const fetchResponses = async () => {
    if (!ticket) return;
    
    setLoadingResponses(true);
    try {
      const { data, error } = await supabase
        .from('admin_responses')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error: any) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!ticket) return;

    const statusChanged = status !== originalStatus;
    const hasResponse = responseText.trim().length > 0;

    // If nothing to update, return early
    if (!statusChanged && !hasResponse) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update status if changed
      if (statusChanged) {
        const { error } = await supabase
          .from('tickets')
          .update({ status })
          .eq('id', ticket.id);

        if (error) throw error;
      }

      // Add response if provided
      if (hasResponse) {
        const { error } = await supabase
          .from('admin_responses')
          .insert({
            ticket_id: ticket.id,
            admin_id: user.id,
            text: responseText.trim(),
          });

        if (error) throw error;
      }

      // Clear textarea and update original status
      setResponseText('');
      setOriginalStatus(status);
      await fetchResponses();
      onUpdate();

      toast({
        title: 'Ticket updated successfully',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating ticket',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update status when ticket changes
  useEffect(() => {
    if (ticket) {
      const ticketStatus = ticket.status as 'open' | 'in_progress' | 'resolved';
      setStatus(ticketStatus);
      setOriginalStatus(ticketStatus);
      fetchResponses();
    }
  }, [ticket?.id]);

  if (!ticket) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-left">
            <SeverityIcon severity={ticket.severity as any} />
            {ticket.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Ticket Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <StatusBadge status={ticket.status as any} />
              <span className="text-sm text-muted-foreground">
                Category: <span className="font-medium">{ticket.category}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                Severity: <span className="font-medium">{ticket.severity}</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {ticket.upvote_count} upvotes
              </span>
              <span>
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
              <span className="capitalize">{ticket.visibility}</span>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.attachment_url && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachment
                </h4>
                <img
                  src={ticket.attachment_url}
                  alt="Ticket attachment"
                  className="rounded-lg border max-w-full h-auto"
                />
              </div>
            )}
          </div>

          {/* Status Update */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold">Update Status</h4>
            <Select value={status} onValueChange={(value) => setStatus(value as 'open' | 'in_progress' | 'resolved')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Responses */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold">Admin Responses</h4>
            
            {loadingResponses ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
              </div>
            ) : responses.length > 0 ? (
              <div className="space-y-3">
                {responses.map((response) => (
                  <div key={response.id} className="bg-sky-50 rounded-lg p-4">
                    <p className="text-sm">{response.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No responses yet</p>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Add a response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Submit Update Button */}
          <div className="border-t pt-4">
            <Button 
              onClick={handleSubmitUpdate} 
              disabled={loading || (status === originalStatus && !responseText.trim())}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Update'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
