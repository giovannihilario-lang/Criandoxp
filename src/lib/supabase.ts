import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "zovgkatndrgzxocwpdjm";
const FALLBACK_SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const FALLBACK_PUBLIC_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isValidPublicKeyForProject(value: string): boolean {
  if (!value) return false;
  // Supabase's newer publishable keys are intentionally non-JWT values.
  if (value.startsWith("sb_publishable_")) return true;

  const payload = decodeJwtPayload(value);
  return Boolean(
    payload &&
      payload.iss === "supabase" &&
      payload.ref === PROJECT_REF &&
      payload.role === "anon",
  );
}

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();

export const SUPABASE_URL = envUrl || FALLBACK_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = isValidPublicKeyForProject(envKey)
  ? envKey
  : FALLBACK_PUBLIC_KEY;

if (envKey && !isValidPublicKeyForProject(envKey)) {
  console.warn(
    "Ignoring an invalid Supabase public key from Vite environment variables and using the project fallback key.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
