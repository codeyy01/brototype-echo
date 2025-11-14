import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, Globe, Lock } from 'lucide-react';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];

const complaintSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  category: z.enum(['academic', 'infrastructure', 'other']),
  severity: z.enum(['low', 'medium', 'critical']),
  visibility: z.enum(['private', 'public']),
});

const NewComplaint = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    severity: 'medium',
    description: '',
    visibility: 'private' as 'private' | 'public',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form data with zod
    const validation = complaintSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    // Validate file if present
    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Only JPG and PNG images are allowed',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      let attachmentUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get signed URL with 1 year expiry instead of public URL
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('ticket-attachments')
          .createSignedUrl(fileName, 31536000); // 1 year in seconds

        if (signedUrlError) throw signedUrlError;
        attachmentUrl = signedUrlData.signedUrl;
      }

      const { error } = await supabase.from('tickets').insert([{
        title: formData.title,
        description: formData.description,
        category: formData.category as 'academic' | 'infrastructure' | 'other',
        severity: formData.severity as 'low' | 'medium' | 'critical',
        visibility: formData.visibility,
        attachment_url: attachmentUrl,
        created_by: user.id,
      }]);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Complaint submitted successfully',
      });

      navigate('/my-complaints');
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 pb-24 md:pb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">New Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief summary of your concern"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your concern in detail"
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachment"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Max 5MB, JPG or PNG only</p>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'private' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    formData.visibility === 'private'
                      ? 'bg-sky-50 border-sky-200 text-sky-700'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Private</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'public' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    formData.visibility === 'public'
                      ? 'bg-sky-50 border-sky-200 text-sky-700'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Public</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.visibility === 'private'
                  ? '🔒 Only admins can see this complaint'
                  : '🌍 Visible to all students in Community'}
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewComplaint;
