import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ChevronRight, Loader2 } from 'lucide-react';
import { SeverityIcon } from '@/components/shared/SeverityIcon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  upvote_count: number;
  created_at: string;
}

interface CommunityTicketCardProps {
  ticket: Ticket;
  onUpvote: (ticketId: string) => void;
  onOpen: (ticket: Ticket) => void;
  hasUpvoted: boolean;
  isUpvoting: boolean;
}

export const CommunityTicketCard = ({
  ticket,
  onUpvote,
  onOpen,
  hasUpvoted,
  isUpvoting,
}: CommunityTicketCardProps) => {
  const isMobile = useIsMobile();

  const severityColors = {
    low: 'border-l-green-400',
    medium: 'border-l-amber-400',
    critical: 'border-l-red-500',
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <div
      className={`bg-background rounded-xl shadow-sm border border-border hover:shadow-md transition-all overflow-hidden border-l-4 ${
        severityColors[ticket.severity as keyof typeof severityColors]
      }`}
    >
      {/* Card Content */}
      <div className="p-4 md:p-5">
        {/* Header with Severity Icon and Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <SeverityIcon severity={ticket.severity as any} />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base md:text-lg mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                {isMobile ? truncateText(ticket.title, 10) : ticket.title}
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                <StatusBadge status={ticket.status as any} />
                <Badge className="bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5 text-xs capitalize">
                  {ticket.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 whitespace-nowrap md:whitespace-normal">
          {isMobile ? truncateText(ticket.description, 10) : ticket.description}
        </p>

        {/* Footer with Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          {/* Me Too Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(ticket.id);
            }}
            disabled={isUpvoting}
            className={`rounded-full gap-2 transition-all ${
              hasUpvoted
                ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                : 'bg-muted text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {isUpvoting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-current' : ''}`} />
            )}
            <span className="font-bold">{ticket.upvote_count}</span>
          </Button>

          {/* Open Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(ticket);
            }}
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
          >
            Open
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
