'use client';

import { useEmailStore, FolderType } from '@/store/email-store';
import { useQuery } from '@tanstack/react-query';
import {
  Inbox,
  Send,
  FileEdit,
  Star,
  AlertCircle,
  FolderOpen,
  Plus,
  Mail,
  Tag,
  ChevronDown,
  ChevronRight,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  email: string;
  name: string;
  description?: string;
  emailCount: number;
}

interface Label {
  id: string;
  name: string;
  color: string;
  accountId: string;
  emailCount: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  emailCount: number;
}

const folders: { key: FolderType; label: string; icon: React.ElementType }[] = [
  { key: 'ALL', label: 'All Mail', icon: FolderOpen },
  { key: 'INBOX', label: 'Inbox', icon: Inbox },
  { key: 'SENT', label: 'Sent', icon: Send },
  { key: 'DRAFTS', label: 'Drafts', icon: FileEdit },
  { key: 'STARRED', label: 'Starred', icon: Star },
  { key: 'IMPORTANT', label: 'Important', icon: AlertCircle },
];

export function EmailSidebar() {
  const {
    selectedAccountId,
    selectedFolder,
    selectedLabelId,
    selectedTagId,
    setSelectedAccountId,
    setSelectedFolder,
    setSelectedLabelId,
    setSelectedTagId,
    setUploadDialogOpen,
    setAddAccountDialogOpen,
    setAddLabelDialogOpen,
    setAddTagDialogOpen,
  } = useEmailStore();

  const [labelsOpen, setLabelsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [accountsOpen, setAccountsOpen] = useState(true);

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['archive-accounts'],
    queryFn: () => fetch('/api/archive-accounts').then((r) => r.json()),
  });

  const { data: labels = [] } = useQuery<Label[]>({
    queryKey: ['labels', selectedAccountId],
    queryFn: () =>
      fetch(`/api/labels${selectedAccountId ? `?accountId=${selectedAccountId}` : ''}`).then((r) =>
        r.json()
      ),
    enabled: !!selectedAccountId,
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => fetch('/api/tags').then((r) => r.json()),
  });

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* Header with Upload */}
      <div className="p-3 space-y-2">
        <Button
          onClick={() => setUploadDialogOpen(true)}
          className="w-full gap-2"
          size="sm"
          disabled={!selectedAccountId}
        >
          <Plus className="h-4 w-4" />
          Upload MBOX
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Accounts Section */}
        <div className="mb-2">
          <button
            onClick={() => setAccountsOpen(!accountsOpen)}
            className="flex w-full items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {accountsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Accounts
          </button>
          {accountsOpen && (
            <div className="space-y-0.5">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    selectedAccountId === account.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/70 hover:bg-accent/50'
                  )}
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <div className="flex-1 truncate text-left">
                    <div className="truncate text-sm font-medium">{account.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{account.email}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {account.emailCount}
                  </Badge>
                </button>
              ))}
              <button
                onClick={() => setAddAccountDialogOpen(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50"
              >
                <Plus className="h-4 w-4" />
                Add Account
              </button>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Folders Section */}
        <div className="mb-2">
          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Folders
          </div>
          <div className="space-y-0.5">
            {folders.map((folder) => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.key}
                  onClick={() => setSelectedFolder(folder.key)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    selectedFolder === folder.key && !selectedLabelId && !selectedTagId
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground/70 hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {folder.label}
                </button>
              );
            })}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Labels Section */}
        <div className="mb-2">
          <button
            onClick={() => setLabelsOpen(!labelsOpen)}
            className="flex w-full items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {labelsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Labels
          </button>
          {labelsOpen && (
            <div className="space-y-0.5">
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => setSelectedLabelId(label.id === selectedLabelId ? null : label.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    selectedLabelId === label.id
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground/70 hover:bg-accent/50'
                  )}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-left truncate">{label.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {label.emailCount}
                  </Badge>
                </button>
              ))}
              {selectedAccountId && (
                <button
                  onClick={() => setAddLabelDialogOpen(true)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50"
                >
                  <Plus className="h-4 w-4" />
                  Add Label
                </button>
              )}
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Tags Section */}
        <div className="mb-2">
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            className="flex w-full items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {tagsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Tags
          </button>
          {tagsOpen && (
            <div className="space-y-0.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    selectedTagId === tag.id
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground/70 hover:bg-accent/50'
                  )}
                >
                  <Tag className="h-4 w-4 shrink-0" style={{ color: tag.color }} />
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {tag.emailCount}
                  </Badge>
                </button>
              ))}
              <button
                onClick={() => setAddTagDialogOpen(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50"
              >
                <Plus className="h-4 w-4" />
                Add Tag
              </button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
