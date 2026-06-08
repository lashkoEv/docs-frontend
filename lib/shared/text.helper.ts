export const getInitials = (displayName: string): string => {
  const parts = displayName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};

export const copyrightLine = (): string =>
  `© ${new Date().getFullYear()} Docs Lite — Yevheniia Lashko`;