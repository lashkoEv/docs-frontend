import { CheckCircle2, Cloud, History, Users } from 'lucide-react';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DOCUMENTS: '/documents',
} as const;

export const PROTECTED_ROUTE_PREFIXES = ['/documents'] as const;

export const AUTH_ROUTES = [APP_ROUTES.LOGIN, APP_ROUTES.REGISTER] as const;

export const LANDING_FEATURES = [
  {
    title: 'Real-time collaboration',
    description:
      'Edit together with your team. Every keystroke shows up instantly for everyone on the document.',
    icon: Users,
  },
  {
    title: 'Live cursors and presence',
    description:
      'See exactly where each teammate is reading or editing — and who is online with you right now.',
    icon: CheckCircle2,
  },
  {
    title: 'Automatic saving',
    description:
      'Your work is saved as you type. No "save" button, no lost changes, no anxiety.',
    icon: Cloud,
  },
  {
    title: 'Version history',
    description:
      'Every change is tracked. Replay the document at any point in time, restore an earlier state in one click.',
    icon: History,
  },
] as const;