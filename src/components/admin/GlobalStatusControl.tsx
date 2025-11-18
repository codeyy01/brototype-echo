import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type StatusType = 'info' | 'warning' | 'critical';

export const GlobalStatusControl = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [currentStatusId, setCurrentStatusId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  const fetchCurrentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('global_status')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMessage(data.message);
        setStatusType(data.status_type as StatusType);
        setCurrentStatusId(data.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handlePublish = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a status message',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      if (currentStatusId) {
        // Update existing status
        const { error } = await supabase
          .from('global_status')
          .update({
            message: message.trim(),
            status_type: statusType,
            updated_by: user.id,
          })
          .eq('id', currentStatusId);

        if (error) throw error;
      } else {
        // Insert new status
        const { data, error } = await supabase
          .from('global_status')
          .insert({
            message: message.trim(),
            status_type: statusType,
            updated_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentStatusId(data.id);
      }

      toast({
        title: 'Status published',
        description: 'Global status has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error publishing status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Status Control</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Status Control</CardTitle>
        <CardDescription>
          Set a global status message that appears to all students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status-message">Status Message</Label>
          <Input
            id="status-message"
            placeholder="e.g., All Systems Operational"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {message.length}/200 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-type">Status Type</Label>
          <Select value={statusType} onValueChange={(v) => setStatusType(v as StatusType)}>
            <SelectTrigger id="status-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info/Success (Blue/Green)</SelectItem>
              <SelectItem value="warning">Warning (Yellow)</SelectItem>
              <SelectItem value="critical">Critical (Red)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handlePublish}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish Status
        </Button>
      </CardContent>
    </Card>
  );
};
