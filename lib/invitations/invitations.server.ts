import { API_PREFIX, API_URL, type DataResponse } from '@/lib/shared';

import type { InvitationPreview } from './invitations.types';

export interface InvitationPreviewResult {
  ok: boolean;
  status: number;
  preview: InvitationPreview | null;
}

export async function fetchInvitationPreview(
  token: string,
): Promise<InvitationPreviewResult> {
  try {
    const response = await fetch(`${API_URL}${API_PREFIX}/invitations/${token}`, {
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