'use client';

import { UserPlus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { DocumentMemberItem } from '@/components/documents/document-member-item';
import { PendingInvitationItem } from '@/components/documents/pending-invitation-item';
import { ShareDialog } from '@/components/documents/share-dialog';
import { TransferOwnerDialog } from '@/components/documents/transfer-owner-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth';
import {
  type AssignableDocumentRole,
  DOCUMENT_ROLE_LABELS,
  type Document,
  type DocumentMember,
  DocumentRole,
  documentsApi,
  useDocumentDetailStore,
} from '@/lib/documents';
import { type Invitation, invitationsApi } from '@/lib/invitations';

interface DocumentMembersSectionProps {
  document: Document;
}

export function DocumentMembersSection({
  document,
}: DocumentMembersSectionProps): React.JSX.Element {
  const currentUser = useAuthStore((state) => state.user);
  const members = useDocumentDetailStore((state) => state.members);
  const pendingInvitations = useDocumentDetailStore(
    (state) => state.pendingInvitations,
  );
  const isMembersLoading = useDocumentDetailStore((state) => state.isMembersLoading);
  const reloadMembers = useDocumentDetailStore((state) => state.reloadMembers);
  const reloadPendingInvitations = useDocumentDetailStore(
    (state) => state.reloadPendingInvitations,
  );

  const canManage = document.myRole === DocumentRole.OWNER;

  const [shareOpen, setShareOpen] = React.useState(false);
  const [memberToRemove, setMemberToRemove] = React.useState<DocumentMember | null>(null);
  const [memberToPromote, setMemberToPromote] = React.useState<DocumentMember | null>(null);
  const [invitationToRevoke, setInvitationToRevoke] =
    React.useState<Invitation | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [isRevoking, setIsRevoking] = React.useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = React.useState<number | null>(null);

  const memberIds = React.useMemo(
    () => members.map((member) => member.user.id),
    [members],
  );

  const handleRemove = async (): Promise<void> => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await documentsApi.removeMember(document.id, memberToRemove.user.id);
      toast.success(`${memberToRemove.user.displayName} removed`);
      setMemberToRemove(null);
      await reloadMembers();
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to remove member.');
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleChangeRole = async (
    member: DocumentMember,
    role: AssignableDocumentRole,
  ): Promise<void> => {
    if (member.role === role) return;
    setUpdatingRoleUserId(member.user.id);
    try {
      await documentsApi.updateMemberRole(document.id, member.user.id, { role });
      toast.success(
        `${member.user.displayName} is now ${DOCUMENT_ROLE_LABELS[role]}`,
      );
      await reloadMembers();
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to update role.');
      }
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleRevoke = async (): Promise<void> => {
    if (!invitationToRevoke) return;
    setIsRevoking(true);
    try {
      await invitationsApi.revoke(document.id, invitationToRevoke.id);
      toast.success(`Invitation to ${invitationToRevoke.email} revoked`);
      setInvitationToRevoke(null);
      await reloadPendingInvitations();
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to revoke invitation');
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const showEmptyState =
    !isMembersLoading && members.length === 0 && pendingInvitations.length === 0;

  return (
    <section className="border-border bg-card rounded-xl border">
      <header className="border-border flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Members</h2>
          <p className="text-muted-foreground text-xs">
            People with access to this document
          </p>
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => setShareOpen(true)}>
            <UserPlus className="size-4" />
            Invite
          </Button>
        ) : null}
      </header>

      {isMembersLoading && members.length === 0 ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : showEmptyState ? (
        <p className="text-muted-foreground p-6 text-center text-sm">
          No members yet.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {members.map((member) => (
            <DocumentMemberItem
              key={`m-${member.user.id}`}
              member={member}
              canManage={canManage}
              isCurrentUser={currentUser?.id === member.user.id}
              isUpdatingRole={updatingRoleUserId === member.user.id}
              onRequestRemove={(toRemove) => setMemberToRemove(toRemove)}
              onRequestTransferOwner={(toPromote) => setMemberToPromote(toPromote)}
              onChangeRole={handleChangeRole}
            />
          ))}
          {pendingInvitations.map((invitation) => (
            <PendingInvitationItem
              key={`i-${invitation.id}`}
              invitation={invitation}
              canManage={canManage}
              onRequestRevoke={(toRevoke) => setInvitationToRevoke(toRevoke)}
            />
          ))}
        </ul>
      )}

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        documentId={document.id}
        excludeIds={memberIds}
      />

      <TransferOwnerDialog
        member={memberToPromote}
        documentId={document.id}
        onOpenChange={(open) => {
          if (!open) setMemberToPromote(null);
        }}
      />

      <Dialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from document?</DialogTitle>
            <DialogDescription>
              <span className="text-foreground font-medium">
                {memberToRemove?.user.displayName}
              </span>{' '}
              will lose access to this document. They can be re-added later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberToRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(invitationToRevoke)}
        onOpenChange={(open) => {
          if (!open) setInvitationToRevoke(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke invitation?</DialogTitle>
            <DialogDescription>
              The invitation link sent to{' '}
              <span className="text-foreground font-medium">
                {invitationToRevoke?.email}
              </span>{' '}
              will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInvitationToRevoke(null)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking...' : 'Revoke'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}