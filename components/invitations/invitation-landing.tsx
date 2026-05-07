'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { StatusPageShell } from '@/components/layout/status-page-shell';
import { Button } from '@/components/ui/button';
import { isApiError } from '@/lib/api/errors';
import { authApi, useAuthStore } from '@/lib/auth';
import { DOCUMENT_ROLE_LABELS } from '@/lib/documents';
import { invitationsApi, type InvitationPreview } from '@/lib/invitations';
import { APP_ROUTES, formatShortDate } from '@/lib/shared';

interface InvitationLandingProps {
  token: string;
  preview: InvitationPreview;
}

export function InvitationLanding({
  token,
  preview,
}: InvitationLandingProps): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clear = useAuthStore((state) => state.clear);

  const [hydrated, setHydrated] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);

  React.useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const isAuthenticated = Boolean(accessToken && user);
  const matchingEmail =
    isAuthenticated && user?.email.toLowerCase() === preview.email.toLowerCase();

  const handleAccept = async (): Promise<void> => {
    setIsAccepting(true);
    try {
      const response = await invitationsApi.accept(token);
      toast.success('Invitation accepted');
      router.replace(`${APP_ROUTES.DOCUMENTS}/${response.documentId}`);
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to accept invitation.');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSwitchAccount = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {}
    clear();
  };

  const loginHref = `${APP_ROUTES.LOGIN}?${new URLSearchParams({
    invitationToken: token,
    email: preview.email,
  }).toString()}`;
  const registerHref = `${APP_ROUTES.REGISTER}?${new URLSearchParams({
    invitationToken: token,
    email: preview.email,
  }).toString()}`;

  return (
    <StatusPageShell>
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
        You&apos;re invited
      </p>
      <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
        {preview.inviterDisplayName} shared a document with you.
      </h1>
      <div className="border-border bg-card mx-auto mt-8 max-w-sm rounded-xl border p-5 text-left">
        <p className="text-muted-foreground text-xs">Document</p>
        <p className="mt-1 text-base font-semibold tracking-tight">
          «{preview.documentTitle}»
        </p>

        <div className="text-muted-foreground mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="uppercase tracking-wider">Role</p>
            <p className="text-foreground mt-1 text-sm font-medium">
              {DOCUMENT_ROLE_LABELS[preview.role]}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wider">Sent to</p>
            <p className="text-foreground mt-1 text-sm font-medium break-all">
              {preview.email}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mt-4 text-xs">
          Expires {formatShortDate(preview.expiresAt)}
        </p>
      </div>

      {hydrated ? (
        <div className="mt-10 flex flex-col items-center gap-3">
          {matchingEmail ? (
            <Button
              size="lg"
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full max-w-sm"
            >
              {isAccepting ? 'Accepting...' : 'Accept invitation'}
            </Button>
          ) : isAuthenticated ? (
            <>
              <p className="text-muted-foreground max-w-sm text-sm">
                You&apos;re signed in as{' '}
                <span className="text-foreground font-medium">{user?.email}</span>.
                This invitation was sent to{' '}
                <span className="text-foreground font-medium">{preview.email}</span>.
              </p>
              <Button
                size="lg"
                onClick={handleSwitchAccount}
                className="w-full max-w-sm"
              >
                Sign out and switch account
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="w-full max-w-sm">
                <Link href={registerHref}>Create account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full max-w-sm">
                <Link href={loginHref}>Sign in</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-10 h-11 w-full max-w-sm" />
      )}
    </StatusPageShell>
  );
}