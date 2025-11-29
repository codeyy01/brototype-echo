import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(80, 'Title must be less than 80 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  category: z.string().min(1, 'Please select a category').refine(
    (val) => ['academic_labs', 'infrastructure_wifi', 'hostel_mess', 'sanitation_hygiene', 'administrative', 'other'].includes(val),
    { message: 'Please select a valid category' }
  ),
  severity: z.enum(['low', 'medium', 'critical']),
  visibility: z.enum(['private', 'public']),
});

const NewComplaint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    severity: 'medium',
    description: '',
    visibility: 'private' as 'private' | 'public',
  });
  const [file, setFile] = useState<File | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const editTicket = location.state?.editTicket;
    if (editTicket) {
      setEditingTicketId(editTicket.id);
      setFormData({
        title: editTicket.title,
        category: editTicket.category,
        severity: editTicket.severity,
        description: editTicket.description,
        visibility: editTicket.visibility,
      });
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Clear previous validation errors
    setValidationErrors({});

    // Extra guard: Check for empty category before validation
    if (!formData.category || formData.category.trim() === '') {
      setValidationErrors({ category: 'Please select a category' });
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    // Validate form data with zod
    const validation = complaintSchema.safeParse(formData);
    if (!validation.success) {
      // Build inline validation errors
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      
      // Also show toast for first error
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

      if (editingTicketId) {
        // Update existing ticket
        const updateData: any = {
          title: formData.title,
          description: formData.description,
          category: formData.category as 'academic_labs' | 'infrastructure_wifi' | 'hostel_mess' | 'sanitation_hygiene' | 'administrative' | 'other',
          severity: formData.severity as 'low' | 'medium' | 'critical',
          visibility: formData.visibility,
        };

        // Only update attachment if a new file was uploaded
        if (attachmentUrl) {
          updateData.attachment_url = attachmentUrl;
        }

        const { error } = await supabase
          .from('tickets')
          .update(updateData)
          .eq('id', editingTicketId);

        if (error) throw error;

        toast({
          title: 'Success!',
          description: 'Complaint updated successfully',
        });
      } else {
        // Create new ticket
        const { error } = await supabase.from('tickets').insert([{
          title: formData.title,
          description: formData.description,
          category: formData.category as 'academic_labs' | 'infrastructure_wifi' | 'hostel_mess' | 'sanitation_hygiene' | 'administrative' | 'other',
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
      }

      navigate('/my-complaints');
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // Check if it's a network error
      const isNetworkError = !navigator.onLine || error.message?.includes('fetch') || error.message?.includes('network');
      
      // Check if it's an enum/database validation error
      const isEnumError = error.message?.toLowerCase().includes('enum') || error.message?.toLowerCase().includes('invalid');
      
      let errorTitle = 'Submission failed';
      let errorDescription = 'An unexpected error occurred. Please try again.';
      
      if (isNetworkError) {
        errorTitle = 'Connection failed';
        errorDescription = 'Please check your internet connection and try again.';
      } else if (isEnumError) {
        errorTitle = 'Validation Error';
        errorDescription = 'Please check that all fields are filled correctly.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
      // Keep form data so user doesn't lose their work
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 pb-24 md:pb-6 min-h-screen">
        <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">{editingTicketId ? 'Edit Complaint' : 'New Complaint'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (validationErrors.title) {
                    setValidationErrors({ ...validationErrors, title: '' });
                  }
                }}
                placeholder="Brief summary of your concern"
                maxLength={80}
                required
                className={validationErrors.title ? 'border-red-500' : ''}
              />
              <div className="flex justify-between items-center">
                {validationErrors.title && (
                  <p className="text-xs text-red-500">{validationErrors.title}</p>
                )}
                <p className={`text-xs text-muted-foreground ${validationErrors.title ? '' : 'ml-auto'}`}>{formData.title.length}/80</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value });
                  if (validationErrors.category) {
                    setValidationErrors({ ...validationErrors, category: '' });
                  }
                }}
              >
                <SelectTrigger id="category" className={validationErrors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic_labs">Academic & Labs</SelectItem>
                  <SelectItem value="infrastructure_wifi">Infrastructure & Wi-Fi</SelectItem>
                  <SelectItem value="hostel_mess">Hostel & Mess</SelectItem>
                  <SelectItem value="sanitation_hygiene">Sanitation & Hygiene</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.category && (
                <p className="text-xs text-red-500">{validationErrors.category}</p>
              )}
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
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (validationErrors.description) {
                    setValidationErrors({ ...validationErrors, description: '' });
                  }
                }}
                placeholder="Describe your concern in detail"
                rows={6}
                required
                className={validationErrors.description ? 'border-red-500' : ''}
              />
              {validationErrors.description && (
                <p className="text-xs text-red-500">{validationErrors.description}</p>
              )}
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
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  {editingTicketId ? 'Updating...' : 'Submitting...'}
                </span>
              ) : (
                editingTicketId ? 'Update Complaint' : 'Submit Complaint'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewComplaint;
