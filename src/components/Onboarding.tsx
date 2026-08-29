import { useCallback, useEffect, useRef, useState } from "react";

export const ONBOARDING_VERSION = 3;
const CLIENT_KEY = "cxp_client_id";
const STATE_KEY = "cxp_onboarding_state";
const ACTOR_KEY = "cxp_actor_name";

export interface TourStep {
  id: string;
  title: string;
  body: string;
  target?: string;
  tab?: string;
}

interface StoredState {
  clientId: string;
  version: number;
  step: number;
  completed: boolean;
  completedAt?: string;
}

function safeGet(key: string): string | null {
  try {
    const value = window.localStorage.getItem(key);
    if (value !== null) return value;
  } catch { /* fall through to session storage */ }
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return;
  } catch { /* fall through to session storage */ }
  try { window.sessionStorage.setItem(key, value); } catch { /* storage disabled: state remains in React memory */ }
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `cxp-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function getBrowserClientId(): string {
  let value = safeGet(CLIENT_KEY);
  if (!value) {
    value = makeUuid();
    safeSet(CLIENT_KEY, value);
  }
  return value;
}

export function getBrowserActorName(): string {
  return (safeGet(ACTOR_KEY) || "Equipe Criando XP").trim() || "Equipe Criando XP";
}

export function setBrowserActorName(name: string) {
  const clean = name.trim().slice(0, 60);
  safeSet(ACTOR_KEY, clean || "Equipe Criando XP");
}

function readState(): StoredState {
  const clientId = getBrowserClientId();
  const fresh = (): StoredState => ({ clientId, version: ONBOARDING_VERSION, step: 0, completed: false });
  const raw = safeGet(STATE_KEY);
  if (!raw) return fresh();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (parsed.version !== ONBOARDING_VERSION || (parsed.clientId && parsed.clientId !== clientId)) return fresh();
    return {
      clientId,
      version: ONBOARDING_VERSION,
      step: Math.max(0, Number(parsed.step) || 0),
      completed: !!parsed.completed,
      completedAt: parsed.completedAt,
    };
  } catch {
    return fresh();
  }
}

function writeState(state: Omit<StoredState, "clientId"> & { clientId?: string }) {
  safeSet(STATE_KEY, JSON.stringify({ ...state, clientId: state.clientId || getBrowserClientId() }));
}

interface Props {
  steps: TourStep[];
  restartToken: number;
  onNavigate?: (step: TourStep) => void;
  onVisibilityChange?: (open: boolean) => void;
}

export default function OnboardingTour({ steps, restartToken, onNavigate, onVisibilityChange }: Props) {
  const initial = readState();
  const [open, setOpen] = useState(!initial.completed);
  const [index, setIndex] = useState(Math.min(initial.step, Math.max(steps.length - 1, 0)));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [actor, setActor] = useState(getBrowserActorName());
  const panelRef = useRef<HTMLDivElement>(null);
  const restartSeen = useRef(restartToken);

  const persistProgress = useCallback((step: number, completed = false) => {
    writeState({
      version: ONBOARDING_VERSION,
      step,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    });
  }, []);

  useEffect(() => {
    if (restartSeen.current === restartToken) return;
    restartSeen.current = restartToken;
    setIndex(0);
    persistProgress(0, false);
    setOpen(true);
  }, [restartToken, persistProgress]);

  useEffect(() => { getBrowserClientId(); }, []);
  useEffect(() => { onVisibilityChange?.(open); }, [open, onVisibilityChange]);

  const step = steps[index];
  useEffect(() => {
    if (!open || !step) return;
    onNavigate?.(step);
    let cancelled = false;
    let attempts = 0;
    const locate = () => {
      if (cancelled) return;
      const el = step.target ? document.querySelector(step.target) as HTMLElement | null : null;
      if (el) {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        window.setTimeout(() => { if (!cancelled) setRect(el.getBoundingClientRect()); }, 180);
        return;
      }
      setRect(null);
      attempts += 1;
      if (attempts < 6) window.setTimeout(locate, 120);
    };
    locate();
    return () => { cancelled = true; };
  }, [open, step, onNavigate]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!step?.target) return setRect(null);
      const el = document.querySelector(step.target) as HTMLElement | null;
      setRect(el?.getBoundingClientRect() || null);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => panelRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        persistProgress(index, false);
        setOpen(false);
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, index, persistProgress]);

  if (!open || !step || !steps.length) return null;

  const finish = () => {
    persistProgress(steps.length - 1, true);
    setOpen(false);
  };
  const skip = () => {
    persistProgress(index, true);
    setOpen(false);
  };
  const close = () => {
    persistProgress(index, false);
    setOpen(false);
  };
  const next = () => {
    if (index >= steps.length - 1) return finish();
    const n = index + 1;
    persistProgress(n, false);
    setIndex(n);
  };
  const back = () => {
    const n = Math.max(0, index - 1);
    persistProgress(n, false);
    setIndex(n);
  };

  const spot = rect && rect.width > 0 && rect.height > 0 ? {
    left: Math.max(8, rect.left - 7),
    top: Math.max(8, rect.top - 7),
    width: Math.min(window.innerWidth - 16, rect.width + 14),
    height: Math.min(window.innerHeight - 16, rect.height + 14),
  } : null;

  return (
    <div className="cxp-tour" aria-live="polite">
      <div className="cxp-tour-backdrop" />
      {spot && <div className="cxp-tour-spot" style={spot} aria-hidden="true" />}
      <div
        ref={panelRef}
        className={`cxp-tour-card ${spot ? "has-target" : "centered"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cxp-tour-title"
        tabIndex={-1}
      >
        <div className="cxp-tour-top">
          <span>{index + 1} de {steps.length}</span>
          <button type="button" className="cxp-tour-close" onClick={close} aria-label="Fechar tutorial">×</button>
        </div>
        <div className="cxp-tour-progress" aria-hidden="true"><span style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
        <h2 id="cxp-tour-title">{step.title}</h2>
        <p>{step.body}</p>
        {index === 0 && (
          <label className="cxp-tour-name">
            <span>Seu nome neste navegador</span>
            <input
              value={actor}
              maxLength={60}
              onChange={e => setActor(e.target.value)}
              onBlur={() => setBrowserActorName(actor)}
              placeholder="Ex.: Giovanni"
              autoComplete="nickname"
            />
            <small>Usado apenas no histórico interno. Não serve como login ou identificação de segurança.</small>
          </label>
        )}
        <div className="cxp-tour-actions">
          <button type="button" className="cxp-btn ghost" onClick={skip}>Pular tutorial</button>
          <span className="cxp-tour-spacer" />
          {index > 0 && <button type="button" className="cxp-btn" onClick={back}>Voltar</button>}
          <button type="button" className="cxp-btn primary" onClick={() => { setBrowserActorName(actor); next(); }}>
            {index === steps.length - 1 ? "Concluir" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
