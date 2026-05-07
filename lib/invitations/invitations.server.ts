import { API_URL } from '@/lib/shared';

import type { InvitationPreview } from './invitations.types';

interface DataResponse<T> {
  data: T;
}

export interface InvitationPreviewResult {
  ok: boolean;
  status: number;
  preview: InvitationPreview | null;
}

export async function fetchInvitationPreview(
  token: string,
): Promise<InvitationPreviewResult> {
  try {
    const response = await fetch(`${API_URL}/api/v1/invitations/${token}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { ok: false, status: response.status, preview: null };
    }

    const json = (await response.json()) as DataResponse<InvitationPreview>;
    return { ok: true, status: response.status, preview: json.data };
  } catch {
    return { ok: false, status: 0, preview: null };
  }
}