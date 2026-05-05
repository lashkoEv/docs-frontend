'use client';

import Link from 'next/link';
import * as React from 'react';

import { useAuthStore } from '@/lib/auth';
import { APP_ROUTES } from '@/lib/shared';

import { Logo } from './logo';

type LogoLinkProps = React.ComponentProps<typeof Logo>;

export function LogoLink(props: LogoLinkProps): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const href = accessToken ? APP_ROUTES.DOCUMENTS : APP_ROUTES.HOME;

  return (
    <Link href={href} className="rounded-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none">
      <Logo {...props} />
    </Link>
  );
}