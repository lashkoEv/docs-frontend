import * as React from 'react';

import { InvitationLanding } from '@/components/invitations/invitation-landing';
import { InvitationStatusPage } from '@/components/invitations/invitation-status-page';
import { fetchInvitationPreview } from '@/lib/invitations';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({
  params,
}: InvitePageProps): Promise<React.JSX.Element> {
  const { token } = await params;
  const result = await fetchInvitationPreview(token);

  if (!result.ok || !result.preview) {
    if (result.status === 404) {
      return (
        <InvitationStatusPage
          eyebrow="Invitation not found"
          title="This link doesn't lead anywhere."
          description="The invitation may have been revoked or the link is mistyped. Ask the sender to resend it."
        />
      );
    }
    if (result.status === 410) {
      return (
        <InvitationStatusPage
          eyebrow="Invitation unavailable"
          title="This invitation has expired or was already accepted."
          description="Ask the sender to send you a new invitation."
        />
      );
    }
    return (
      <InvitationStatusPage
        eyebrow="Something went wrong"
        title="We couldn't load this invitation."
        description="Please try again in a moment, or ask the sender to resend it."
      />
    );
  }

  return <InvitationLanding token={token} preview={result.preview} />;
}