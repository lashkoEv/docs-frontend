import * as React from 'react';

import { cn } from '@/lib/utils';

type LogoVariant = 'full' | 'mark' | 'wordmark';

interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: LogoVariant;
}

export function Logo({
  variant = 'full',
  className,
  ...props
}: LogoProps): React.JSX.Element {
  return (
    <span
      className={cn('inline-flex items-center gap-2 select-none', className)}
      {...props}
    >
      {variant !== 'wordmark' ? <LogoMark /> : null}
      {variant !== 'mark' ? (
        <span className="text-base font-semibold tracking-tight">Docs Lite</span>
      ) : null}
    </span>
  );
}

function LogoMark(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-primary size-6 shrink-0"
    >
      <rect
        x="3"
        y="6"
        width="14"
        height="14"
        rx="3"
        fill="currentColor"
        opacity="0.35"
      />
      <rect
        x="7"
        y="3"
        width="14"
        height="14"
        rx="3"
        fill="currentColor"
      />
    </svg>
  );
}