'use client';

import { Mail, MoreHorizontal, Trash2 } from 'lucide-react';
import * as React from 'react';

import { DocumentRoleBadge } from '@/components/documents/document-role-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Invitation } from '@/lib/invitations';

interface PendingInvitationItemProps {
  invitation: Invitation;
  canManage: boolean;
  onRequestRevoke: (invitation: Invitation) => void;
}

export function PendingInvitationItem({
  invitation,
  canManage,
  onRequestRevoke,
}: PendingInvitationItemProps): React.JSX.Element {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="bg-muted text-muted-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-full">
        <Mail className="size-4" />
      </span>

      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate text-sm font-medium">{invitation.email}</span>
        <span className="text-muted-foreground truncate text-xs">
          Invited by {invitation.invitedBy.displayName}
        </span>
      </div>

      <Badge variant="outline" className="text-muted-foreground">
        Pending
      </Badge>
      <DocumentRoleBadge role={invitation.role} />

      {canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Invitation actions"
              className="size-8"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onRequestRevoke(invitation)}
            >
              <Trash2 className="size-4" />
              Revoke invitation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="size-8" aria-hidden="true" />
      )}
    </li>
  );
}