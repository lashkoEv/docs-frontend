import * as React from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { TopBar } from '@/components/auth/top-bar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <ProtectedRoute>
      <div className="flex min-h-full flex-1 flex-col">
        <TopBar />
        <div className="bg-muted/40 dark:bg-transparent flex flex-1 flex-col">{children}</div>
      </div>
    </ProtectedRoute>
  );
}