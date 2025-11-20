import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'resolved';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    open: {
      label: 'Open',
      className: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    },
    resolved: {
      label: 'Resolved',
      className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={`${config.className} rounded-full`}>
      {config.label}
    </Badge>
  );
};