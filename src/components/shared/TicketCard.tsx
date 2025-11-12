import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { SeverityIcon } from './SeverityIcon';

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    status: string;
    severity: string;
    created_at: string;
    upvote_count?: number;
  };
  onClick?: () => void;
  showUpvotes?: boolean;
}

export const TicketCard = ({ ticket, onClick, showUpvotes = false }: TicketCardProps) => {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <SeverityIcon severity={ticket.severity as any} />
            <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
              {ticket.title}
            </h3>
          </div>
          <StatusBadge status={ticket.status as any} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </span>
          {showUpvotes && ticket.upvote_count !== undefined && (
            <span className="font-medium">{ticket.upvote_count} upvotes</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};