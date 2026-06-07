'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { type FileInfo, getFileUrl } from '@/lib/files';
import { getInitials } from '@/lib/shared';
import { cn } from '@/lib/utils';

const userAvatarVariants = cva(
  'bg-primary/10 text-primary inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold',
  {
    variants: {
      size: {
        sm: 'size-8 text-xs',
        md: 'size-9 text-xs',
        lg: 'size-24 text-2xl',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
);

export interface UserAvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof userAvatarVariants> {
  displayName: string;
  avatar?: FileInfo | null;
}

export function UserAvatar({
  displayName,
  avatar,
  size,
  className,
  ...props
}: UserAvatarProps): React.JSX.Element {
  const [imageFailed, setImageFailed] = React.useState(false);
  const imageUrl = avatar && !imageFailed ? getFileUrl(avatar) : null;

  React.useEffect(() => {
    setImageFailed(false);
  }, [avatar?.id]);

  return (
    <span className={cn(userAvatarVariants({ size }), className)} {...props}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={displayName}
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(displayName)
      )}
    </span>
  );
}