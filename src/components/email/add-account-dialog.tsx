'use client';

import { useEmailStore } from '@/store/email-store';
import { useQueryClient } from '@tanstack/react-query';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AddAccountDialog() {
  const { addAccountDialogOpen, setAddAccountDialogOpen, setSelectedAccountId } = useEmailStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/archive-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, description }),
      });

      const account = await response.json();

      if (!response.ok) {
        throw new Error(account.error || 'Failed to create account');
      }

      setSelectedAccountId(account.id);
      queryClient.invalidateQueries({ queryKey: ['archive-accounts'] });

      toast({ title: 'Account created', description: `${name}'s archive account is ready.` });

      handleClose();
    } catch (err) {
      toast({
        title: 'Failed to create account',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setDescription('');
    setAddAccountDialogOpen(false);
  };

  return (
    <Dialog open={addAccountDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Archive Account
          </DialogTitle>
          <DialogDescription>
            Create an archive account for a departed employee&apos;s emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Employee Name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Jane Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email">Email Address</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., jane@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-desc">Description (Optional)</Label>
            <Textarea
              id="account-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Marketing Director - Left Dec 2024"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name || !email || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
