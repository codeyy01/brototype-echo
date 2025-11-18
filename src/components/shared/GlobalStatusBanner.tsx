import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 'info' | 'warning' | 'critical';

interface GlobalStatus {
  id: string;
  message: string;
  status_type: StatusType;
  updated_at: string;
}

export const GlobalStatusBanner = () => {
  const [status, setStatus] = useState<GlobalStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchStatus();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('global-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_status',
        },
        () => {
          fetchStatus();
          setIsDismissed(false); // Show banner again when status changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (status) {
      const dismissKey = `global-status-dismissed-${status.id}`;
      const wasDismissed = localStorage.getItem(dismissKey) === 'true';
      setIsDismissed(wasDismissed);
    }
  }, [status]);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('global_status')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error('Error fetching global status:', error);
    }
  };

  const handleDismiss = () => {
    if (status) {
      const dismissKey = `global-status-dismissed-${status.id}`;
      localStorage.setItem(dismissKey, 'true');
      setIsDismissed(true);
    }
  };

  if (!status || isDismissed) return null;

  const getStatusStyles = () => {
    switch (status.status_type) {
      case 'critical':
        return {
          container: 'bg-red-500 text-white border-red-600',
          icon: AlertCircle,
        };
      case 'warning':
        return {
          container: 'bg-yellow-500 text-black border-yellow-600',
          icon: AlertTriangle,
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-500 text-white border-blue-600',
          icon: Info,
        };
    }
  };

  const { container, icon: Icon } = getStatusStyles();

  return (
    <div
      className={cn(
        'fixed top-16 right-0 z-30 border-b',
        'left-0 lg:left-64', // Mobile: full width, Desktop: respect sidebar
        container
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium truncate">{status.message}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className={cn(
              'h-8 w-8 flex-shrink-0 hover:bg-black/10',
              status.status_type === 'warning' 
                ? 'text-black/60 hover:text-black' 
                : 'text-white/60 hover:text-white'
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
