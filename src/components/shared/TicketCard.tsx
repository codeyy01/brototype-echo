import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { SeverityIcon } from './SeverityIcon';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    description?: string;
    status: string;
    severity: string;
    created_at: string;
    upvote_count?: number;
    created_by?: string;
  };
  onClick?: () => void;
  showUpvotes?: boolean;
  currentUserId?: string;
  onEdit?: (ticket: any) => void;
  onDelete?: (ticketId: string) => void;
}

export const TicketCard = ({ 
  ticket, 
  onClick, 
  showUpvotes = false,
  currentUserId,
  onEdit,
  onDelete 
}: TicketCardProps) => {
  const canEdit = currentUserId && ticket.created_by === currentUserId && ticket.status === 'open';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(ticket);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(ticket.id);
  };

  const getSeverityColor = () => {
    switch (ticket.severity) {
      case 'critical': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <Card
      className="bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden hover:shadow-md hover:border-sky-100 transition-all duration-300 ease-out cursor-pointer"
      onClick={onClick}
    >
      {/* Severity Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSeverityColor()}`} />
      
      <CardHeader className="pb-3 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <SeverityIcon severity={ticket.severity as any} />
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-800 font-semibold text-lg tracking-tight line-clamp-1">
                {ticket.title}
              </h3>
              {ticket.description && (
                <p className="text-slate-500 text-sm leading-relaxed mt-2 line-clamp-2 md:line-clamp-3">
                  {ticket.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canEdit && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <StatusBadge status={ticket.status as any} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pl-6">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
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