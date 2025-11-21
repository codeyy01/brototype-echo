import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { SeverityIcon } from './SeverityIcon';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  className?: string;
}

export const TicketCard = ({ 
  ticket, 
  onClick, 
  showUpvotes = false,
  currentUserId,
  onEdit,
  onDelete,
  className
}: TicketCardProps) => {
  const isMobile = useIsMobile();
  const canEdit = currentUserId && ticket.created_by === currentUserId && ticket.status === 'open';

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + '...';
    }
    return text;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(ticket);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(ticket.id);
  };

  const severityColors = {
    low: 'border-l-green-400',
    medium: 'border-l-amber-400',
    critical: 'border-l-red-500',
  };

  return (
    <div
      className={`w-full max-w-full bg-background rounded-xl shadow-sm border border-border hover:shadow-md transition-all overflow-hidden border-l-4 cursor-pointer ${
        severityColors[ticket.severity as keyof typeof severityColors]
      } ${className || ''}`}
      onClick={onClick}
    >
      {/* Card Content */}
      <div className="p-4 md:p-5 w-full max-w-full">
        {/* Header with Severity Icon and Status */}
        <div className="flex items-start justify-between gap-3 mb-3 w-full max-w-full">
          <div className="flex items-start gap-3 flex-1 min-w-0 max-w-full">
            <div className="flex-shrink-0">
              <SeverityIcon severity={ticket.severity as any} />
            </div>
            <div className="flex-1 min-w-0 max-w-full">
              <h3 className="font-bold text-foreground text-base md:text-lg mb-1 break-words overflow-wrap-anywhere">
                {isMobile ? truncateText(ticket.title, 10) : ticket.title}
              </h3>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <StatusBadge status={ticket.status as any} />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {ticket.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 break-words overflow-wrap-anywhere w-full max-w-full">
            {isMobile ? truncateText(ticket.description, 10) : ticket.description}
          </p>
        )}

        {/* Footer with Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border flex-wrap w-full max-w-full">
          {/* Left side - Edit/Delete buttons or Upvotes */}
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            {canEdit && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
            {showUpvotes && ticket.upvote_count !== undefined && (
              <Badge className="bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5 text-xs">
                {ticket.upvote_count} upvotes
              </Badge>
            )}
          </div>

          {/* Right side - Open button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1 flex-shrink-0"
          >
            Open
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};