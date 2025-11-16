import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/shared/TicketCard';
import { TicketDetailSheet } from '@/components/admin/TicketDetailSheet';
import { SearchBar } from '@/components/shared/SearchBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
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

  // Filter tickets based on search and severity
  const filterTickets = (ticketList: Ticket[]) => {
    return ticketList.filter((ticket) => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || ticket.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  };

  const openTickets = filterTickets(tickets.filter((t) => t.status === 'open'));
  const inProgressTickets = filterTickets(tickets.filter((t) => t.status === 'in_progress'));
  const resolvedTickets = filterTickets(tickets.filter((t) => t.status === 'resolved'));

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
      </div>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList className="bg-sky-50">
          <TabsTrigger value="open" className="data-[state=active]:bg-background">
            Open ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-background">
            In Progress ({inProgressTickets.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-background">
            Resolved ({resolvedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
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

        <TabsContent value="in_progress" className="space-y-4">
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

        <TabsContent value="resolved" className="space-y-4">
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
      />
    </div>
  );
};

export default AdminDashboard;
