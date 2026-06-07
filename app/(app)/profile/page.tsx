import * as React from 'react';

import { AvatarSection } from '@/components/profile/avatar-section';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { ProfileForm } from '@/components/profile/profile-form';

export default function ProfilePage(): React.JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Your photo, name and password — all in one place.
        </p>
      </header>

      <AvatarSection />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <ProfileForm />
      </section>

      <section className="border-border space-y-4 border-t pt-8">
        <h2 className="text-lg font-semibold tracking-tight">Password</h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
}