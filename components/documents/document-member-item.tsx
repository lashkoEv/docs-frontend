'use client';

import { Check, Crown, MoreHorizontal, Trash2, UserCog } from 'lucide-react';
import * as React from 'react';

import { DocumentRoleBadge } from '@/components/documents/document-role-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type AssignableDocumentRole,
  type DocumentMember,
  DocumentRole,
} from '@/lib/documents';
import { getInitials } from '@/lib/shared';

interface DocumentMemberItemProps {
  member: DocumentMember;
  canManage: boolean;
  isCurrentUser: boolean;
  isUpdatingRole: boolean;
  onRequestRemove: (member: DocumentMember) => void;
  onRequestTransferOwner: (member: DocumentMember) => void;
  onChangeRole: (member: DocumentMember, role: AssignableDocumentRole) => void;
}

export function DocumentMemberItem({
  member,
  canManage,
  isCurrentUser,
  isUpdatingRole,
  onRequestRemove,
  onRequestTransferOwner,
  onChangeRole,
}: DocumentMemberItemProps): React.JSX.Element {
  const isOwner = member.role === DocumentRole.OWNER;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {getInitials(member.user.displayName)}
      </span>

      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate text-sm font-medium">
          {member.user.displayName}
          {isCurrentUser ? (
            <span className="text-muted-foreground ml-1.5 text-xs font-normal">(you)</span>
          ) : null}
        </span>
        <span className="text-muted-foreground truncate text-xs">{member.user.email}</span>
      </div>

      <DocumentRoleBadge role={member.role} />

      {canManage && !isOwner ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Member actions"
              className="size-8"
              disabled={isUpdatingRole}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => onChangeRole(member, DocumentRole.EDITOR)}
            >
              <span className="inline-flex size-4 items-center justify-center">
                {member.role === DocumentRole.EDITOR ? (
                  <Check className="size-4" />
                ) : null}
              </span>
              Editor
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onChangeRole(member, DocumentRole.VIEWER)}
            >
              <span className="inline-flex size-4 items-center justify-center">
                {member.role === DocumentRole.VIEWER ? (
                  <Check className="size-4" />
                ) : null}
              </span>
              Viewer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onRequestTransferOwner(member)}>
              <Crown className="size-4" />
              Make owner
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onRequestRemove(member)}
            >
              <Trash2 className="size-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="size-8" aria-hidden="true">
          {isOwner ? (
            <UserCog
              className="text-muted-foreground/50 m-2 size-4"
              aria-label="Owner"
            />
          ) : null}
        </span>
      )}
    </li>
  );
}