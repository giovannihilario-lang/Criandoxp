import { createClient } from "@supabase/supabase-js";

/**
 * Supabase publishable/anon credentials are intentionally available to the
 * browser. Authorization is enforced by Postgres grants + RLS, not by hiding
 * this key. Production can override both values through Vite env variables.
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://zovgkatndrgzxocwpdjm.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
