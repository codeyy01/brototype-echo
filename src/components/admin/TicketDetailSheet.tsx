import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityIcon } from '@/components/shared/SeverityIcon';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ThumbsUp, Paperclip } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  visibility: string;
  upvote_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  attachment_url: string | null;
}

interface AdminResponse {
  id: string;
  text: string;
  created_at: string;
  admin_id: string;
}

interface TicketDetailSheetProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  isMobile?: boolean;
}

export const TicketDetailSheet = ({ ticket, open, onOpenChange, onUpdate, isMobile = true }: TicketDetailSheetProps) => {
  const [status, setStatus] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [originalStatus, setOriginalStatus] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [responseText, setResponseText] = useState('');
  const [responses, setResponses] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const fetchResponses = async () => {
    if (!ticket) return;
    
    setLoadingResponses(true);
    try {
      const { data, error } = await supabase
        .from('admin_responses')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error: any) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!ticket) return;

    const statusChanged = status !== originalStatus;
    const hasResponse = responseText.trim().length > 0;

    // If nothing to update, return early
    if (!statusChanged && !hasResponse) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update status if changed
      if (statusChanged) {
        const { error } = await supabase
          .from('tickets')
          .update({ status })
          .eq('id', ticket.id);

        if (error) throw error;
      }

      // Add response if provided
      if (hasResponse) {
        const { error } = await supabase
          .from('admin_responses')
          .insert({
            ticket_id: ticket.id,
            admin_id: user.id,
            text: responseText.trim(),
          });

        if (error) throw error;
      }

      // Clear textarea and update original status
      setResponseText('');
      setOriginalStatus(status);
      await fetchResponses();
      onUpdate();

      toast({
        title: 'Ticket updated successfully',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating ticket',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update status when ticket changes
  useEffect(() => {
    if (ticket) {
      const ticketStatus = ticket.status as 'open' | 'in_progress' | 'resolved';
      setStatus(ticketStatus);
      setOriginalStatus(ticketStatus);
      fetchResponses();
    }
  }, [ticket?.id]);

  if (!ticket) return null;

  const severityColors = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
  };

  const categoryColors = {
    academic: 'bg-purple-50 text-purple-700 border-purple-200',
    infrastructure: 'bg-green-50 text-green-700 border-green-200',
    other: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  // Shared content component
  const TicketContent = () => (
    <>
      {/* Header Section */}
      <div className="space-y-4 pb-4 border-b border-slate-100">
        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={ticket.status as any} />
          <span className={`border rounded-full px-3 py-1 text-xs font-medium ${severityColors[ticket.severity as keyof typeof severityColors]}`}>
            {ticket.severity}
          </span>
          <span className={`border rounded-full px-3 py-1 text-xs font-medium ${categoryColors[ticket.category as keyof typeof categoryColors]}`}>
            {ticket.category}
          </span>
        </div>
        
        {/* Title */}
        <div className="flex items-start gap-3">
          <SeverityIcon severity={ticket.severity as any} />
          <h2 className="text-2xl font-bold text-slate-900 flex-1">{ticket.title}</h2>
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            {ticket.upvote_count} upvotes
          </span>
          <span>
            Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </span>
          <span className="capitalize">{ticket.visibility}</span>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Student Report Section */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 tracking-wider">STUDENT REPORT</p>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>
        </div>

        {/* Attachment */}
        {ticket.attachment_url && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2">
              <Paperclip className="h-3 w-3" />
              ATTACHMENT
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <img
                src={ticket.attachment_url}
                alt="Ticket attachment"
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Admin Response History */}
        {(loadingResponses || responses.length > 0) && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 tracking-wider">ADMIN RESPONSE HISTORY</p>
            
            {loadingResponses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
              </div>
            ) : (
              <div className="space-y-3">
                {responses.map((response) => (
                  <div key={response.id} className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
                    <p className="text-slate-700 leading-relaxed">{response.text}</p>
                    <p className="text-xs text-slate-500 mt-3">
                      {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Update Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
          <p className="text-xs font-bold text-slate-400 tracking-wider">UPDATE TICKET</p>
          
          {/* Status Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'open' | 'in_progress' | 'resolved')}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-sky-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Admin Response</label>
            <Textarea
              placeholder="Add a response to the student..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
              className="bg-slate-50 border-slate-200 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitUpdate} 
            disabled={loading || (status === originalStatus && !responseText.trim())}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Update'
            )}
          </Button>
        </div>
      </div>
    </>
  );

  // Desktop version - Two column Dialog
  const DesktopDialog = () => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <div className="grid grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[90vh]">
          {/* Left Column - Main Content (2/3) */}
          <div className="col-span-2 space-y-6">
            {/* Header Section */}
            <div className="space-y-4 pb-4 border-b border-slate-100">
              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={ticket.status as any} />
                <span className={`border rounded-full px-3 py-1 text-xs font-medium ${severityColors[ticket.severity as keyof typeof severityColors]}`}>
                  {ticket.severity}
                </span>
                <span className={`border rounded-full px-3 py-1 text-xs font-medium ${categoryColors[ticket.category as keyof typeof categoryColors]}`}>
                  {ticket.category}
                </span>
              </div>
              
              {/* Title */}
              <div className="flex items-start gap-3">
                <SeverityIcon severity={ticket.severity as any} />
                <h2 className="text-3xl font-bold text-slate-900 flex-1">{ticket.title}</h2>
              </div>

              {/* Meta Information */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {ticket.upvote_count} upvotes
                </span>
                <span>
                  Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </span>
                <span className="capitalize">{ticket.visibility}</span>
              </div>
            </div>

            {/* Student Report Section */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 tracking-wider">STUDENT REPORT</p>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">{ticket.description}</p>
              </div>
            </div>

            {/* Attachment */}
            {ticket.attachment_url && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2">
                  <Paperclip className="h-3 w-3" />
                  ATTACHMENT
                </p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <img
                    src={ticket.attachment_url}
                    alt="Ticket attachment"
                    className="rounded-lg max-w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* Admin Response History */}
            {(loadingResponses || responses.length > 0) && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 tracking-wider">ADMIN RESPONSE HISTORY</p>
                
                {loadingResponses ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {responses.map((response) => (
                      <div key={response.id} className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
                        <p className="text-slate-700 leading-relaxed">{response.text}</p>
                        <p className="text-xs text-slate-500 mt-3">
                          {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Action Panel (1/3, Sticky) */}
          <div className="col-span-1">
            <div className="sticky top-0 space-y-6">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 space-y-4">
                <p className="text-xs font-bold text-slate-400 tracking-wider">UPDATE TICKET</p>
                
                {/* Status Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <Select value={status} onValueChange={(value) => setStatus(value as 'open' | 'in_progress' | 'resolved')}>
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-sky-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Response Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Admin Response</label>
                  <Textarea
                    placeholder="Add a response to the student..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={6}
                    className="bg-slate-50 border-slate-200 focus:ring-sky-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitUpdate} 
                  disabled={loading || (status === originalStatus && !responseText.trim())}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg shadow-sm transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Mobile version - Sheet
  const MobileSheet = () => (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <TicketContent />
      </SheetContent>
    </Sheet>
  );

  return isMobile ? <MobileSheet /> : <DesktopDialog />;
};
