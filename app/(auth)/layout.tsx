import { Check } from "lucide-react";
import * as React from "react";

import { GuestRoute } from "@/components/auth/guest-route";
import { LogoLink } from '@/components/brand/logo-link';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AUTH_PAGE_HIGHLIGHTS } from "@/lib/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <GuestRoute>
      <main className="grid min-h-full flex-1 lg:grid-cols-2">
        <section className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-16">
          <header className="flex items-center justify-between">
            <LogoLink />
            <ThemeToggle />
          </header>

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-sm">{children}</div>
          </div>

          <footer className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Docs Lite — Yevheniia Lashko
          </footer>
        </section>

        <aside className="from-brand-from via-brand-via to-brand-to relative hidden overflow-hidden bg-gradient-to-br lg:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-black/20 blur-3xl"
          />

          <div className="relative flex h-full flex-col justify-between gap-16 p-12 text-white xl:p-16 2xl:p-24">
            <blockquote className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
                Docs Lite — collaborative editor
              </p>
              <p className="mt-6 text-3xl leading-tight font-medium tracking-tight xl:text-4xl 2xl:text-6xl">
                Where teams write, edit, and ship — together.
              </p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 xl:text-lg 2xl:text-xl">
                One document, every teammate, in perfect sync.
              </p>
            </blockquote>

            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
                Built for teams
              </p>
              <ul className="mt-5 space-y-3">
                {AUTH_PAGE_HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-relaxed text-white/90"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </main>
    </GuestRoute>
  );
}
