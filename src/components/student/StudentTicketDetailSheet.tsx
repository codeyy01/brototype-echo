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
  updated_at: string;
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
  isPublicView?: boolean;
}

export const StudentTicketDetailSheet = ({
  ticket,
  open,
  onOpenChange,
  isPublicView = false,
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
          <div className="flex items-start gap-3 mb-4">
            <SeverityIcon severity={ticket.severity as any} />
            <h2 className="flex-1 text-xl md:text-2xl font-bold text-foreground break-words">{ticket.title}</h2>
          </div>
          {!isPublicView && (
            <SheetDescription>View your complaint details and admin responses</SheetDescription>
          )}
          {isPublicView && (
            <SheetDescription>Community Ticket</SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Info */}
          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={ticket.status as any} />
            <Badge className="bg-primary/10 text-primary border border-primary/30 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
              {ticket.category}
            </Badge>
            <Badge className="bg-primary/10 text-primary border border-primary/30 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
              {ticket.severity}
            </Badge>
            <span className="text-sm text-muted-foreground ml-auto">
              Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
            </span>
          </div>

          {/* Timeline */}
          <div className="text-xs text-muted-foreground mb-4">
            Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </div>

          {/* Description */}
          <div className="bg-muted border border-border rounded-xl p-3 md:p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Description</h3>
            <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">{ticket.description}</p>
          </div>

          {/* Attachment */}
          {ticket.attachment_url && (
            <div className="bg-muted border border-border rounded-xl p-3 md:p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Attachment</h3>
              <a
                href={ticket.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm md:text-base"
              >
                View attachment
              </a>
            </div>
          )}

          {/* Admin Responses */}
          {!isPublicView && (
            <div className="bg-muted border border-border rounded-xl p-3 md:p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Admin Responses</h3>
              {loading ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Loading responses...</p>
                </div>
              ) : responses.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No admin responses yet.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-3 pr-4">
                    {responses.map((response) => (
                      <div
                        key={response.id}
                        className="bg-background border border-border shadow-sm p-3 rounded-lg space-y-1"
                      >
                        <p className="text-sm md:text-base text-foreground whitespace-pre-wrap break-words">{response.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
