'use client';

import { useEmailStore } from '@/store/email-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Star,
  Paperclip,
  ArrowLeft,
  Download,
  Tag,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Mail,
  Copy,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';

interface EmailDetail {
  id: string;
  accountId: string;
  accountEmail: string;
  accountName: string;
  messageId: string | null;
  fromAddr: string;
  fromName: string | null;
  toAddr: string;
  cc: string | null;
  bcc: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  folder: string;
  hasAttachment: boolean;
  labels: { id: string; name: string; color: string }[];
  tags: { id: string; name: string; color: string }[];
  attachments: { id: string; filename: string; mimeType: string; size: number }[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'a', 'img',
      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'div', 'span', 'blockquote', 'hr', 'pre', 'code',
      'sub', 'sup', 'font', 'center', 'dl', 'dt', 'dd',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'style', 'class', 'width', 'height',
      'align', 'valign', 'colspan', 'rowspan', 'border', 'cellpadding',
      'cellspacing', 'color', 'size', 'face', 'bgcolor', 'target',
    ],
    ALLOW_DATA_ATTR: false,
  });
}

export function EmailViewer() {
  const { selectedEmailId, setSelectedEmailId } = useEmailStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showHtml, setShowHtml] = useState(true);

  const { data: email, isLoading, error } = useQuery<EmailDetail>({
    queryKey: ['email', selectedEmailId],
    queryFn: () => fetch(`/api/emails/${selectedEmailId}`).then((r) => r.json()),
    enabled: !!selectedEmailId,
  });

  const toggleStar = async () => {
    if (!email) return;
    await fetch(`/api/emails/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStarred: !email.isStarred }),
    });
    queryClient.invalidateQueries({ queryKey: ['emails'] });
    queryClient.invalidateQueries({ queryKey: ['email', email.id] });
  };

  const toggleImportant = async () => {
    if (!email) return;
    await fetch(`/api/emails/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isImportant: !email.isImportant }),
    });
    queryClient.invalidateQueries({ queryKey: ['emails'] });
    queryClient.invalidateQueries({ queryKey: ['email', email.id] });
  };

  const deleteEmail = async () => {
    if (!email) return;
    await fetch(`/api/emails/${email.id}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ['emails'] });
    setSelectedEmailId(null);
    toast({ title: 'Email deleted' });
  };

  const copyEmailContent = () => {
    if (!email) return;
    const content = `From: ${email.fromName || email.fromAddr} <${email.fromAddr}>
Date: ${format(new Date(email.date), 'PPP p')}
Subject: ${email.subject}
To: ${email.toAddr}
${email.cc ? `CC: ${email.cc}` : ''}

${email.bodyText || ''}`;
    navigator.clipboard.writeText(content);
    toast({ title: 'Email content copied to clipboard' });
  };

  const handlePrint = () => {
    if (!email) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = showHtml && email.bodyHtml
      ? sanitizeHtml(email.bodyHtml)
      : `<pre style="white-space:pre-wrap;font-family:sans-serif;">${DOMPurify.sanitize(email.bodyText || 'No text content')}</pre>`;

    printWindow.document.write(`
      <html>
        <head><title>${DOMPurify.sanitize(email.subject)}</title></head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!selectedEmailId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <Mail className="mx-auto h-16 w-16 text-muted-foreground/20" />
          <h3 className="mt-4 text-lg font-semibold text-foreground/50">Select an email</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose an email from the list to view its contents
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col p-4 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Separator />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <h3 className="text-lg font-semibold text-destructive">Failed to load email</h3>
          <Button
            onClick={() => setSelectedEmailId(null)}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const sanitizedHtml = email.bodyHtml ? sanitizeHtml(email.bodyHtml) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-3">
        {/* Top bar with back button and actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setSelectedEmailId(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="flex-1 text-lg font-semibold truncate">{email.subject}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleStar}>
              <Star
                className={cn(
                  'h-4 w-4',
                  email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                )}
              />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyEmailContent}>
              <Copy className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleImportant}>
                  {email.isImportant ? 'Mark not important' : 'Mark as important'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowHtml(!showHtml)}>
                  {showHtml ? 'Show plain text' : 'Show HTML'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={deleteEmail}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* From / To / Date */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{email.fromName || email.fromAddr}</span>
            <span className="text-muted-foreground">&lt;{email.fromAddr}&gt;</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">To:</span> {email.toAddr}
          </div>
          {email.cc && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">CC:</span> {email.cc}
            </div>
          )}
          {email.bcc && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">BCC:</span> {email.bcc}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {format(new Date(email.date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
          </div>
        </div>

        {/* Labels & Tags */}
        {(email.labels.length > 0 || email.tags.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {email.labels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="text-xs gap-1"
                style={{
                  backgroundColor: label.color + '20',
                  color: label.color,
                  borderColor: label.color + '40',
                }}
              >
                <Bookmark className="h-3 w-3" />
                {label.name}
              </Badge>
            ))}
            {email.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs gap-1"
                style={{ color: tag.color, borderColor: tag.color }}
              >
                <Tag className="h-3 w-3" />
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att) => (
                <a
                  key={att.id}
                  href={`/api/attachments/${att.id}`}
                  className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium truncate max-w-[150px]">{att.filename}</span>
                  <span className="text-muted-foreground">({formatFileSize(att.size)})</span>
                  <Download className="h-3 w-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Email Body */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {showHtml && sanitizedHtml ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {email.bodyText || 'No text content available'}
            </pre>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
