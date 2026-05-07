import * as React from 'react';

import { RegisterForm } from '@/components/auth/register-form';
import { fetchInvitationPreview } from '@/lib/invitations';

interface RegisterPageProps {
  searchParams: Promise<{ invitationToken?: string; email?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps): Promise<React.JSX.Element> {
  const { invitationToken, email } = await searchParams;

  const previewResult = invitationToken
    ? await fetchInvitationPreview(invitationToken)
    : null;

  const validInvitation =
    previewResult?.ok && previewResult.preview
      ? { token: invitationToken as string, preview: previewResult.preview }
      : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        {validInvitation ? (
          <>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              You&apos;re invited
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Sign up to access «{validInvitation.preview.documentTitle}»
            </h1>
            <p className="text-muted-foreground text-sm">
              {validInvitation.preview.inviterDisplayName} invited you to
              collaborate. Create your account to accept.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Get started</h1>
            <p className="text-muted-foreground text-sm">
              Create your free account and start collaborating in minutes.
            </p>
          </>
        )}
      </div>

      <RegisterForm
        invitationToken={validInvitation?.token}
        prefilledEmail={validInvitation?.preview.email ?? email}
      />
    </div>
  );
}