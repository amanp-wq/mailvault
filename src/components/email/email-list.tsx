'use client';

import { useEmailStore } from '@/store/email-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import {
  Star,
  Paperclip,
  Mail,
  MailOpen,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface EmailListItem {
  id: string;
  accountId: string;
  fromAddr: string;
  fromName: string | null;
  toAddr: string;
  cc: string | null;
  subject: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  folder: string;
  hasAttachment: boolean;
  attachmentCount: number;
  labels: { id: string; name: string; color: string }[];
  tags: { id: string; name: string; color: string }[];
  preview: string;
}

interface EmailListResponse {
  emails: EmailListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  if (isThisYear(date)) return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
}

export function EmailList() {
  const {
    selectedAccountId,
    selectedFolder,
    selectedLabelId,
    selectedTagId,
    searchQuery,
    currentPage,
    selectedEmailId,
    setSelectedEmailId,
    setCurrentPage,
  } = useEmailStore();

  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (selectedAccountId) params.set('accountId', selectedAccountId);
  if (selectedFolder && selectedFolder !== 'ALL') params.set('folder', selectedFolder);
  if (selectedLabelId) params.set('labelId', selectedLabelId);
  if (selectedTagId) params.set('tagId', selectedTagId);
  if (searchQuery) params.set('search', searchQuery);
  params.set('page', currentPage.toString());
  params.set('limit', '50');

  const { data, isLoading, error, refetch } = useQuery<EmailListResponse>({
    queryKey: ['emails', selectedAccountId, selectedFolder, selectedLabelId, selectedTagId, searchQuery, currentPage],
    queryFn: () => fetch(`/api/emails?${params}`).then((r) => r.json()),
    enabled: !!selectedAccountId,
  });

  const toggleStar = async (emailId: string, currentStarred: boolean) => {
    await fetch(`/api/emails/${emailId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStarred: !currentStarred }),
    });
    queryClient.invalidateQueries({ queryKey: ['emails'] });
  };

  const toggleRead = async (emailId: string, currentRead: boolean) => {
    await fetch(`/api/emails/${emailId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: !currentRead }),
    });
    queryClient.invalidateQueries({ queryKey: ['emails'] });
  };

  if (!selectedAccountId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <Mail className="h-16 w-16 text-muted-foreground/30" />
        <div>
          <h3 className="text-lg font-semibold text-foreground/70">No Archive Account Selected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select an archive account from the sidebar or create a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-3 flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-8" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b p-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <h3 className="text-lg font-semibold text-destructive">Failed to load emails</h3>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const emails = data?.emails || [];
  const total = data?.total || 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{total}</span> email{total !== 1 ? 's' : ''}
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-7 w-7">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Email List */}
      {emails.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-sm font-semibold text-foreground/70">No emails found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Upload an MBOX file to get started'}
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmailId(email.id)}
                className={cn(
                  'flex cursor-pointer items-start gap-2 px-3 py-2.5 transition-colors hover:bg-accent/50',
                  selectedEmailId === email.id && 'bg-accent',
                  !email.isRead && 'bg-primary/5'
                )}
              >
                {/* Star */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(email.id, email.isStarred);
                  }}
                  className="mt-0.5 shrink-0"
                >
                  <Star
                    className={cn(
                      'h-4 w-4 transition-colors',
                      email.isStarred
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/40 hover:text-muted-foreground'
                    )}
                  />
                </button>

                {/* Email Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'truncate text-sm',
                        !email.isRead ? 'font-semibold text-foreground' : 'text-foreground/80'
                      )}
                    >
                      {email.fromName || email.fromAddr}
                    </span>
                    {email.hasAttachment && (
                      <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'truncate text-sm',
                      !email.isRead ? 'font-medium text-foreground' : 'text-foreground/70'
                    )}
                  >
                    {email.subject}
                  </div>
                  <div className="truncate text-xs text-muted-foreground mt-0.5">
                    {email.preview}
                  </div>
                  {/* Labels & Tags */}
                  {(email.labels.length > 0 || email.tags.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {email.labels.map((label) => (
                        <Badge
                          key={label.id}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                          style={{
                            backgroundColor: label.color + '20',
                            color: label.color,
                            borderColor: label.color + '40',
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                      {email.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          style={{ color: tag.color, borderColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Read/Unread indicator */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(email.id, email.isRead);
                  }}
                  className="mt-0.5 shrink-0"
                >
                  {email.isRead ? (
                    <MailOpen className="h-3.5 w-3.5 text-muted-foreground/40" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= data.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
