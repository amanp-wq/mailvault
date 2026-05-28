'use client';

import { EmailSidebar } from '@/components/email/email-sidebar';
import { EmailList } from '@/components/email/email-list';
import { EmailViewer } from '@/components/email/email-viewer';
import { EmailSearch } from '@/components/email/email-search';
import { EmailUploadDialog } from '@/components/email/email-upload-dialog';
import { AddAccountDialog } from '@/components/email/add-account-dialog';
import { AddLabelDialog } from '@/components/email/add-label-dialog';
import { AddTagDialog } from '@/components/email/add-tag-dialog';
import { useEmailStore } from '@/store/email-store';
import { Archive, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function Home() {
  const { sidebarOpen, setSidebarOpen } = useEmailStore();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="flex items-center gap-3 border-b px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-2 shrink-0">
          <Archive className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold hidden sm:block">MailVault</h1>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <EmailSearch />
      </header>

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                <EmailSidebar />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Email List */}
          <ResizablePanel defaultSize={sidebarOpen ? 32 : 40} minSize={25} maxSize={50}>
            <EmailList />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Email Viewer */}
          <ResizablePanel defaultSize={sidebarOpen ? 50 : 60} minSize={35}>
            <EmailViewer />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <EmailUploadDialog />
      <AddAccountDialog />
      <AddLabelDialog />
      <AddTagDialog />
    </div>
  );
}
