'use client';

import { useEmailStore } from '@/store/email-store';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function EmailUploadDialog() {
  const { uploadDialogOpen, setUploadDialogOpen, selectedAccountId } = useEmailStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<{
    saved: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const handleUpload = async () => {
    if (!file || !selectedAccountId) return;

    setUploading(true);
    setProgress('Uploading file...');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', selectedAccountId);

      setProgress('Processing MBOX file... This may take a while for large files.');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data.results);
      setProgress('');

      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['archive-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });

      toast({
        title: 'Upload Complete',
        description: `Saved ${data.results.saved} emails, skipped ${data.results.skipped} duplicates, ${data.results.errors} errors.`,
      });
    } catch (err) {
      toast({
        title: 'Upload Failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploading(false);
    setProgress('');
    setResult(null);
    setUploadDialogOpen(false);
  };

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Email Archive
          </DialogTitle>
          <DialogDescription>
            Upload an MBOX or EML file to import emails into the archive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('mbox-file')?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-primary');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary');
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) setFile(droppedFile);
            }}
          >
            <FileUp className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <div className="mt-2 text-sm font-medium">
              {file ? file.name : 'Click to select or drag & drop'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {file
                ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                : 'Supports .mbox and .eml files (e.g., Google Takeout)'}
            </div>
            <input
              id="mbox-file"
              type="file"
              accept=".mbox,.eml"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) setFile(selectedFile);
              }}
            />
          </div>

          {/* Upload progress */}
          {progress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="rounded-lg border p-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                {result.saved} emails saved successfully
              </div>
              {result.skipped > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  {result.skipped} duplicates skipped
                </div>
              )}
              {result.errors > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors} errors encountered
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
