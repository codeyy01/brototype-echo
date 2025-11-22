import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/shared/TicketCard';
import { TicketDetailSheet } from '@/components/admin/TicketDetailSheet';
import { SearchBar } from '@/components/shared/SearchBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, CheckCircle, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  visibility: string;
  upvote_count: number;
  created_at: string;
  created_by: string;
  attachment_url: string | null;
};

const AdminDashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTickets();
  }, [searchTerm, severityFilter, dateFilter]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*');

      // Apply search filter
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      // Apply severity filter
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter as 'critical' | 'medium' | 'low');
      }

      // Apply date filter
      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query
        .order('severity', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading tickets',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setSheetOpen(true);
  };

  const openTickets = tickets.filter((t) => t.status === 'open');
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <p className="text-lg font-medium text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-2">Good job keeping the queue clean!</p>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold text-foreground mb-6">Admin Dashboard</h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by title..."
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : "Filter by Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 mt-1"
              onClick={() => setDateFilter(undefined)}
            >
              <X className="h-4 w-4 mr-1" />
              Clear date
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger 
            value="open" 
            className="text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm relative z-10"
          >
            Open ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger 
            value="in_progress" 
            className="text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm relative z-10"
          >
            In Progress ({inProgressTickets.length})
          </TabsTrigger>
          <TabsTrigger 
            value="resolved" 
            className="text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm relative z-10"
          >
            Resolved ({resolvedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="flex flex-col gap-4">
          {openTickets.length === 0 ? (
            <EmptyState message="All caught up!" />
          ) : (
            openTickets.map((ticket) => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={() => handleTicketClick(ticket)}
                showUpvotes
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="flex flex-col gap-4">
          {inProgressTickets.length === 0 ? (
            <EmptyState message="No tickets in progress" />
          ) : (
            inProgressTickets.map((ticket) => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={() => handleTicketClick(ticket)}
                showUpvotes
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="flex flex-col gap-4">
          {resolvedTickets.length === 0 ? (
            <EmptyState message="No resolved tickets yet" />
          ) : (
            resolvedTickets.map((ticket) => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={() => handleTicketClick(ticket)}
                showUpvotes
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <TicketDetailSheet
        ticket={selectedTicket}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={fetchTickets}
        isMobile={isMobile}
      />
    </div>
  );
};

export default AdminDashboard;
