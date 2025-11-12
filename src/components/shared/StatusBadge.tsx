import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'resolved';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    open: {
      label: 'Open',
      className: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    },
    resolved: {
      label: 'Resolved',
      className: 'bg-green-100 text-green-800 hover:bg-green-200',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
};