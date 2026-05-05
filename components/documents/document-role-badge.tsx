import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { DOCUMENT_ROLE_LABELS, DocumentRole } from '@/lib/documents';

interface DocumentRoleBadgeProps {
  role: DocumentRole;
}

const variantByRole: Record<DocumentRole, 'default' | 'outline' | 'muted'> = {
  [DocumentRole.OWNER]: 'default',
  [DocumentRole.EDITOR]: 'outline',
  [DocumentRole.VIEWER]: 'muted',
};

export function DocumentRoleBadge({ role }: DocumentRoleBadgeProps): React.JSX.Element {
  return <Badge variant={variantByRole[role]}>{DOCUMENT_ROLE_LABELS[role]}</Badge>;
}