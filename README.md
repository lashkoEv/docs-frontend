# Docs Lite — Frontend

The web client for Docs Lite. Built with Next.js 16 (App Router) and React 19, it provides authentication, document management with sharing, and a collaborative editor with live cursors, presence, version history, and notifications - all synchronized in real time over WebSocket.

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19
- **Styling**: Tailwind CSS 4 (CSS-first config via `@theme inline`)
- **Components**: shadcn/ui primitives + Radix UI
- **Forms**: `react-hook-form` + `zod` (`@hookform/resolvers`)
- **State**: Zustand with `persist` middleware
- **Editor**: Quill 2 + `quill-cursors` + `quill-delta` (OT)
- **Real-time**: `socket.io-client`
- **Toasts**: sonner
- **Theming**: `next-themes`
- **Variants**: `class-variance-authority`, `clsx`, `tailwind-merge`
- **Icons**: `lucide-react`

## Project Structure

```
docs-frontend/
├── app/                        # App Router
│   ├── (auth)/                 # Public route group: split-screen layout
│   │   ├── login/  register/  forgot-password/  reset-password/
│   │   └── layout.tsx
│   ├── (app)/                  # Protected route group: <ProtectedRoute> + <TopBar>
│   │   ├── documents/          # List + [id] editor page
│   │   ├── profile/
│   │   ├── invitations/        # Accept-by-token flow
│   │   └── layout.tsx
│   ├── layout.tsx              # Root layout: fonts, <Toaster />, theme provider
│   ├── page.tsx                # Landing
│   ├── error.tsx  not-found.tsx
│   └── globals.css             # Tailwind 4 @theme inline (oklch tokens, brand gradient)
├── components/
│   ├── ui/                     # shadcn primitives (Button, Input, Card, Form, ...)
│   ├── auth/                   # Login/register/reset forms, ProtectedRoute, TopBar
│   ├── documents/              # Document list, editor, share dialog, members, version history
│   ├── realtime/               # Presence roster, cursors, connection indicator
│   ├── notifications/          # Bell + panel
│   └── brand/                  # Logo / wordmark
├── lib/
│   ├── api/                    # fetch client (Bearer + auto-refresh), per-domain API modules
│   ├── stores/                 # Zustand stores (auth, ...)
│   ├── schemas/                # zod schemas (mirror backend validation rules)
│   ├── hooks/                  # useDocumentRoom and other client hooks
│   ├── constants/              # Routes and client constants
│   └── utils.ts                # cn() helper
├── public/                     # Static assets
├── .env.example                # Public (NEXT_PUBLIC_*) env template
├── Dockerfile                  # Multi-stage: deps (dev) / runtime (standalone)
├── components.json             # shadcn config
└── package.json
```

## Environment Configuration

Only `NEXT_PUBLIC_*` variables are exposed to the browser, and they are inlined into the client bundle at build time. Copy the template:

```bash
cp .env.example .env.local
```

### Key Environment Variables
- `NEXT_PUBLIC_API_URL` — backend origin
- `NEXT_PUBLIC_S3_PUBLIC_URL` — public base URL of the avatars bucket (MinIO locally, S3 in production).

## Installation & Setup

### Prerequisites
- Node.js 20 or higher
- A running `docs-backend` API (see its `README.md`)
- npm

### Installation Steps

```bash
npm install
cp .env.example .env.local  
npm run dev
```

The app is available at http://localhost:3000.

## Available Scripts

```bash
npm run dev     # next dev (Turbopack, HMR)
npm run build   # next build (production)
npm run start   # next start (serve production build)
npm run lint    # eslint
```
