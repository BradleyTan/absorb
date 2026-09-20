import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { listJourneys } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Absorb — learn it, practise it, use it",
  description:
    "Absorb turns any topic into a guided journey: bite-sized lessons, graded practice, and a real-world challenge.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cards = isSupabaseConfigured() ? await listJourneys() : [];
  const journeys = cards.map((c) => ({
    id: c.journey.id,
    title: c.journey.title,
    completionPct: c.stats.completionPct,
  }));

  return (
    <html lang="en">
      <body className="antialiased">
        <Sidebar journeys={journeys} />
        <div className="md:pl-[17rem]">
          <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
            {!isSupabaseConfigured() && (
              <div className="card mb-6 border-amber/40 bg-amber/5 p-4 text-sm text-amber">
                <p className="font-semibold">Database not connected</p>
                <p className="mt-1 text-amber/80">
                  Run{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5">
                    vercel env pull .env.local
                  </code>{" "}
                  and restart the dev server to use Absorb.
                </p>
              </div>
            )}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
