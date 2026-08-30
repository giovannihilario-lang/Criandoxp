export const ONBOARDING_VERSION = 3;
export const ONBOARDING_STATE_KEY = "cxp_onboarding_state";
const CLIENT_KEY = "cxp_client_id";
const ACTOR_KEY = "cxp_actor_name";

export function safeOnboardingGet(key: string): string | null {
  try {
    const value = window.localStorage.getItem(key);
    if (value !== null) return value;
  } catch { /* fall through to session storage */ }
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

export function safeOnboardingSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return;
  } catch { /* fall through to session storage */ }
  try { window.sessionStorage.setItem(key, value); } catch { /* storage disabled */ }
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `cxp-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function getBrowserClientId(): string {
  let value = safeOnboardingGet(CLIENT_KEY);
  if (!value) {
    value = makeUuid();
    safeOnboardingSet(CLIENT_KEY, value);
  }
  return value;
}

export function getBrowserActorName(): string {
  return (safeOnboardingGet(ACTOR_KEY) || "Equipe Criando XP").trim() || "Equipe Criando XP";
}

export function setBrowserActorName(name: string) {
  const clean = name.trim().slice(0, 60);
  safeOnboardingSet(ACTOR_KEY, clean || "Equipe Criando XP");
}
