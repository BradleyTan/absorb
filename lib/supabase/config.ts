/**
 * The app renders a setup notice instead of crashing when the Supabase env
 * vars aren't present (fresh clone, or a build before `vercel env pull`).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
