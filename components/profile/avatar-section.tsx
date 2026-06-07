'use client';

import { Loader2, Trash2, Upload } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { isApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_FILE_INPUT_ACCEPT,
  FileType,
  MAX_AVATAR_SIZE_BYTES,
  uploadFile,
} from '@/lib/files';
import { usersApi } from '@/lib/users';

const isAllowedAvatarType = (mimeType: string): boolean =>
  (ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(mimeType);

export function AvatarSection(): React.JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  if (!user) {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!isAllowedAvatarType(file.type)) {
      toast.error('Please choose a JPG, PNG or WebP image.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error('The image is too large. Maximum size is 5 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, FileType.AVATAR);
      const updated = await usersApi.updateProfile({ avatarId: uploaded.id });
      setUser(updated);
      toast.success('Photo updated');
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to upload the photo. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    setIsRemoving(true);
    try {
      const updated = await usersApi.updateProfile({ avatarId: null });
      setUser(updated);
      toast.success('Photo removed');
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to remove the photo. Please try again.');
      }
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <section className="flex items-center gap-6">
      <UserAvatar displayName={user.displayName} avatar={user.avatar} size="lg" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading || isRemoving}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {isUploading ? 'Uploading...' : 'Upload photo'}
          </Button>
          {user.avatar ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isUploading || isRemoving}
              onClick={handleRemove}
            >
              {isRemoving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">JPG, PNG or WebP, up to 5 MB.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
    </section>
  );
}