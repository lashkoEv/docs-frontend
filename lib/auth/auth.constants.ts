export const PASSWORD_RULE_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{8,25}$/;

export const MAX_EMAIL_LENGTH = 255;
export const MAX_DISPLAY_NAME_LENGTH = 100;

export const AUTH_PAGE_HIGHLIGHTS = [
  'Real-time editing — see teammates type as it happens',
  'Live cursors and presence indicators',
  'Automatic saving and instant version history',
  'Per-document access — share with the right people',
] as const;