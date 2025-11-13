import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityIcon } from '@/components/shared/SeverityIcon';
import { supabase } from '@/integrations/supabase/client';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  category: string;
  created_at: string;
  upvote_count: number;
  attachment_url?: string;
}

interface AdminResponse {
  id: string;
  text: string;
  created_at: string;
  admin_id: string;
}

interface StudentTicketDetailSheetProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentTicketDetailSheet = ({
  ticket,
  open,
  onOpenChange,
}: StudentTicketDetailSheetProps) => {
  const [responses, setResponses] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ticket?.id) {
      fetchResponses(ticket.id);
    }
  }, [ticket?.id]);

  const fetchResponses = async (ticketId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-3">
            <SeverityIcon severity={ticket.severity as any} />
            <span className="flex-1">{ticket.title}</span>
          </SheetTitle>
          <SheetDescription>View your complaint details and admin responses</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Info */}
          <div className="flex items-center justify-between">
            <StatusBadge status={ticket.status as any} />
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Category and Severity */}
          <div className="flex gap-2">
            <Badge variant="outline" className="capitalize">
              {ticket.category}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {ticket.severity}
            </Badge>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Attachment */}
          {ticket.attachment_url && (
            <div className="space-y-2">
              <h3 className="font-semibold">Attachment</h3>
              <a
                href={ticket.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View attachment
              </a>
            </div>
          )}

          {/* Admin Responses */}
          <div className="space-y-3">
            <h3 className="font-semibold">Admin Responses</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading responses...</p>
            ) : responses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin responses yet.</p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3 pr-4">
                  {responses.map((response) => (
                    <div
                      key={response.id}
                      className="bg-muted p-3 rounded-lg space-y-1"
                    >
                      <p className="text-sm whitespace-pre-wrap">{response.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
