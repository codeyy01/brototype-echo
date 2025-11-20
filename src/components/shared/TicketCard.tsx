import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { SeverityIcon } from './SeverityIcon';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
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
}

export const TicketCard = ({ 
  ticket, 
  onClick, 
  showUpvotes = false,
  currentUserId,
  onEdit,
  onDelete 
}: TicketCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const isMobile = useIsMobile();
  const canEdit = currentUserId && ticket.created_by === currentUserId && ticket.status === 'open';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(ticket);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(ticket.id);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleToggleDescriptionExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <SeverityIcon severity={ticket.severity as any} />
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-foreground ${isExpanded || !isMobile ? 'break-words' : ''}`}>
                {isMobile && !isExpanded && ticket.title.length > 10
                  ? `${ticket.title.substring(0, 10)}...`
                  : ticket.title}
              </h3>
              {isMobile && ticket.title.length > 10 && (
                <button
                  onClick={handleToggleExpand}
                  className="text-sm text-primary hover:underline mt-1 font-medium"
                >
                  {isExpanded ? 'Show Less' : 'Read More'}
                </button>
              )}
              {ticket.description && (
                <>
                  <p className="text-sm text-muted-foreground mt-2 break-words">
                    {isMobile && !isDescriptionExpanded && ticket.description.length > 50
                      ? `${ticket.description.substring(0, 50)}...`
                      : ticket.description}
                  </p>
                  {isMobile && ticket.description.length > 50 && (
                    <button
                      onClick={handleToggleDescriptionExpand}
                      className="text-sm text-primary hover:underline mt-1 font-medium"
                    >
                      {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
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