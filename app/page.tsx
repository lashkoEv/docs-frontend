import Link from 'next/link';
import * as React from 'react';

import { Logo } from '@/components/brand/logo';
import { LogoLink } from '@/components/brand/logo-link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { APP_ROUTES, LANDING_FEATURES } from '@/lib/shared';

export default function HomePage(): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <LogoLink />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href={APP_ROUTES.LOGIN}>Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={APP_ROUTES.REGISTER}>Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-6 py-24 sm:px-10 lg:py-32">
          <div
            aria-hidden="true"
            className="from-brand-from/20 via-brand-via/15 pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br to-transparent blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              Collaborative editor
            </p>
            <h1 className="mt-6 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl xl:text-6xl 2xl:text-7xl">
              Where teams write, edit, and ship — together.
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              One document, every teammate, in perfect sync. Stop emailing
              attachments and start writing in the same place.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href={APP_ROUTES.REGISTER}>Get started for free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={APP_ROUTES.LOGIN}>I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-border border-t px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                Why Docs Lite
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Built for the way teams actually work
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {LANDING_FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="border-border bg-card hover:border-primary/40 group rounded-xl border p-6 transition-colors"
                >
                  <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-lg">
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-border text-muted-foreground mt-auto border-t px-6 py-6 text-xs sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Docs Lite — Yevheniia Lashko</span>
          <Logo variant="mark" className="opacity-50" />
        </div>
      </footer>
    </div>
  );
}