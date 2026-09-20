"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type SidebarJourney = {
  id: string;
  title: string;
  completionPct: number;
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-[#5b8cff] shadow-[0_8px_24px_-10px_rgba(124,92,255,0.9)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M12 3.5c-4.2 0-7.2 2.9-7.2 6.6 0 2.4 1.2 4.3 3.1 5.4v2.3c0 1.5 1.2 2.7 2.7 2.7h2.8c1.5 0 2.7-1.2 2.7-2.7v-2.3c1.9-1.1 3.1-3 3.1-5.4 0-3.7-3-6.6-7.2-6.6Z"
            fill="none"
            stroke="white"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9.4 10.4h5.2M10.2 13.2h3.6"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight">Absorb</span>
    </Link>
  );
}

const navItems = [
  {
    href: "/",
    label: "Journeys",
    icon: (
      <path
        d="M4 6h16M4 12h16M4 18h10"
        strokeLinecap="round"
        strokeWidth="1.8"
        fill="none"
      />
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (
      <path
        d="M5 19V9m7 10V5m7 14v-6"
        strokeLinecap="round"
        strokeWidth="1.8"
        fill="none"
      />
    ),
  },
];

function NavLink({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand/15 text-chalk ring-1 ring-brand/35"
          : "text-fog hover:bg-white/5 hover:text-chalk"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] stroke-current">
        {icon}
      </svg>
      {label}
    </Link>
  );
}

export default function Sidebar({ journeys }: { journeys: SidebarJourney[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  const panel = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="pt-1">
        <Logo />
      </div>

      <Link href="/#new-topic" onClick={close} className="btn btn-primary w-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" aria-hidden="true">
          <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
        New topic
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            }
            onNavigate={close}
          />
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-fog/70">
          Your journeys
        </p>
        <div className="flex flex-col gap-0.5">
          {journeys.length === 0 && (
            <p className="px-3 py-2 text-xs text-fog">Nothing yet — start a topic.</p>
          )}
          {journeys.map((j) => {
            const active = pathname.startsWith(`/journey/${j.id}`);
            return (
              <Link
                key={j.id}
                href={`/journey/${j.id}`}
                onClick={close}
                className={`group rounded-xl px-3 py-2 transition-colors ${
                  active ? "bg-white/[0.07]" : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`block truncate text-sm ${
                    active ? "text-chalk" : "text-fog group-hover:text-chalk"
                  }`}
                >
                  {j.title}
                </span>
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand to-mint transition-[width] duration-500"
                      style={{ width: `${j.completionPct}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-[0.65rem] tabular-nums text-fog">
                    {j.completionPct}%
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="px-3 text-[0.65rem] leading-relaxed text-fog/60">
        Learn → Practice → Apply
      </p>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-ink/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="btn btn-ghost !px-3"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm md:hidden animate-fade"
          onClick={close}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[17rem] border-r border-line bg-surface/95 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {panel}
      </aside>
    </>
  );
}
