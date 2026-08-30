import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue, type CSSProperties, type ReactNode, type DragEvent, type FormEvent } from "react";
import LandingPage from "./LandingPage";
import OnboardingTour, { type TourStep } from "./components/Onboarding";
import { getBrowserActorName, setBrowserActorName, ONBOARDING_VERSION } from "./lib/onboarding";
import { supabase } from "./lib/supabase";
import "./styles/central.css";
import mayoouImg from "../public/icons/mayoou.png";
import zonad20Img from "../public/icons/zonad20.png";

// ─── Constantes ────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const STATUS_OPTIONS = ["Ideia","Roteiro","Produção","Edição","Agendado","Publicado","Cancelado"] as const;
const FLOW_STATUS = STATUS_OPTIONS.filter(s => s !== "Cancelado") as Status[];
const EXTRA_TIKTOK_FORMAT = "Vídeo extra TikTok";
const FORMATO_OPTIONS = ["Post","Reels","Story","Carrossel","Live","Shorts","Thread", EXTRA_TIKTOK_FORMAT];
const REDE_OPTIONS = ["Instagram","TikTok","YouTube","Twitter/X","Facebook","Todos"];

type Status = typeof STATUS_OPTIONS[number];
type ViewMode = "tabela" | "calendario" | "kanban";
type CalendarScope = "mes" | "semana" | "agenda";
type AppTab = "hoje" | "conteudo" | "produtividade" | "leads" | "influencers";
type AppPage = "landing" | "dashboard";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

interface HistoryItem {
  at: string;
  actor: string;
  field: string;
  from: string;
  to: string;
}

interface Row {
  id: string;
  postagem: string;
  data: string;
  data_iso: string | null;
  tema: string;
  briefing: string;
  hook: string;
  roteiro: string;
  cta: string;
  referencias: string;
  formato: string;
  rede: string;
  responsavel: string;
  status: Status;
  observacoes: string;
  mes: number;
  link_arquivo: string;
  checklist: ChecklistItem[];
  historico: HistoryItem[];
  views: number;
  likes: number;
  shares: number;
  saves: number;
  followers_gained: number;
  published_at: string | null;
  created_at?: string;
  details_loaded?: boolean;
}

interface Lead {
  id: string;
  created_at: string;
  nome: string;
  idade: string;
  whatsapp_discord: string;
  tempo_rpg: string;
  sistemas_jogados: string;
  sistemas_desejados: string;
  melhor_dia: string;
  melhor_periodo: string;
  status: string;
  notas: string;
  codigo_desconto: string;
  pronto_ingressar: string;
  origem?: string;
  utm_source?: string;
  utm_campaign?: string;
  influencer_codigo?: string;
  proxima_acao?: string;
  follow_up_date?: string;
  responsavel?: string;
  ultimo_contato?: string;
  anotacao_rapida?: string;
}

interface Influencer {
  id: string;
  created_at: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  clicks: number;
}

interface TemplateDef {
  id: string;
  label: string;
  rede: string;
  formato: string;
  tema: string;
  icon: string;
}

const REDE_ICONS: Record<string, string> = {
  Instagram: "📸",
  TikTok: "🎵",
  YouTube: "▶️",
  "Twitter/X": "𝕏",
  Facebook: "👤",
  Todos: "🌐",
};

const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string; rowBg: string; calBg: string }> = {
  "Ideia":      { bg: "#32204f", text: "#d8b4fe", border: "#7e22ce", rowBg: "rgba(126,34,206,.12)", calBg: "#4c1d95dd" },
  "Roteiro":    { bg: "#2a2659", text: "#c4b5fd", border: "#6366f1", rowBg: "rgba(99,102,241,.12)", calBg: "#3730a3dd" },
  "Produção":   { bg: "#1f3155", text: "#93c5fd", border: "#3b82f6", rowBg: "rgba(59,130,246,.12)", calBg: "#1d4ed8dd" },
  "Edição":     { bg: "#27364a", text: "#67e8f9", border: "#0891b2", rowBg: "rgba(8,145,178,.12)", calBg: "#0e7490dd" },
  "Agendado":   { bg: "#163b38", text: "#6ee7b7", border: "#10b981", rowBg: "rgba(16,185,129,.11)", calBg: "#047857dd" },
  "Publicado":  { bg: "#19391f", text: "#86efac", border: "#16a34a", rowBg: "rgba(22,163,74,.11)", calBg: "#15803ddd" },
  "Cancelado":  { bg: "#3a1a1a", text: "#fca5a5", border: "#dc2626", rowBg: "rgba(220,38,38,.09)", calBg: "#991b1bdd" },
};

const TEMPLATES: TemplateDef[] = [
  { id: "reels", label: "Reels Criando XP", rede: "Instagram", formato: "Reels", tema: "", icon: "🎬" },
  { id: "meme", label: "Post de meme", rede: "Instagram", formato: "Post", tema: "Meme", icon: "🃏" },
  { id: "caixinha", label: "Caixinha / Story", rede: "Instagram", formato: "Story", tema: "Caixinha", icon: "❔" },
  { id: "carrossel", label: "Carrossel D&D", rede: "Instagram", formato: "Carrossel", tema: "D&D", icon: "📚" },
  { id: "tiktok", label: "Vídeo extra TikTok", rede: "TikTok", formato: EXTRA_TIKTOK_FORMAT, tema: EXTRA_TIKTOK_FORMAT, icon: "🎵" },
  { id: "shorts", label: "YouTube Shorts", rede: "YouTube", formato: "Shorts", tema: "", icon: "▶️" },
];

const LEAD_STATUS_OPTIONS = ["Novo lead","Em contato","Mesa alocada","Desistiu","Lista de espera","Não respondeu","Número errado","Menor de 18 anos 🍼"];
const LEAD_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Novo lead":      { bg: "#3d2068", text: "#c9a0f5", border: "#6b3fa0" },
  "Em contato":     { bg: "#2a1a5e", text: "#93c5fd", border: "#3b5bdb" },
  "Mesa alocada":   { bg: "#1a3a1a", text: "#86efac", border: "#16a34a" },
  "Desistiu":       { bg: "#3a1a1a", text: "#fca5a5", border: "#dc2626" },
  "Lista de espera":{ bg: "#1e3a5f", text: "#6ee7b7", border: "#059669" },
  "Não respondeu":  { bg: "#2a2a2a", text: "#9ca3af", border: "#4b5563" },
  "Número errado":  { bg: "#3a2a1a", text: "#fbbf24", border: "#b45309" },
  "Menor de 18 anos 🍼": { bg: "#3a1a2e", text: "#f9a8d4", border: "#be185d" },
};

const LEAD_CHANNELS = [
  { label: "Meta Ads", icon: "/icons/facebook.png", chaves: ["meta", "facebook"] },
  { label: "Instagram", icon: "/icons/instagram.png", chaves: ["instagram"] },
  { label: "TikTok", icon: "/icons/tiktok.png", chaves: ["tiktok"] },
  { label: "Mayoou", icon: mayoouImg, chaves: ["mayoou"] },
  { label: "Zonad20", icon: zonad20Img, chaves: ["zonad20", "zonad"] },
];

const LEAD_SELECT = "id,created_at,nome,idade,whatsapp_discord,tempo_rpg,sistemas_jogados,sistemas_desejados,melhor_dia,melhor_periodo,status,notas,codigo_desconto,pronto_ingressar,origem,utm_source,utm_campaign,influencer_codigo,proxima_acao,follow_up_date,responsavel,ultimo_contato,anotacao_rapida";
const LEAD_SUMMARY_SELECT = "id,nome,whatsapp_discord,status,origem,utm_source";
const LEAD_ATTRIBUTION_SELECT = "id,nome,whatsapp_discord,status,origem,utm_source,utm_campaign,influencer_codigo,anotacao_rapida";
const POST_LIST_SELECT = "id,created_at,postagem,data,data_iso,tema,hook,formato,rede,responsavel,status,mes,checklist,views,likes,shares,saves,followers_gained,published_at";
const POST_CENTRAL_SELECT = "id,created_at,postagem,data,data_iso,tema,formato,rede,responsavel,status,mes,checklist,published_at";
const POST_SEARCH_SELECT = "id,created_at,postagem,data,data_iso,tema,hook,formato,rede,responsavel,status,mes";

const TOUR_STEPS: TourStep[] = [
  { id: "welcome", title: "Bem-vindo à Central", body: "Esta é a central editorial da Criando XP. Aqui você organiza ideias, produção, calendário, leads e parceiros sem depender de planilhas espalhadas." },
  { id: "navigation", title: "Sua navegação", body: "Use estas áreas para alternar entre o que precisa acontecer hoje, o calendário de conteúdo, indicadores, CRM e parceiros.", target: '[data-tour="navigation"]' },
  { id: "new-content", title: "Crie conteúdo sem atrito", body: "Comece uma postagem daqui. Você pode usar modelos, recorrências ou criar um conteúdo do zero e completar os detalhes depois.", target: '[data-tour="new-content"]', tab: "hoje" },
  { id: "content", title: "Calendário, Kanban e tabela", body: "A área de conteúdo tem três leituras do mesmo dado. Calendário para planejar, Kanban para produção e tabela para operações em massa.", target: '[data-tour="content-view"]', tab: "conteudo" },
  { id: "views", title: "Troque a visão, não o trabalho", body: "No celular a Agenda prioriza leitura e toque. No desktop, mês, semana, Kanban e tabela aproveitam melhor o espaço disponível.", target: '[data-tour="view-switch"]', tab: "conteudo" },
  { id: "search", title: "Encontre qualquer coisa", body: "Use Ctrl+K (ou o botão de busca) para localizar conteúdo, leads e parceiros ou disparar ações rápidas.", target: '[data-tour="search"]' },
  { id: "help", title: "Ajuda sempre disponível", body: "Se quiser rever este tour, trocar o nome usado no histórico ou conferir atalhos, abra Ajuda. O tutorial é salvo neste navegador, não no login compartilhado.", target: '[data-tour="help"]' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }
function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y,m,d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const [d,m,y] = dateStr.split("/").map(Number);
  if (!d || !m || !y) return null;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime()) || dt.getDate() !== d || dt.getMonth() !== m - 1 || dt.getFullYear() !== y) return null;
  return dt;
}
function isoToBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = parseDateBR(iso);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}` : "";
}
function brToISO(br: string): string | null {
  const d = parseDateBR(br);
  return d ? `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` : null;
}
function dateInputValue(row: Row): string { return row.data_iso || brToISO(row.data) || ""; }
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function tomorrowISO(): string {
  const d = new Date(); d.setDate(d.getDate()+1);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function isDone(status: Status) { return status === "Publicado" || status === "Cancelado"; }
function isOverdue(r: Row): boolean {
  const iso = dateInputValue(r);
  return !!iso && iso < todayISO() && !isDone(r.status);
}

type UrgencyLevel = "atrasado" | "hoje" | "amanha" | "em2" | "em3";
interface UrgencyMeta { level: UrgencyLevel; label: string; color: string; bg: string; border: string; }
function getUrgencyMeta(row: Row): UrgencyMeta | null {
  if (isDone(row.status)) return null;
  const iso = dateInputValue(row);
  const date = parseDateBR(iso);
  if (!date) return null;
  const today = parseDateBR(todayISO())!;
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { level:"atrasado", label:"ATRASADO", color:"#fecaca", bg:"rgba(127,29,29,.32)", border:"#ef4444" };
  if (diff === 0) return { level:"hoje", label:"HOJE", color:"#fff", bg:"rgba(239,68,68,.88)", border:"#ef4444" };
  if (diff === 1) return { level:"amanha", label:"AMANHÃ", color:"#1a0d3a", bg:"#f59e0b", border:"#f59e0b" };
  if (diff === 2) return { level:"em2", label:"2 DIAS", color:"#1a0d3a", bg:"#fcd34d", border:"#fcd34d" };
  if (diff === 3) return { level:"em3", label:"3 DIAS", color:"#fff", bg:"#059669", border:"#10b981" };
  return null;
}
function parseLinks(raw: string): string[] {
  return raw.split(/[\n,]+/).map(value=>value.trim()).filter(value=>{
    if (!value) return false;
    try { const url=new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
  });
}
function driveFileId(url: string): string | null {
  const direct=url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (direct) return direct[1];
  try { const parsed=new URL(url); return parsed.hostname.includes("drive.google.com") ? parsed.searchParams.get("id") : null; } catch { return null; }
}
function drivePreviewUrl(url: string): string {
  const id=driveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}
function driveThumbnailUrl(url: string): string | null {
  const id=driveFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w900` : null;
}
function whatsappUrl(raw: string): string | null {
  const digits=raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const normalized=digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}
async function copyText(value: string): Promise<boolean> {
  if (!value.trim()) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area=document.createElement("textarea");
      area.value=value;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";
      document.body.appendChild(area);area.select();const ok=document.execCommand("copy");area.remove();return ok;
    } catch { return false; }
  }
}
function legacyStatus(status: unknown): Status {
  if (status === "Planejado") return "Ideia";
  if (status === "Em produção") return "Produção";
  return STATUS_OPTIONS.includes(status as Status) ? status as Status : "Ideia";
}
function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}
function stringValue(value: unknown, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}
function normalizeChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    const record = asRecord(item);
    if (!record) return [];
    return [{
      id: stringValue(record.id, `item-${index}`),
      label: stringValue(record.label, "Item"),
      done: Boolean(record.done),
    }];
  });
}
function normalizeHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-200).flatMap(item => {
    const record = asRecord(item);
    if (!record) return [];
    return [{
      at: stringValue(record.at),
      actor: stringValue(record.actor),
      field: stringValue(record.field),
      from: stringValue(record.from),
      to: stringValue(record.to),
    }];
  });
}
function normalizeRow(rawValue: unknown): Row {
  const raw = asRecord(rawValue) ?? {};
  const rawDate = stringValue(raw.data);
  const isoCandidate = stringValue(raw.data_iso) || brToISO(rawDate) || "";
  const iso = isoCandidate || null;
  const rawMonth = Number(raw.mes);
  const detailsLoaded = Object.prototype.hasOwnProperty.call(raw, "roteiro") || Object.prototype.hasOwnProperty.call(raw, "briefing");
  return {
    id: stringValue(raw.id), postagem: stringValue(raw.postagem, "Postagem"), data: rawDate || isoToBR(iso), data_iso: iso,
    tema: stringValue(raw.tema), briefing: stringValue(raw.briefing), hook: stringValue(raw.hook), roteiro: stringValue(raw.roteiro), cta: stringValue(raw.cta),
    referencias: stringValue(raw.referencias), formato: stringValue(raw.formato), rede: stringValue(raw.rede), responsavel: stringValue(raw.responsavel),
    status: legacyStatus(raw.status), observacoes: stringValue(raw.observacoes), mes: Number.isFinite(rawMonth) ? rawMonth : (iso ? Number(iso.slice(5,7))-1 : new Date().getMonth()),
    link_arquivo: stringValue(raw.link_arquivo), checklist: normalizeChecklist(raw.checklist), historico: normalizeHistory(raw.historico),
    views: Number(raw.views || 0), likes: Number(raw.likes || 0), shares: Number(raw.shares || 0), saves: Number(raw.saves || 0),
    followers_gained: Number(raw.followers_gained || 0), published_at: stringValue(raw.published_at) || null, created_at: stringValue(raw.created_at) || undefined,
    details_loaded: detailsLoaded,
  };
}
function humanDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function prettyField(field: string): string {
  const map: Record<string,string> = { status:"Status", data:"Data", rede:"Rede", formato:"Formato", responsavel:"Responsável", checklist:"Checklist", published_at:"Publicação" };
  return map[field] || field;
}
function sourceText(lead: Lead): string {
  return [lead.origem, lead.utm_source, lead.utm_campaign, lead.influencer_codigo, lead.notas].filter(Boolean).join(" · ");
}
function makeChecklist(format: string): ChecklistItem[] {
  const labels = format === EXTRA_TIKTOK_FORMAT
    ? ["Gravar", "Editar", "Publicar"]
    : format === "Reels" || format === "Shorts"
      ? ["Roteiro", "Gravação", "Edição", "Legenda", "Capa", "Agendamento"]
      : format === "Carrossel"
        ? ["Copy", "Design", "Legenda", "Agendamento"]
        : format === "Story"
          ? ["Copy", "Arte/Gravação", "Publicação"]
          : ["Copy/Roteiro", "Produção", "Legenda", "Agendamento"];
  return labels.map((label, i) => ({ id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2,6)}`, label, done: false }));
}
function makeHistory(field: string, from: unknown, to: unknown): HistoryItem {
  return { at: new Date().toISOString(), actor: getBrowserActorName(), field, from: String(from ?? ""), to: String(to ?? "") };
}
function appendHistory(history: HistoryItem[], item: HistoryItem): HistoryItem[] {
  return [...history, item].slice(-200);
}
function makeId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function makeRow(n: number, mes: number, dateISO = "", partial: Partial<Row> = {}): Row {
  const format = partial.formato || "";
  return {
    id: makeId(),
    postagem: partial.postagem || `Postagem ${n}`,
    data: dateISO ? isoToBR(dateISO) : "",
    data_iso: dateISO || null,
    tema: partial.tema || "", briefing: partial.briefing || "", hook: partial.hook || "", roteiro: partial.roteiro || "", cta: partial.cta || "",
    referencias: partial.referencias || "", formato: format, rede: partial.rede || "", responsavel: partial.responsavel || "",
    status: partial.status || "Ideia", observacoes: partial.observacoes || "", mes: dateISO ? Number(dateISO.slice(5,7))-1 : mes,
    link_arquivo: partial.link_arquivo || "", checklist: partial.checklist || makeChecklist(format), historico: partial.historico || [],
    views: partial.views || 0, likes: partial.likes || 0, shares: partial.shares || 0, saves: partial.saves || 0,
    followers_gained: partial.followers_gained || 0, published_at: partial.published_at || null, details_loaded: partial.details_loaded ?? true,
  };
}

// ─── Banco ─────────────────────────────────────────────────────────────────
async function dbLoad(mes: number): Promise<Row[]> {
  // Mantemos mês e backlog em consultas separadas. Isso evita depender da
  // sintaxe raw do PostgREST em `.or()` e torna erros de schema/RLS muito mais
  // fáceis de identificar e recuperar.
  const year = new Date().getFullYear();
  const start = `${year}-${pad(mes + 1)}-01`;
  const last = new Date(year, mes + 1, 0);
  const end = `${year}-${pad(mes + 1)}-${pad(last.getDate())}`;

  const [dated, backlog] = await Promise.all([
    supabase
      .from("postagens")
      .select(POST_LIST_SELECT)
      .gte("data_iso", start)
      .lte("data_iso", end)
      .order("data_iso", { ascending: true }),
    supabase
      .from("postagens")
      .select(POST_LIST_SELECT)
      .is("data_iso", null)
      .order("created_at", { ascending: false }),
  ]);

  if (!dated.error && !backlog.error) {
    const merged = [...(dated.data ?? []), ...(backlog.data ?? [])];
    const unique = Array.from(new Map(merged.map(row => [row.id, row])).values());
    return unique.map(normalizeRow);
  }

  const firstError = dated.error ?? backlog.error;
  const msg = firstError?.message || "";

  // Compatibilidade de deploy: caso data_iso/created_at ainda não esteja no
  // schema cache, abre o calendário pelo campo legado `mes` em vez de derrubar
  // a página inteira.
  if (
    msg.includes("data_iso") ||
    msg.includes("created_at") ||
    msg.includes("PGRST") ||
    msg.toLowerCase().includes("schema cache")
  ) {
    const fallback = await supabase.from("postagens").select(POST_LIST_SELECT).eq("mes", mes);
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []).map(normalizeRow).filter(row => {
      const date = parseDateBR(row.data);
      return !date || (date.getFullYear() === year && date.getMonth() === mes);
    });
  }

  throw new Error(firstError?.message || "Falha ao carregar postagens");
}

async function dbLoadAllRows(): Promise<Row[]> {
  const { data, error } = await supabase
    .from("postagens")
    .select(POST_SEARCH_SELECT);

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeRow);
}

async function dbLoadPost(id: string): Promise<Row> {
  const { data, error } = await supabase
    .from("postagens")
    .select("*")
    .eq("id", id)
    .limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) throw new Error("A postagem não foi encontrada.");
  return { ...normalizeRow(row), details_loaded: true };
}

async function dbLoadCentralRows(): Promise<Row[]> {
  const year = new Date().getFullYear();
  const [dated, backlog] = await Promise.all([
    supabase.from("postagens").select(POST_CENTRAL_SELECT).gte("data_iso", `${year}-01-01`).lte("data_iso", `${year}-12-31`).order("data_iso", { ascending: true }),
    supabase.from("postagens").select(POST_CENTRAL_SELECT).is("data_iso", null).order("created_at", { ascending: false }),
  ]);
  const error = dated.error ?? backlog.error;
  if (error) {
    const message = error.message || "";
    if (message.includes("data_iso") || message.toLowerCase().includes("schema cache") || message.includes("PGRST")) return dbLoadAllRows();
    throw new Error(message || "Falha ao carregar resumo editorial");
  }
  const merged = [...(dated.data ?? []), ...(backlog.data ?? [])];
  return Array.from(new Map(merged.map(row => [row.id, row])).values()).map(normalizeRow);
}

function rowForDb(row: Row): Omit<Row, "details_loaded"> {
  const payload={...row};
  delete payload.details_loaded;
  return payload;
}

async function dbUpsert(row: Row): Promise<void> {
  const { data, error } = await supabase
    .from("postagens")
    .upsert(rowForDb(row), { onConflict: "id" })
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("O Supabase não salvou a postagem. Verifique as policies de INSERT/UPDATE/RLS da tabela postagens para usuários autenticados.");
  }
}

async function dbUpsertMany(rows: Row[]): Promise<void> {
  if (!rows.length) return;

  const { data, error } = await supabase
    .from("postagens")
    .upsert(rows.map(rowForDb), { onConflict: "id" })
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length !== rows.length) {
    throw new Error("O Supabase não salvou todas as postagens. Verifique as policies de INSERT/UPDATE/RLS da tabela postagens para usuários autenticados.");
  }
}

async function dbPatch(id: string, patch: Partial<Row>): Promise<void> {
  const { data, error } = await supabase
    .from("postagens")
    .update(patch)
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("O Supabase não atualizou a postagem. Verifique a policy de UPDATE/RLS da tabela postagens para usuários autenticados.");
  }
}

async function dbDelete(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("postagens")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("O Supabase não excluiu a postagem. Verifique a policy de DELETE/RLS da tabela postagens para usuários autenticados.");
  }
}

async function dbLoadLeads(): Promise<Lead[]> {
  const { data, error } = await supabase.from("clientes").select(LEAD_SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Lead[];
}
async function dbLoadLeadSummary(): Promise<Lead[]> {
  const { data, error } = await supabase.from("clientes").select(LEAD_SUMMARY_SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Lead[];
}
async function dbLoadLeadAttribution(): Promise<Lead[]> {
  const { data, error } = await supabase.from("clientes").select(LEAD_ATTRIBUTION_SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Lead[];
}
async function dbUpdateLead(id: string, patch: Partial<Lead>): Promise<void> {
  const { data, error } = await supabase.from("clientes").update(patch).eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("O CRM não confirmou a atualização do lead.");
}
async function dbCreateLead(payload: Partial<Lead>): Promise<void> {
  const { data, error } = await supabase.from("clientes").insert(payload).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("O CRM não confirmou a criação do lead.");
}
async function dbLoadInfluencers(): Promise<Influencer[]> {
  const { data, error } = await supabase.from("influencers").select("*").order("clicks", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Influencer[];
}
async function dbCreateInfluencer(nome: string, codigo: string): Promise<void> {
  const { data, error } = await supabase.from("influencers").insert({ nome, codigo }).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("O cadastro do parceiro não foi confirmado.");
}
async function dbUpdateInfluencer(id: string, patch: Partial<Influencer>): Promise<void> {
  const { data, error } = await supabase.from("influencers").update(patch).eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("A alteração do parceiro não foi confirmada.");
}
async function dbDeleteInfluencer(id: string): Promise<void> {
  const { data, error } = await supabase.from("influencers").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("A exclusão do parceiro não foi confirmada.");
}
function slugifyCodigo(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

// ─── UI base ───────────────────────────────────────────────────────────────

function useIsMobile() {
  const query = "(max-width: 919px)";
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setIsMobile(media.matches);
    media.addEventListener("change", sync);
    sync();
    return () => media.removeEventListener("change", sync);
  }, []);
  return isMobile;
}

function useDialogFocus(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    if (!node) return;
    const focusables = () => [...node.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
    const first = focusables()[0];
    window.setTimeout(() => (first || node).focus(), 20);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (!list.length) { event.preventDefault(); node.focus(); return; }
      const a = list[0], b = list[list.length - 1];
      if (event.shiftKey && document.activeElement === a) { event.preventDefault(); b.focus(); }
      else if (!event.shiftKey && document.activeElement === b) { event.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
      previous?.focus?.();
    };
  }, [active, onClose]);
  return ref;
}



const inputStyle: CSSProperties = { width: "100%", background: "#110828", color: "#e2d0ff", border: "1px solid #4a2a8a", borderRadius: 9, padding: "9px 10px", outline: "none", fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 600 };

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_COLORS[status];
  return <span className="cxp-status" style={{ background:c.bg, color:c.text, border:`1px solid ${c.border}55` }}><span className="cxp-status-dot"/>{status}</span>;
}
function Spinner() { return <div className="cxp-spinner" role="status" aria-label="Carregando" />; }
function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return <div className="cxp-loading" role="status" aria-live="polite"><div className="cxp-skeleton-line wide"/><div className="cxp-skeleton-grid"><span/><span/><span/></div><div className="cxp-loading-label"><Spinner/><span>{label}</span></div></div>;
}
function StatePanel({ tone = "neutral", title, description, actionLabel, onAction }: { tone?:"neutral"|"error"|"success"; title:string; description:string; actionLabel?:string; onAction?:()=>void }) {
  return <section className={`cxp-state ${tone}`} role={tone==="error"?"alert":"status"}><div className="cxp-state-mark" aria-hidden="true">{tone==="error"?"!":tone==="success"?"✓":"✦"}</div><div><h2>{title}</h2><p>{description}</p>{actionLabel&&onAction&&<button type="button" className="cxp-btn" onClick={onAction}>{actionLabel}</button>}</div></section>;
}
function CopyButton({ value, label="Copiar", compact=false, onFail }: { value:string; label?:string; compact?:boolean; onFail?:()=>void }) {
  const [copied,setCopied]=useState(false);
  const run=async()=>{const ok=await copyText(value);if(!ok){onFail?.();return}setCopied(true);window.setTimeout(()=>setCopied(false),1300)};
  return <button type="button" className={`cxp-btn ${compact?"icon":""} ${copied?"green":""}`} onClick={()=>void run()} disabled={!value.trim()} aria-label={copied?`${label}: copiado`:label} title={copied?"Copiado!":label}>{compact?(copied?"✓":"⧉"):(copied?"Copiado ✓":label)}</button>;
}
function UrgencyBadge({ row }: { row:Row }) {
  const urgency=getUrgencyMeta(row);
  if(!urgency)return null;
  return <span className={`cxp-urgency ${urgency.level}`} style={{color:urgency.color,background:urgency.bg,borderColor:urgency.border}}>{urgency.level==="atrasado"?"!":"⚡"} {urgency.label}</span>;
}
function FilePreview({ raw }: { raw:string }) {
  const links=useMemo(()=>parseLinks(raw),[raw]);
  const [open,setOpen]=useState(false),[index,setIndex]=useState(0);
  const dialogRef=useDialogFocus(open,()=>setOpen(false));
  if(!links.length)return null;
  const safeIndex=Math.min(index,links.length-1);
  const current=links[safeIndex]||links[0];
  const thumb=driveThumbnailUrl(links[0]);
  return <div className="cxp-files">
    <div className="cxp-files-head"><div><div className="cxp-label">Arquivos vinculados</div><div className="cxp-title" style={{fontSize:12}}>{links.length} arquivo{links.length!==1?"s":""}</div></div><button type="button" className="cxp-btn" onClick={()=>{setIndex(0);setOpen(true)}}>▶ Visualizar</button></div>
    <button type="button" className="cxp-file-cover" onClick={()=>{setIndex(0);setOpen(true)}} aria-label="Visualizar arquivos vinculados">{thumb?<img src={thumb} alt="" loading="lazy" onError={event=>{event.currentTarget.style.display="none"}}/>:<span className="cxp-file-cover-placeholder" aria-hidden="true">📎</span>}<span className="cxp-file-cover-overlay">▶ Visualizar</span>{links.length>1&&<span className="cxp-file-count">1/{links.length}</span>}</button>
    <div className="cxp-file-list">{links.slice(0,4).map((link,i)=><div className="cxp-file-row" key={`${link}-${i}`}><span className="cxp-file-icon" aria-hidden="true">📎</span><a href={link} target="_blank" rel="noreferrer" title={link}>{driveFileId(link)?`Arquivo do Drive ${i+1}`:`Link ${i+1}`}</a><CopyButton value={link} label={`Copiar link ${i+1}`} compact/></div>)}</div>
    {open&&<><div className="cxp-overlay" style={{zIndex:1800}} onClick={()=>setOpen(false)} aria-hidden="true"/><section ref={dialogRef} className="cxp-file-modal" role="dialog" aria-modal="true" aria-labelledby="file-preview-title" tabIndex={-1}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Produção</div><h2 id="file-preview-title" className="cxp-section-title" style={{margin:0}}>Preview de arquivo</h2></div><button type="button" className="cxp-btn icon ghost" onClick={()=>setOpen(false)} aria-label="Fechar preview">×</button></div>{links.length>1&&<div className="cxp-file-nav"><button type="button" className="cxp-btn" onClick={()=>setIndex(value=>Math.max(0,value-1))} disabled={safeIndex===0}>‹ Anterior</button><span>{safeIndex+1} / {links.length}</span><button type="button" className="cxp-btn" onClick={()=>setIndex(value=>Math.min(links.length-1,value+1))} disabled={safeIndex===links.length-1}>Próximo ›</button></div>}<div className="cxp-file-frame-wrap"><iframe title={`Preview do arquivo ${safeIndex+1}`} src={drivePreviewUrl(current)} className="cxp-file-frame" allow="autoplay"/></div><div className="cxp-file-modal-actions"><a className="cxp-btn primary" href={current} target="_blank" rel="noreferrer">Abrir original ↗</a><CopyButton value={current} label="Copiar link"/></div></section></>}
  </div>;
}
function SectionTitle({ eyebrow, children, right }: { eyebrow?: string; children: ReactNode; right?: ReactNode }) {
  return <div className="cxp-section-head"><div>{eyebrow && <div className="cxp-section-eyebrow">{eyebrow}</div>}<div className="cxp-section-title">{children}</div></div>{right && <div className="cxp-section-actions">{right}</div>}</div>;
}
function ConfirmDialog({ open, title, description, confirmLabel = "Confirmar", onClose, onConfirm, busy = false }: { open:boolean;title:string;description:string;confirmLabel?:string;onClose:()=>void;onConfirm:()=>void;busy?:boolean }) {
  const ref = useDialogFocus(open, onClose);
  if (!open) return null;
  return <><div className="cxp-overlay" onClick={busy?undefined:onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" tabIndex={-1} style={{width:"min(480px,calc(100vw - 28px))"}}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Ação destrutiva</div><h2 id="confirm-title" className="cxp-section-title" style={{margin:0}}>{title}</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} disabled={busy} aria-label="Fechar confirmação">×</button></div><p id="confirm-description" className="cxp-muted" style={{fontSize:12,lineHeight:1.65,margin:"0 0 16px"}}>{description}</p><div style={{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}}><button type="button" className="cxp-btn" onClick={onClose} disabled={busy}>Cancelar</button><button type="button" className="cxp-btn danger" onClick={onConfirm} disabled={busy}>{busy?"Excluindo…":confirmLabel}</button></div></section></>;
}

function HelpCenter({ open, onClose, onRestartTutorial }: { open:boolean; onClose:()=>void; onRestartTutorial:()=>void }) {
  const ref=useDialogFocus(open,onClose);
  const [actor,setActor]=useState(getBrowserActorName());
  if(!open)return null;
  return <><div className="cxp-overlay" onClick={onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal" role="dialog" aria-modal="true" aria-labelledby="cxp-help-title" tabIndex={-1}>
    <div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Ajuda & contexto</div><h2 id="cxp-help-title" className="cxp-section-title" style={{margin:0}}>Central Criando XP</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} aria-label="Fechar ajuda">×</button></div>
    <div className="cxp-help-grid">
      <div className="cxp-card" style={{padding:14}}><div className="cxp-label">Tutorial</div><p>O tour é salvo apenas neste navegador e é independente do login compartilhado. A versão atual é {ONBOARDING_VERSION}.</p><button type="button" className="cxp-btn primary" onClick={()=>{onRestartTutorial();onClose()}}>Reiniciar tutorial</button></div>
      <div className="cxp-card" style={{padding:14}}><div className="cxp-label">Nome no histórico</div><p>Identifica alterações neste navegador. Não é autenticação e não concede permissão.</p><label className="cxp-field"><span>Nome</span><input className="cxp-input" value={actor} maxLength={60} onChange={e=>setActor(e.target.value)} onBlur={()=>setBrowserActorName(actor)} autoComplete="nickname"/></label><button type="button" className="cxp-btn" onClick={()=>{setBrowserActorName(actor);setActor(getBrowserActorName())}}>Salvar nome</button></div>
      <div className="cxp-card" style={{padding:14}}><div className="cxp-label">Atalhos</div><dl className="cxp-shortcuts"><div><dt>Buscar</dt><dd>Ctrl/⌘ + K</dd></div><div><dt>Fechar painel</dt><dd>Esc</dd></div><div><dt>Navegação</dt><dd>Tab / Shift+Tab</dd></div></dl></div>
    </div>
  </section></>;
}

function prettyDate(iso: string | null | undefined, long = false): string {
  if (!iso) return "Sem data";
  const d = parseDateBR(iso);
  if (!d) return "Sem data";
  if (long) return d.toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"long", year:"numeric" });
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" }).replace(" de ", " ");
}
function addDaysISO(iso: string, amount: number): string {
  const d = parseDateBR(iso) || new Date();
  d.setDate(d.getDate()+amount);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function firstDayISO(month: number): string { const y=new Date().getFullYear(); return `${y}-${pad(month+1)}-01`; }
function lastDayISO(month: number): string { const y=new Date().getFullYear(); const d=new Date(y,month+1,0); return `${y}-${pad(month+1)}-${pad(d.getDate())}`; }

function DatePicker({ value, onChange, allowEmpty = true, compact = false, label = "Escolher data" }: { value:string; onChange:(iso:string)=>void; allowEmpty?:boolean; compact?:boolean; label?:string }) {
  const isMobile=useIsMobile();
  const [open,setOpen]=useState(false);
  const [position,setPosition]=useState({left:16,top:100});
  const trigger=useRef<HTMLButtonElement|null>(null);
  const dialogRef=useDialogFocus(open,()=>setOpen(false));
  const selected=parseDateBR(value);
  const [cursor,setCursor]=useState(()=>selected||new Date());
  const year=cursor.getFullYear(),month=cursor.getMonth(),first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
  const cells:(number|null)[]=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)]; while(cells.length%7)cells.push(null);
  const choose=(iso:string)=>{onChange(iso);setOpen(false)};
  const show=()=>{
    setCursor(parseDateBR(value)||new Date());
    if(!isMobile&&trigger.current){
      const rect=trigger.current.getBoundingClientRect();
      setPosition({
        left:Math.max(8,Math.min(rect.left,window.innerWidth-326)),
        top:Math.max(8,Math.min(rect.bottom+8,window.innerHeight-430)),
      });
    }
    setOpen(true);
  };
  return <>
    <button ref={trigger} type="button" className={`cxp-date-trigger ${!value?"empty":""}`} style={compact?{minHeight:40,padding:"7px 9px"}:undefined} onClick={show} aria-haspopup="dialog" aria-expanded={open} aria-label={`${label}: ${value?prettyDate(value):"sem data"}`}>
      <span aria-hidden="true">◫</span><span style={{flex:1}}>{value?prettyDate(value):"Sem data / Backlog"}</span><span style={{color:"#9087a8"}} aria-hidden="true">⌄</span>
    </button>
    {open&&<><div className="cxp-overlay" style={{zIndex:1300,background:isMobile?"rgba(3,2,6,.68)":"transparent",backdropFilter:isMobile?"blur(4px)":"none"}} onClick={()=>setOpen(false)} aria-hidden="true"/><div ref={dialogRef} className="cxp-date-popover" style={isMobile?undefined:position} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
      <div className="cxp-date-head"><button type="button" className="cxp-btn icon ghost" onClick={()=>setCursor(new Date(year,month-1,1))} aria-label="Mês anterior">‹</button><div className="cxp-date-month" aria-live="polite">{MONTHS[month]} {year}</div><button type="button" className="cxp-btn icon ghost" onClick={()=>setCursor(new Date(year,month+1,1))} aria-label="Próximo mês">›</button></div>
      <div className="cxp-date-grid" role="grid" aria-label={`Calendário de ${MONTHS[month]} de ${year}`}>{WEEKDAYS.map(w=><div key={w} className="cxp-date-weekday" role="columnheader" aria-label={w}>{w.slice(0,1)}</div>)}{cells.map((day,i)=>{if(!day)return <div key={`e${i}`} aria-hidden="true"/>;const iso=`${year}-${pad(month+1)}-${pad(day)}`;return <button type="button" key={iso} className={`cxp-date-day ${value===iso?"selected":""} ${todayISO()===iso?"today":""}`} onClick={()=>choose(iso)} aria-pressed={value===iso} aria-label={prettyDate(iso,true)}>{day}</button>})}</div>
      <div className="cxp-date-quick"><button type="button" className="cxp-btn" onClick={()=>choose(todayISO())}>Hoje</button><button type="button" className="cxp-btn" onClick={()=>choose(tomorrowISO())}>Amanhã</button><button type="button" className="cxp-btn" onClick={()=>choose(addDaysISO(todayISO(),7))}>+ 1 semana</button>{allowEmpty&&<button type="button" className="cxp-btn" onClick={()=>choose("")}>Sem data</button>}</div>
    </div></>}
  </>;
}

function KpiCard({ label, value, hint, color }: { label:string; value:ReactNode; hint:string; color:string }) {
  return <div className="cxp-panel cxp-kpi"><div className="orb" style={{background:color}}/><div className="cxp-label">{label}</div><div className="value" style={{color}}>{value}</div><div className="hint">{hint}</div></div>;
}

function MobileTop({ title, syncStatus, onSearch, onNew, onHelp }: { title:string;syncStatus:"ok"|"saving"|"error";onSearch:()=>void;onNew:()=>void;onHelp:()=>void }) {
  const syncLabel=syncStatus==="error"?"Falha na sincronização":syncStatus==="saving"?"Salvando alterações":"Tudo sincronizado";
  return <div className="cxp-mobile-top"><img src="/icons/criandoxp.png" alt=""/><div className="cxp-mobile-title">{title}</div><span className="cxp-mobile-sync" title={syncLabel} aria-label={syncLabel} style={{background:syncStatus==="error"?"#fb7185":syncStatus==="saving"?"#c084fc":"#4ade80"}}/><button type="button" className="cxp-btn icon ghost" onClick={onHelp} aria-label="Ajuda" data-tour="help">?</button><button type="button" className="cxp-btn icon ghost" onClick={onSearch} aria-label="Buscar" data-tour="search">⌕</button><button type="button" className="cxp-btn icon primary" onClick={onNew} aria-label="Novo conteúdo" data-tour="new-content">＋</button></div>;
}

function Navigation({ appTab, setAppTab, mobile=false }: { appTab:AppTab;setAppTab:(tab:AppTab)=>void;mobile?:boolean }) {
  const items:[AppTab,string,string][]=[["hoje","✦","Hoje"],["conteudo","◫","Conteúdo"],["produtividade","⌁","Dados"],["leads","♙","Leads"],["influencers","↗","Parceiros"]];
  if(mobile)return <nav className="cxp-bottom-nav" aria-label="Navegação principal" data-tour="navigation">{items.map(([tab,icon,label])=><button type="button" key={tab} className={`cxp-bottom-item ${appTab===tab?"active":""}`} onClick={()=>setAppTab(tab)} aria-current={appTab===tab?"page":undefined} aria-label={label}><span className="ico" aria-hidden="true">{icon}</span><span>{label}</span></button>)}</nav>;
  return <nav className="cxp-side-nav" aria-label="Navegação principal" data-tour="navigation">{items.map(([tab,icon,label])=><button type="button" key={tab} className={`cxp-side-item ${appTab===tab?"active":""}`} onClick={()=>setAppTab(tab)} aria-current={appTab===tab?"page":undefined}><span className="cxp-side-icon" aria-hidden="true">{icon}</span><span>{label}</span></button>)}</nav>;
}

// ─── Central de Hoje ───────────────────────────────────────────────────────
function WeekPreview({ rows, onOpen, onCreate }: { rows:Row[];onOpen:(r:Row)=>void;onCreate:(iso:string)=>void }) {
  const today=todayISO();
  const start=parseDateBR(today)!;
  const monday=new Date(start); const day=monday.getDay(); monday.setDate(monday.getDate()-(day===0?6:day-1));
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);const iso=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;return{d,iso,items:rows.filter(r=>dateInputValue(r)===iso&&!isDone(r.status))}});
  return <div className="cxp-panel" style={{padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div className="cxp-label">Mapa da semana</div><div className="cxp-title" style={{fontSize:13}}>Ritmo editorial</div></div><span className="cxp-chip">{days.reduce((s,x)=>s+x.items.length,0)} conteúdos</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:6,overflowX:"auto"}}>{days.map(({d,iso,items})=><div key={iso} className="cxp-card" style={{padding:8,minWidth:72,borderColor:iso===today?"rgba(168,85,247,.55)":undefined}}><button type="button" onClick={()=>onCreate(iso)} style={{width:"100%",background:"transparent",border:0,color:"inherit",cursor:"pointer",padding:0,textAlign:"left"}}><div className="cxp-label" style={{marginBottom:3}}>{d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")}</div><div style={{font:"800 18px 'Cinzel',serif",color:iso===today?"#d8b4fe":"#d8d1e2"}}>{d.getDate()}</div></button><div style={{display:"flex",gap:3,marginTop:6,flexWrap:"wrap"}}>{items.slice(0,4).map(r=><button type="button" key={r.id} title={r.tema||r.postagem} onClick={()=>onOpen(r)} aria-label={`Abrir ${r.tema||r.postagem}`} style={{width:28,height:28,borderRadius:9,border:0,padding:0,background:"transparent",cursor:"pointer",position:"relative",color:STATUS_COLORS[r.status].border,boxShadow:"inset 0 0 0 8px transparent"}}><span aria-hidden="true" style={{width:8,height:8,borderRadius:"50%",background:"currentColor",display:"block",margin:"auto"}}/></button>)}{items.length>4&&<span style={{fontSize:10,color:"#9087a8"}}>+{items.length-4}</span>}</div></div>)}</div></div>;
}

function MissionList({ title, eyebrow, items, empty, accent, onOpen }: { title:string;eyebrow:string;items:Row[];empty:string;accent:string;onOpen:(r:Row)=>void }) {
  return <div className="cxp-panel" style={{padding:14}}><div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}><span style={{width:9,height:9,borderRadius:"50%",background:accent,boxShadow:`0 0 16px ${accent}`}}/><div style={{flex:1}}><div className="cxp-label" style={{margin:0}}>{eyebrow}</div><div className="cxp-title" style={{fontSize:12,marginTop:2}}>{title}</div></div><span className="cxp-chip">{items.length}</span></div>{items.length===0?<div className="cxp-muted" style={{fontSize:11,padding:"12px 2px"}}>{empty}</div>:<div style={{display:"grid",gap:5}}>{items.slice(0,6).map(r=><button type="button" key={r.id} onClick={()=>onOpen(r)} className="cxp-card interactive" style={{padding:"9px 10px",color:"inherit",textAlign:"left",width:"100%"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13}}>{REDE_ICONS[r.rede]||"◆"}</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:10,marginTop:2}}>{r.data||"Sem data"} · {r.formato||"sem formato"}</div></div><StatusBadge status={r.status}/></div></button>)}</div>}</div>;
}

function TodayCenter({ rows, leads, loading, error, onRetry, onOpenPost, onGoContent, onGoLeads, onCreateForDate, onNew }: {
  rows:Row[];leads:Lead[];loading:boolean;error?:string;onRetry:()=>void;onOpenPost:(r:Row)=>void;onGoContent:()=>void;onGoLeads:()=>void;onCreateForDate:(iso:string)=>void;onNew:()=>void;
}) {
  const today=todayISO(),tomorrow=tomorrowISO();
  const todayRows=rows.filter(r=>dateInputValue(r)===today&&!isDone(r.status));
  const late=rows.filter(isOverdue).sort((a,b)=>dateInputValue(a).localeCompare(dateInputValue(b)));
  const tomorrowRows=rows.filter(r=>dateInputValue(r)===tomorrow&&!isDone(r.status));
  const backlog=rows.filter(r=>!dateInputValue(r)&&!isDone(r.status));
  const newLeads=leads.filter(l=>l.status==="Novo lead");
  const month=new Date().getMonth();
  const monthRows=rows.filter(r=>{const iso=dateInputValue(r);return iso&&Number(iso.slice(5,7))-1===month&&r.status!=="Cancelado"});
  const published=monthRows.filter(r=>r.status==="Publicado");
  const weekEnd=addDaysISO(today,6);
  const weekRows=rows.filter(r=>{const iso=dateInputValue(r);return iso>=today&&iso<=weekEnd&&!isDone(r.status)});
  const upcoming=rows.filter(r=>{const iso=dateInputValue(r);return iso>=today&&!isDone(r.status)}).sort((a,b)=>dateInputValue(a).localeCompare(dateInputValue(b))).slice(0,8);
  if(loading)return <LoadingState label="Carregando o panorama editorial…" />;
  if(error)return <StatePanel tone="error" title="Não foi possível carregar a Central" description={error} actionLabel="Tentar novamente" onAction={onRetry}/>;
  return <div>
    <section className="cxp-panel" style={{padding:"20px 20px 18px",marginBottom:12,overflow:"hidden"}}><div style={{position:"absolute",right:-90,top:-110,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,.18),transparent 68%)"}}/><div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-end",flexWrap:"wrap",position:"relative"}}><div><div className="cxp-section-eyebrow">Criando XP · {new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</div><h1 style={{margin:"3px 0 5px",font:"800 clamp(23px,3vw,34px) 'Cinzel',serif",letterSpacing:"-.02em"}}>Central de operações</h1><div className="cxp-muted" style={{fontSize:11}}>O que precisa avançar hoje, sem transformar planejamento em caça ao tesouro.</div></div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button type="button" className="cxp-btn large" onClick={onGoContent}>Abrir calendário</button><button type="button" className="cxp-btn primary large" onClick={onNew}>＋ Nova postagem</button></div></div></section>
    <div className="cxp-kpi-grid" style={{marginBottom:12}}><KpiCard label="Hoje" value={todayRows.length} hint="conteúdos em jogo" color="#fb7185"/><KpiCard label="Esta semana" value={weekRows.length} hint="próximas entregas" color="#c084fc"/><KpiCard label="Atrasados" value={late.length} hint="pedindo socorro" color="#f59e0b"/><KpiCard label="Backlog" value={backlog.length} hint="ideias sem data" color="#e8c77b"/><KpiCard label="Publicados" value={published.length} hint={`${monthRows.length} planejados no mês`} color="#4ade80"/></div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.35fr) minmax(300px,.65fr)",gap:12,marginBottom:12}} className="cxp-home-top"><WeekPreview rows={rows} onOpen={onOpenPost} onCreate={onCreateForDate}/><div className="cxp-panel" style={{padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div><div className="cxp-label">Próximas postagens</div><div className="cxp-title" style={{fontSize:12}}>Na fila</div></div><button type="button" className="cxp-btn ghost" onClick={onGoContent}>Ver tudo →</button></div><div style={{display:"grid",gap:6}}>{upcoming.length?upcoming.slice(0,5).map(r=><button type="button" key={r.id} className="cxp-card interactive" onClick={()=>onOpenPost(r)} style={{padding:9,color:"inherit",textAlign:"left"}}><div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:34,height:34,borderRadius:10,display:"grid",placeItems:"center",background:STATUS_COLORS[r.status].rowBg,color:STATUS_COLORS[r.status].text}}>{REDE_ICONS[r.rede]||"◆"}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:10,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:10,marginTop:2}}>{prettyDate(dateInputValue(r))}</div></div></div></button>):<div className="cxp-muted" style={{fontSize:11,padding:10}}>Nada programado daqui pra frente.</div>}</div></div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12}} className="cxp-mission-grid"><MissionList title="Precisa acontecer hoje" eyebrow="Prioridade" items={todayRows} empty="Nada pendente para hoje." accent="#fb7185" onOpen={onOpenPost}/><MissionList title="Atrasados" eyebrow="Débito técnico humano" items={late} empty="Nenhum conteúdo atrasado." accent="#f59e0b" onOpen={onOpenPost}/><MissionList title="Amanhã" eyebrow="Próximo turno" items={tomorrowRows} empty="Nada marcado para amanhã." accent="#facc15" onOpen={onOpenPost}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}} className="cxp-mission-grid"><MissionList title="Banco de ideias" eyebrow="Backlog" items={backlog} empty="Sem ideias soltas." accent="#e8c77b" onOpen={onOpenPost}/><div className="cxp-panel" style={{padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div><div className="cxp-label">Aquisição</div><div className="cxp-title" style={{fontSize:12}}>Leads novos</div></div><span className="cxp-chip">{newLeads.length}</span></div>{newLeads.length?<div style={{display:"grid",gap:5}}>{newLeads.slice(0,6).map(l=>{const wa=whatsappUrl(l.whatsapp_discord||"");return <div key={l.id} className="cxp-card" style={{padding:9}}><div style={{display:"flex",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}><div style={{flex:1,minWidth:130}}><div style={{fontSize:11,fontWeight:800}}>{l.nome||"Sem nome"}</div><div className="cxp-muted" style={{fontSize:10,marginTop:2}}>{l.whatsapp_discord||"sem contato"} · {l.origem||l.utm_source||"origem não informada"}</div></div><div style={{display:"flex",gap:5}}><CopyButton value={l.nome||""} label="Copiar nome" compact/><CopyButton value={l.whatsapp_discord||""} label="Copiar contato" compact/>{wa&&<a className="cxp-btn icon green" href={wa} target="_blank" rel="noreferrer" aria-label={`Abrir WhatsApp de ${l.nome||"lead"}`} title="Abrir WhatsApp">💬</a>}</div></div></div>})}</div>:<div className="cxp-muted" style={{fontSize:11,padding:10}}>Nenhum lead novo.</div>}<button type="button" className="cxp-btn" style={{marginTop:10}} onClick={onGoLeads}>Abrir CRM →</button></div></div>
  </div>;
}


// ─── Calendário ────────────────────────────────────────────────────────────
function CalendarBoard({ rows, mes, scope, weekIndex, onWeekIndex, onMovePost, onOpen, onDayMenu }: {
  rows:Row[];mes:number;scope:CalendarScope;weekIndex:number;onWeekIndex:(n:number)=>void;onMovePost:(id:string,dateISO:string)=>void;onOpen:(r:Row)=>void;onDayMenu:(dateISO:string)=>void;
}) {
  const year=new Date().getFullYear(),firstDay=new Date(year,mes,1).getDay(),daysInMonth=new Date(year,mes+1,0).getDate();
  const cells:(number|null)[]=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];while(cells.length%7)cells.push(null);
  const maxWeek=Math.max(0,cells.length/7-1),currentWeek=Math.min(weekIndex,maxWeek);
  const visibleWeek=cells.slice(currentWeek*7,currentWeek*7+7);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const byDay:Record<number,Row[]>={};rows.forEach(r=>{const iso=dateInputValue(r);if(iso&&Number(iso.slice(0,4))===year&&Number(iso.slice(5,7))-1===mes){const d=Number(iso.slice(8,10));(byDay[d]||=[]).push(r)}});
  const dateRows=(day:number)=>[...(byDay[day]||[])].sort((a,b)=>FLOW_STATUS.indexOf(a.status)-FLOW_STATUS.indexOf(b.status));
  const renderPost=(r:Row,compact=false)=>{const c=STATUS_COLORS[r.status];return <button type="button" key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("rowId",r.id)} onClick={()=>onOpen(r)} className={compact?"cxp-agenda-item":"cxp-daypost"} style={compact?{borderLeft:`3px solid ${c.border}`,color:"inherit"}:{background:c.calBg,borderColor:`${c.border}88`,color:c.text}}>{compact?<><span style={{fontSize:15}}>{REDE_ICONS[r.rede]||"◆"}</span><div style={{flex:1,minWidth:0,textAlign:"left"}}><div style={{fontSize:11,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.formato===EXTRA_TIKTOK_FORMAT?"Vídeo extra TikTok":r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:10,marginTop:2}}>{r.formato||"sem formato"} · {r.responsavel||"sem responsável"}</div></div><div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}><UrgencyBadge row={r}/><StatusBadge status={r.status}/></div></>:<>{REDE_ICONS[r.rede]||"◆"} {r.formato===EXTRA_TIKTOK_FORMAT?"Extra TikTok":r.tema||r.postagem}</>}</button>};
  const drop=(iso:string,e:DragEvent)=>{e.preventDefault();const id=e.dataTransfer.getData("rowId");if(id)onMovePost(id,iso);setDragOver(null)};
  if(scope==="agenda"){
    const dated=Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>({day,items:dateRows(day)})).filter(x=>x.items.length||`${year}-${pad(mes+1)}-${pad(x.day)}`>=todayISO());
    return <div className="cxp-agenda">{dated.map(({day,items})=>{const iso=`${year}-${pad(mes+1)}-${pad(day)}`,d=new Date(year,mes,day);return <div key={day} className="cxp-panel cxp-agenda-day" onDragOver={e=>{e.preventDefault();setDragOver(iso)}} onDragLeave={()=>setDragOver(null)} onDrop={e=>drop(iso,e)} style={{outline:dragOver===iso?"2px dashed #a855f7":"none"}}><button type="button" className="cxp-agenda-date" onClick={()=>onDayMenu(iso)} style={{background:"transparent",border:0,color:"inherit",cursor:"pointer"}}><span>{d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")}</span><strong style={{color:iso===todayISO()?"#c084fc":"#eee8f7"}}>{day}</strong><span>{d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","")}</span></button><div className="cxp-agenda-list">{items.length?items.map(r=>renderPost(r,true)):<button type="button" className="cxp-agenda-item" onClick={()=>onDayMenu(iso)} style={{color:"#8a809a",borderStyle:"dashed",justifyContent:"center"}}>＋ Adicionar conteúdo</button>}</div></div>})}</div>;
  }
  if(scope==="semana"){
    return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><button type="button" className="cxp-btn" disabled={currentWeek===0} onClick={()=>onWeekIndex(Math.max(0,currentWeek-1))}>‹ Semana</button><div className="cxp-muted" style={{fontSize:10}}>Semana {currentWeek+1} de {MONTHS[mes]}</div><button type="button" className="cxp-btn" disabled={currentWeek===maxWeek} onClick={()=>onWeekIndex(Math.min(maxWeek,currentWeek+1))}>Semana ›</button></div><div className="cxp-week-board">{visibleWeek.map((day,i)=>{if(!day)return <div key={`e${i}`} className="cxp-week-column" style={{opacity:.2}}/>;const iso=`${year}-${pad(mes+1)}-${pad(day)}`,items=dateRows(day),d=new Date(year,mes,day);return <div key={day} className={`cxp-week-column ${iso===todayISO()?"today":""}`} onDragOver={e=>{e.preventDefault();setDragOver(iso)}} onDragLeave={()=>setDragOver(null)} onDrop={e=>drop(iso,e)} style={{outline:dragOver===iso?"2px dashed #a855f7":"none"}}><div className="cxp-week-column-head"><button type="button" onClick={()=>onDayMenu(iso)} aria-label={`Abrir ações de ${prettyDate(iso,true)}`} style={{background:"transparent",border:0,color:"inherit",textAlign:"left",cursor:"pointer"}}><div className="cxp-label" style={{margin:0}}>{d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")}</div><div style={{font:"800 18px 'Cinzel',serif",marginTop:2}}>{day}</div></button><button type="button" className="cxp-btn icon ghost" onClick={()=>onDayMenu(iso)} aria-label={`Adicionar conteúdo em ${prettyDate(iso,true)}`}>＋</button></div><div style={{display:"grid",gap:6}}>{items.map(r=>renderPost(r,true))}{!items.length&&<button type="button" aria-label={`Adicionar conteúdo em ${prettyDate(iso,true)}`} onClick={()=>onDayMenu(iso)} style={{border:"1px dashed rgba(196,181,253,.15)",background:"transparent",borderRadius:10,padding:12,color:"#8a809a",cursor:"pointer",fontSize:10}}>Dia livre</button>}</div></div>})}</div></div>;
  }
  return <div className="cxp-calendar-wrap"><div className="cxp-calendar-head">{WEEKDAYS.map(w=><div key={w} className="cxp-weekday">{w}</div>)}</div><div className="cxp-month-grid">{cells.map((day,i)=>{if(!day)return <div key={`e${i}`} className="cxp-day empty"/>;const iso=`${year}-${pad(mes+1)}-${pad(day)}`,items=dateRows(day);return <div key={day} className={`cxp-day ${iso===todayISO()?"today":""} ${dragOver===iso?"drop":""}`} onDragOver={e=>{e.preventDefault();setDragOver(iso)}} onDragLeave={()=>setDragOver(null)} onDrop={e=>drop(iso,e)}><div className="cxp-day-top"><button type="button" className="cxp-day-number" onClick={()=>onDayMenu(iso)} style={{border:0,cursor:"pointer"}}>{day}</button><button type="button" className="cxp-day-add" onClick={()=>onDayMenu(iso)}>＋</button></div>{items.slice(0,5).map(r=>renderPost(r))}{items.length>5&&<div className="cxp-muted" style={{fontSize:10,textAlign:"center",marginTop:3}}>+{items.length-5} conteúdos</div>}</div>})}</div></div>;
}

function Backlog({ rows, onOpen, onAdd }: { rows:Row[];onOpen:(r:Row)=>void;onAdd:()=>void }) {
  const backlog=rows.filter(r=>!dateInputValue(r)&&!isDone(r.status));
  return <aside className="cxp-panel cxp-backlog"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><div><div className="cxp-label">Banco de ideias</div><div className="cxp-title" style={{fontSize:12}}>Ideias sem data</div></div><button type="button" className="cxp-btn icon" onClick={onAdd} aria-label="Adicionar ideia ao backlog">＋</button></div><div className="cxp-muted" style={{fontSize:10,marginBottom:10}}>No PC, arraste para o calendário. No celular, abra a ideia e escolha uma data.</div><div className="cxp-backlog-list">{backlog.length?backlog.map(r=><button type="button" key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("rowId",r.id)} onClick={()=>onOpen(r)} className="cxp-idea"><div style={{fontSize:10,fontWeight:800}}>{r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:10,marginTop:4}}>{REDE_ICONS[r.rede]||"◆"} {r.formato||"sem formato"}</div></button>):<div className="cxp-muted" style={{fontSize:10,padding:12,textAlign:"center"}}>Backlog limpo. Estranhamente organizado.</div>}</div></aside>;
}

function KanbanView({ rows, onOpen, onStatus }: { rows:Row[];onOpen:(r:Row)=>void;onStatus:(id:string,status:Status)=>void }) {
  const [over,setOver]=useState<Status|null>(null);
  return <div className="cxp-kanban">{FLOW_STATUS.map(status=>{const c=STATUS_COLORS[status],items=rows.filter(r=>r.status===status);return <section key={status} className="cxp-kanban-col" onDragOver={e=>{e.preventDefault();setOver(status)}} onDragLeave={()=>setOver(null)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("rowId");if(id)onStatus(id,status);setOver(null)}} style={{outline:over===status?`2px dashed ${c.border}`:"none"}}><div className="cxp-kanban-head"><StatusBadge status={status}/><span className="cxp-chip">{items.length}</span></div>{items.map(r=>{const progress=r.checklist.length?Math.round(r.checklist.filter(x=>x.done).length/r.checklist.length*100):0;return <button type="button" key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("rowId",r.id)} onClick={()=>onOpen(r)} className="cxp-kanban-card" style={{borderLeft:`3px solid ${c.border}`}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}><div style={{fontSize:11,fontWeight:800,lineHeight:1.35}}>{r.tema||r.postagem}</div><span>{REDE_ICONS[r.rede]||"◆"}</span></div><div className="cxp-muted" style={{fontSize:10,marginTop:5}}>{r.data||"Backlog"} · {r.formato||"—"}</div>{r.checklist.length>0&&<div style={{marginTop:9}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#8a809a",marginBottom:4}}><span>Objetivos</span><span>{progress}%</span></div><div className="cxp-progress"><div style={{width:`${progress}%`}}/></div></div>}</button>})}</section>})}</div>;
}

// ─── Tabela / ações em massa ──────────────────────────────────────────────
function ContentTable({ rows, selected, onSelect, onSelectAll, onOpen, onUpdate, onAdapt, onDuplicate, onRemove }: {
  rows:Row[];selected:Set<string>;onSelect:(id:string)=>void;onSelectAll:()=>void;onOpen:(r:Row)=>void;onUpdate:(id:string,key:keyof Row,val:unknown)=>void;onAdapt:(r:Row)=>void;onDuplicate:(r:Row)=>void;onRemove:(id:string)=>void;
}) {
  return <div className="cxp-table-wrap"><table className="cxp-table"><thead><tr><th style={{width:38}}><input type="checkbox" aria-label="Selecionar todos os conteúdos visíveis" checked={rows.length>0&&rows.every(r=>selected.has(r.id))} onChange={onSelectAll}/></th><th>Data</th><th>Conteúdo</th><th>Rede</th><th>Formato</th><th>Responsável</th><th>Status</th><th style={{width:150}}>Ações</th></tr></thead><tbody>{rows.map(r=>{const c=STATUS_COLORS[r.status];if(r.formato===EXTRA_TIKTOK_FORMAT)return <tr key={r.id} style={{background:"linear-gradient(90deg,rgba(217,70,239,.06),transparent)"}}><td><input type="checkbox" aria-label={`Selecionar ${r.tema||r.postagem}`} checked={selected.has(r.id)} onChange={()=>onSelect(r.id)}/></td><td style={{minWidth:150}}><DatePicker compact value={dateInputValue(r)} onChange={iso=>onUpdate(r.id,"data",isoToBR(iso))}/></td><td colSpan={5}><button type="button" className="cxp-table-open" onClick={()=>onOpen(r)}><span className="cxp-table-title" style={{color:"#f0abfc"}}>🎵 Vídeo extra TikTok</span><span className="cxp-table-sub">Linha rápida · abrir detalhes</span></button></td><td><div style={{display:"flex",gap:5}}><button type="button" className="cxp-btn icon" onClick={()=>onDuplicate(r)} aria-label={`Duplicar ${r.tema||r.postagem}`} title="Duplicar">⧉</button><button type="button" className="cxp-btn icon" onClick={()=>onAdapt(r)} aria-label={`Adaptar ${r.tema||r.postagem}`}>↗</button><button type="button" className="cxp-btn icon danger" onClick={()=>onRemove(r.id)} aria-label={`Excluir ${r.tema||r.postagem}`}>×</button></div></td></tr>;return <tr key={r.id} style={{boxShadow:`inset 3px 0 ${c.border}`}}><td><input type="checkbox" aria-label={`Selecionar ${r.tema||r.postagem}`} checked={selected.has(r.id)} onChange={()=>onSelect(r.id)}/></td><td style={{minWidth:150}}><DatePicker compact value={dateInputValue(r)} onChange={iso=>onUpdate(r.id,"data",isoToBR(iso))}/></td><td style={{minWidth:240}}><button type="button" className="cxp-table-open" onClick={()=>onOpen(r)}><span className="cxp-table-title">{r.tema||r.postagem} <UrgencyBadge row={r}/></span><span className="cxp-table-sub">{r.hook?`Hook: ${r.hook}`:"Abrir ficha completa"}</span></button></td><td style={{minWidth:125}}><select className="cxp-input" value={r.rede} onChange={e=>onUpdate(r.id,"rede",e.target.value)}><option value="">—</option>{REDE_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></td><td style={{minWidth:125}}><select className="cxp-input" value={r.formato} onChange={e=>onUpdate(r.id,"formato",e.target.value)}><option value="">—</option>{FORMATO_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></td><td style={{minWidth:140}}><input className="cxp-input" value={r.responsavel} onChange={e=>onUpdate(r.id,"responsavel",e.target.value)} placeholder="Nome"/></td><td style={{minWidth:145}}><select value={r.status} onChange={e=>onUpdate(r.id,"status",e.target.value)} style={{...inputStyle,background:c.bg,color:c.text,borderColor:`${c.border}88`}}>{STATUS_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></td><td><div style={{display:"flex",gap:5}}><button type="button" className="cxp-btn icon" onClick={()=>onDuplicate(r)} aria-label={`Duplicar ${r.tema||r.postagem}`} title="Duplicar">⧉</button><button type="button" className="cxp-btn icon" onClick={()=>onAdapt(r)} aria-label={`Adaptar ${r.tema||r.postagem}`}>↗</button><button type="button" className="cxp-btn icon danger" onClick={()=>onRemove(r.id)} aria-label={`Excluir ${r.tema||r.postagem}`}>×</button></div></td></tr>})}</tbody></table>{rows.length===0&&<div style={{padding:50,textAlign:"center"}} className="cxp-muted">Nenhum conteúdo nesse filtro.</div>}</div>;
}

function MobileContentCards({ rows, onOpen, onUpdate, onAdapt, onDuplicate }: { rows:Row[];onOpen:(r:Row)=>void;onUpdate:(id:string,key:keyof Row,val:unknown)=>void;onAdapt:(r:Row)=>void;onDuplicate:(r:Row)=>void }) {
  if(!rows.length)return <StatePanel title="Nenhum conteúdo neste filtro" description="Mude os filtros ou crie uma nova postagem."/>;
  return <div className="cxp-mobile-cards">{rows.map(r=>{const c=STATUS_COLORS[r.status],progress=r.checklist.length?Math.round(r.checklist.filter(i=>i.done).length/r.checklist.length*100):0;return <article key={r.id} className="cxp-mobile-card" style={{boxShadow:`inset 4px 0 ${c.border}`}}><button type="button" className="cxp-mobile-card-open" onClick={()=>onOpen(r)}><span className="cxp-mobile-card-title">{r.formato===EXTRA_TIKTOK_FORMAT?"🎵 Vídeo extra TikTok":r.tema||r.postagem}</span><span className="cxp-mobile-card-meta"><span>{r.data||"Sem data"}</span><span>{REDE_ICONS[r.rede]||"◆"} {r.rede||"Rede pendente"}</span><span>{r.formato||"Formato pendente"}</span></span><UrgencyBadge row={r}/></button>{r.checklist.length>0&&<div className="cxp-mobile-progress"><div><span>Checklist</span><strong>{progress}%</strong></div><div className="cxp-progress"><div style={{width:`${progress}%`}}/></div></div>}<label className="cxp-mobile-status"><span>Status {r.responsavel?`· ${r.responsavel}`:""}</span><select className="cxp-input" value={r.status} onChange={e=>onUpdate(r.id,"status",e.target.value)} style={{background:c.bg,color:c.text,borderColor:`${c.border}88`}}>{STATUS_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></label><div className="cxp-mobile-card-actions-simple"><button type="button" className="cxp-btn primary" onClick={()=>onOpen(r)}>Editar</button><button type="button" className="cxp-btn" onClick={()=>onDuplicate(r)}>⧉ Duplicar</button><button type="button" className="cxp-btn" onClick={()=>onAdapt(r)}>↗ Adaptar</button></div></article>})}</div>;
}

function StatusOverview({ rows, active, onChange }: { rows:Row[];active:string;onChange:(status:string)=>void }) {
  const options=[...STATUS_OPTIONS,"Todos"] as const;
  return <div className="cxp-status-overview" role="group" aria-label="Resumo e filtro por status">{options.map(status=>{
    const isAll=status==="Todos",count=isAll?rows.length:rows.filter(row=>row.status===status).length,c=isAll?null:STATUS_COLORS[status];
    return <button type="button" key={status} className={`cxp-status-summary ${active===status?"active":""}`} aria-pressed={active===status} onClick={()=>onChange(status)} style={c?{borderColor:`${c.border}88`,background:c.bg,color:c.text}:undefined}><strong>{count}</strong><span>{isAll?"Total":status}</span></button>;
  })}</div>;
}

function BulkBar({ count, onStatus, onResponsavel, onDate, onPublish, onDuplicate, onDelete, onClear }: { count:number;onStatus:(s:Status)=>void;onResponsavel:(v:string)=>void;onDate:(iso:string)=>void;onPublish:()=>void;onDuplicate:()=>void;onDelete:()=>void;onClear:()=>void }) {
  const [resp,setResp]=useState(""),[date,setDate]=useState("");
  return <div className="cxp-panel cxp-bulk"><strong className="wide" style={{font:"800 11px 'Cinzel',serif",color:"#d8b4fe"}}>{count} selecionado{count!==1?"s":""}</strong><select className="cxp-btn" defaultValue="" onChange={e=>{if(e.target.value)onStatus(e.target.value as Status);e.currentTarget.value=""}}><option value="">Mudar etapa…</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select><div style={{minWidth:150}}><DatePicker compact value={date} onChange={iso=>{setDate(iso);if(iso)onDate(iso)}} allowEmpty={false}/></div><div style={{display:"flex",gap:5,minWidth:200}}><input className="cxp-input" value={resp} onChange={e=>setResp(e.target.value)} placeholder="Responsável"/><button type="button" className="cxp-btn" onClick={()=>resp.trim()&&onResponsavel(resp.trim())}>Aplicar</button></div><button type="button" className="cxp-btn green" onClick={onPublish}>✓ Publicar</button><button type="button" className="cxp-btn" onClick={onDuplicate}>Duplicar</button><button type="button" className="cxp-btn danger" onClick={onDelete}>Excluir</button><button type="button" className="cxp-btn ghost" onClick={onClear}>Limpar</button></div>;
}

// ─── Drawer completo da postagem ──────────────────────────────────────────
function PostDrawer({ row, onClose, onUpdate, onToggleChecklist, onAdapt, onDuplicate, onRemove }: { row:Row;onClose:()=>void;onUpdate:(id:string,key:keyof Row,val:unknown)=>void;onToggleChecklist:(id:string,itemId:string)=>void;onAdapt:(r:Row)=>void;onDuplicate:(r:Row)=>void;onRemove:(id:string)=>void }) {
  const ref=useDialogFocus(true,onClose);
  const progress=row.checklist.length?Math.round(row.checklist.filter(i=>i.done).length/row.checklist.length*100):0;
  const currentFlow=FLOW_STATUS.indexOf(row.status);
  if(!row.details_loaded)return <><div className="cxp-overlay" onClick={onClose} aria-hidden="true"/><aside ref={ref} className="cxp-drawer" role="dialog" aria-modal="true" aria-labelledby="cxp-post-loading-title" tabIndex={-1}><div className="cxp-drawer-head"><div><div className="cxp-section-eyebrow">Ficha da postagem</div><h2 id="cxp-post-loading-title" className="cxp-section-title" style={{margin:0}}>{row.tema||row.postagem}</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} aria-label="Fechar postagem">×</button></div><div style={{padding:24}}><LoadingState label="Carregando roteiro, briefing e materiais…"/></div></aside></>;
  const field=(label:string,key:keyof Row,multiline=false,placeholder="")=>{
    const id=`post-${row.id}-${String(key)}`;
    return <label className="cxp-field" htmlFor={id}><span>{label}</span>{multiline?<textarea id={id} className="cxp-input" value={String(row[key]??"")} onChange={e=>onUpdate(row.id,key,e.target.value)} placeholder={placeholder}/>:<input id={id} className="cxp-input" value={String(row[key]??"")} onChange={e=>onUpdate(row.id,key,e.target.value)} placeholder={placeholder}/>}</label>;
  };
  return <><div className="cxp-overlay" onClick={onClose} aria-hidden="true"/><aside ref={ref} className="cxp-drawer" role="dialog" aria-modal="true" aria-labelledby="cxp-post-title" tabIndex={-1}><div className="cxp-drawer-head"><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}><div style={{minWidth:0}}><div className="cxp-label">Detalhes da postagem</div><div id="cxp-post-title" className="cxp-title" style={{fontSize:19,overflow:"hidden",textOverflow:"ellipsis"}}>{row.tema||row.postagem}</div><div className="cxp-muted" style={{fontSize:10,marginTop:5}}>{REDE_ICONS[row.rede]||"◆"} {row.rede||"sem rede"} · {row.formato||"sem formato"}</div><div style={{marginTop:7}}><UrgencyBadge row={row}/></div></div><button type="button" className="cxp-btn icon" onClick={onClose} aria-label="Fechar detalhes da postagem">×</button></div></div><div className="cxp-drawer-body">
    <section className="cxp-drawer-section" aria-labelledby="flow-label"><div id="flow-label" className="cxp-label">Progressão</div><div className="cxp-flow" role="group" aria-label="Etapa de produção">{FLOW_STATUS.map((status,i)=><button type="button" key={status} className={`cxp-flow-step ${row.status===status?"current":i<currentFlow?"done":""}`} onClick={()=>onUpdate(row.id,"status",status)} aria-pressed={row.status===status}>{i<currentFlow?"✓ ":""}{status}</button>)}</div></section>
    <section className="cxp-drawer-section"><div className="cxp-responsive-two" style={{display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:9}}><div><div className="cxp-label">Data da postagem</div><DatePicker value={dateInputValue(row)} onChange={iso=>onUpdate(row.id,"data",isoToBR(iso))} label="Data da postagem"/></div><label className="cxp-field"><span>Responsável</span><input className="cxp-input" value={row.responsavel} onChange={e=>onUpdate(row.id,"responsavel",e.target.value)} placeholder="Nome"/></label><label className="cxp-field"><span>Rede</span><select className="cxp-input" value={row.rede} onChange={e=>onUpdate(row.id,"rede",e.target.value)}><option value="">—</option>{REDE_OPTIONS.map(option=><option key={option}>{option}</option>)}</select></label><label className="cxp-field"><span>Formato</span><select className="cxp-input" value={row.formato} onChange={e=>onUpdate(row.id,"formato",e.target.value)}><option value="">—</option>{FORMATO_OPTIONS.map(option=><option key={option}>{option}</option>)}</select></label></div></section>
    <section className="cxp-drawer-section"><div className="cxp-label">Essência do conteúdo</div><div style={{display:"grid",gap:3}}>{field("Tema","tema",false,"Tema / título")}{field("Hook","hook",true,"A primeira frase que prende atenção")}{field("Roteiro / legenda","roteiro",true,"Roteiro, legenda ou copy principal")}{field("CTA","cta",true,"A ação que você quer provocar")}</div></section>
    <section className="cxp-drawer-section"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><div><div className="cxp-label">Checklist</div><div className="cxp-title" style={{fontSize:12}}>Checklist de produção</div></div><div style={{textAlign:"right"}}><div style={{font:"800 16px 'Cinzel',serif",color:"#c084fc"}}>{progress}%</div><div className="cxp-muted" style={{fontSize:10}}>{row.checklist.filter(i=>i.done).length}/{row.checklist.length}</div></div></div><div className="cxp-progress" style={{marginBottom:8}} role="progressbar" aria-label="Progresso do checklist" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${progress}%`}}/></div>{row.checklist.length?row.checklist.map(item=><button type="button" key={item.id} className={`cxp-objective ${item.done?"done":""}`} onClick={()=>onToggleChecklist(row.id,item.id)} aria-pressed={item.done}><span className="cxp-check" aria-hidden="true">{item.done?"✓":""}</span><span className="cxp-objective-label">{item.label}</span></button>):<div className="cxp-muted" style={{fontSize:11}}>Escolha um formato para gerar um checklist automaticamente.</div>}</section>
    <section className="cxp-drawer-section"><div className="cxp-label">Produção e referências</div><div style={{display:"grid",gap:3}}>{field("Briefing","briefing",true,"Objetivo, contexto e direcionamento")}{field("Referências","referencias",true,"Links, referências visuais e ideias")}{field("Arquivos","link_arquivo",true,"Links do Drive separados por vírgula ou linha")}{row.link_arquivo&&<FilePreview raw={row.link_arquivo}/>} {field("Observações","observacoes",true,"Anotações internas")}</div></section>
    {row.status==="Publicado"&&<section className="cxp-drawer-section"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div><div className="cxp-label">Resultado</div><div className="cxp-title" style={{fontSize:12,color:"#86efac"}}>Performance orgânica</div></div><span className="cxp-chip">alimentar aprendizado</span></div><div className="cxp-metric-grid">{(["views","likes","shares","saves","followers_gained"] as (keyof Row)[]).map(key=><label key={String(key)} className="cxp-metric"><span className="cxp-label">{{views:"Views",likes:"Curtidas",shares:"Compart.",saves:"Salvos",followers_gained:"Seguidores"}[key as string]}</span><input className="cxp-input" inputMode="numeric" type="number" min="0" step="1" value={Number(row[key]||0)} onChange={e=>onUpdate(row.id,key,Number(e.target.value))}/></label>)}</div></section>}
    <section className="cxp-drawer-section"><div className="cxp-label">Histórico de alterações</div><div className="cxp-title" style={{fontSize:12,marginBottom:9}}>Histórico</div>{row.historico.length===0?<div className="cxp-muted" style={{fontSize:10}}>Nenhuma alteração importante registrada ainda.</div>:row.historico.slice().reverse().slice(0,30).map((history,i)=><div key={`${history.at}-${i}`} style={{borderTop:i?"1px solid rgba(196,181,253,.07)":"none",padding:"8px 0"}}><div style={{fontSize:10,lineHeight:1.45}}><strong>{history.actor}</strong> alterou {prettyField(history.field)} <span className="cxp-muted">{history.from||"—"}</span> → <span style={{color:"#c084fc"}}>{history.to||"—"}</span></div><div className="cxp-muted" style={{fontSize:10,marginTop:2}}>{humanDateTime(history.at)}</div></div>)}</section>
  </div><div className="cxp-drawer-footer"><button type="button" className="cxp-btn" onClick={()=>onDuplicate(row)}>⧉ Duplicar</button><button type="button" className="cxp-btn primary" onClick={()=>onAdapt(row)}>↗ Adaptar para outra rede</button><button type="button" className="cxp-btn danger" onClick={()=>onRemove(row.id)}>Excluir</button></div></aside></>;
}

function QuickPostModal({ initialDate = "", onClose, onCreate }: { initialDate?:string;onClose:()=>void;onCreate:(partial:Partial<Row>,dateISO:string,openDetails:boolean)=>Promise<boolean> }) {
  const ref=useDialogFocus(true,onClose);
  const [tema,setTema]=useState("");
  const [dateISO,setDateISO]=useState(initialDate);
  const [rede,setRede]=useState("Instagram");
  const [formato,setFormato]=useState("Reels");
  const [responsavel,setResponsavel]=useState(()=>getBrowserActorName()||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const create=async(openDetails:boolean)=>{const title=tema.trim();if(title.length<2){setError("Dê um nome para a postagem.");return}if(saving)return;setSaving(true);setError("");try{const ok=await onCreate({postagem:title,tema:title,rede,formato,responsavel,status:"Ideia",checklist:makeChecklist(formato)},dateISO,openDetails);if(ok)onClose()}finally{setSaving(false)}};
  const submit=(event:FormEvent)=>{event.preventDefault();void create(false)};
  return <><div className="cxp-overlay" onClick={saving?undefined:onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal cxp-quick-create" role="dialog" aria-modal="true" aria-labelledby="quick-post-title" tabIndex={-1}><form onSubmit={submit}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Criação rápida</div><h2 id="quick-post-title" className="cxp-section-title" style={{margin:0}}>Nova postagem</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} disabled={saving} aria-label="Fechar criação rápida">×</button></div><p className="cxp-quick-copy">Coloque o essencial agora. Roteiro, CTA, briefing, arquivos e métricas ficam para quando realmente forem necessários.</p>{error&&<div className="cxp-inline-error" role="alert">{error}</div>}<div className="cxp-quick-fields"><label className="cxp-field cxp-quick-title"><span>Tema / título *</span><input autoFocus className="cxp-input" value={tema} onChange={e=>setTema(e.target.value)} placeholder="Ex.: 3 erros que acabam com uma sessão" maxLength={160}/></label><div><div className="cxp-label">Data</div><DatePicker value={dateISO} onChange={setDateISO} label="Data da postagem"/></div><label className="cxp-field"><span>Rede</span><select className="cxp-input" value={rede} onChange={e=>setRede(e.target.value)}>{REDE_OPTIONS.filter(option=>option!=="Todos").map(option=><option key={option}>{option}</option>)}</select></label><label className="cxp-field"><span>Formato</span><select className="cxp-input" value={formato} onChange={e=>setFormato(e.target.value)}>{FORMATO_OPTIONS.map(option=><option key={option}>{option}</option>)}</select></label><label className="cxp-field"><span>Responsável</span><input className="cxp-input" value={responsavel} onChange={e=>setResponsavel(e.target.value)} placeholder="Opcional"/></label></div><div className="cxp-quick-note">A postagem começa como <strong>Ideia</strong>. Você pode salvar e seguir trabalhando, ou abrir a ficha completa imediatamente.</div><div className="cxp-quick-actions"><button type="button" className="cxp-btn" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="cxp-btn" disabled={saving}>{saving?"Criando…":"Criar rápido"}</button><button type="button" className="cxp-btn primary" disabled={saving} onClick={()=>void create(true)}>Criar e detalhar</button></div></form></section></>;
}

function TemplateModal({ onClose, onCreate }: { onClose:()=>void;onCreate:(t:TemplateDef)=>void }) {
  const ref=useDialogFocus(true,onClose);
  return <><div className="cxp-overlay" onClick={onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal" role="dialog" aria-modal="true" aria-labelledby="template-title" tabIndex={-1}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Modelos de conteúdo</div><h2 id="template-title" className="cxp-section-title" style={{margin:0}}>Criar a partir de modelo</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} aria-label="Fechar modelos">×</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:9}}>{TEMPLATES.map(template=><button type="button" key={template.id} onClick={()=>onCreate(template)} className="cxp-card interactive" style={{padding:15,textAlign:"left",color:"#f4efff"}}><div style={{width:42,height:42,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(124,58,237,.12)",fontSize:21,marginBottom:10}} aria-hidden="true">{template.icon}</div><div className="cxp-title" style={{fontSize:11}}>{template.label}</div><div className="cxp-muted" style={{fontSize:10,marginTop:5}}>{template.rede} · {template.formato}</div></button>)}</div></section></>;
}

function RecurrenceModal({ mes, onClose, onGenerate }: { mes:number;onClose:()=>void;onGenerate:(weekdays:number[],template:TemplateDef,start:string,end:string)=>void }) {
  const ref=useDialogFocus(true,onClose);
  const [days,setDays]=useState<number[]>([2,4]),[templateId,setTemplateId]=useState("reels"),[start,setStart]=useState(firstDayISO(mes)),[end,setEnd]=useState(lastDayISO(mes));
  const toggle=(day:number)=>setDays(previous=>previous.includes(day)?previous.filter(value=>value!==day):[...previous,day]);
  const preset=(type:string)=>{if(type==="tt"){setTemplateId("tiktok");setDays([1,3,5])}else if(type==="daily"){setTemplateId("caixinha");setDays([0,1,2,3,4,5,6])}else{setTemplateId("reels");setDays([2,4])}};
  const template=TEMPLATES.find(item=>item.id===templateId)!;
  return <><div className="cxp-overlay" onClick={onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal" role="dialog" aria-modal="true" aria-labelledby="recurrence-title" tabIndex={-1}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Automação editorial</div><h2 id="recurrence-title" className="cxp-section-title" style={{margin:0}}>Recorrência</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} aria-label="Fechar recorrência">×</button></div><p className="cxp-muted" style={{fontSize:11,lineHeight:1.6,margin:"0 0 13px"}}>Escolha um padrão, os dias e o período. A geração é limitada a um ano para evitar criações acidentais gigantes.</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:14}}><button type="button" className="cxp-btn" onClick={()=>preset("twice")}>Ter + Qui</button><button type="button" className="cxp-btn" onClick={()=>preset("tt")}>3 TikToks/sem</button><button type="button" className="cxp-btn" onClick={()=>preset("daily")}>Story diário</button></div><div className="cxp-label">Modelo</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:6,marginBottom:14}}>{TEMPLATES.map(item=><button type="button" key={item.id} className="cxp-card interactive" aria-pressed={templateId===item.id} onClick={()=>setTemplateId(item.id)} style={{padding:10,textAlign:"left",color:templateId===item.id?"#fff":"#b3a9bd",borderColor:templateId===item.id?"rgba(192,132,252,.48)":undefined}}><span style={{marginRight:6}} aria-hidden="true">{item.icon}</span><span style={{fontSize:10,fontWeight:800}}>{item.label}</span></button>)}</div><fieldset className="cxp-fieldset"><legend>Dias da semana</legend><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>{WEEKDAYS.map((weekday,i)=><button type="button" key={weekday} className={`cxp-chip ${days.includes(i)?"active":""}`} style={{justifyContent:"center",padding:"9px 4px"}} onClick={()=>toggle(i)} aria-pressed={days.includes(i)}>{weekday.slice(0,3)}</button>)}</div></fieldset><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><div><div className="cxp-label">Começa</div><DatePicker value={start} onChange={setStart} allowEmpty={false} label="Data inicial"/></div><div><div className="cxp-label">Termina</div><DatePicker value={end} onChange={setEnd} allowEmpty={false} label="Data final"/></div></div><div className="cxp-muted" style={{fontSize:10,marginTop:10}}>Serão criados conteúdos apenas nos dias selecionados dentro desse intervalo.</div><div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:15,flexWrap:"wrap"}}><button type="button" className="cxp-btn" onClick={onClose}>Cancelar</button><button type="button" className="cxp-btn primary" disabled={!days.length||!start||!end||end<start} onClick={()=>onGenerate(days,template,start,end)}>Gerar recorrência</button></div></section></>;
}

function AdaptModal({ row, onClose, onCreate }: { row:Row;onClose:()=>void;onCreate:(network:string,format:string)=>void }) {
  const ref=useDialogFocus(true,onClose);
  const [network,setNetwork]=useState(row.rede==="TikTok"?"Instagram":"TikTok");
  const suggestedFor=(target:string)=>target==="YouTube"?"Shorts":target==="TikTok"?"Reels":row.formato===EXTRA_TIKTOK_FORMAT?"Reels":row.formato;
  const [format,setFormat]=useState(()=>suggestedFor(row.rede==="TikTok"?"Instagram":"TikTok"));
  const changeNetwork=(target:string)=>{setNetwork(target);setFormat(suggestedFor(target))};
  return <><div className="cxp-overlay" onClick={onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal" role="dialog" aria-modal="true" aria-labelledby="adapt-title" tabIndex={-1}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Reaproveitar conteúdo</div><h2 id="adapt-title" className="cxp-section-title" style={{margin:0}}>Adaptar para outra rede</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} aria-label="Fechar adaptação">×</button></div><div className="cxp-panel soft" style={{padding:12,marginBottom:13}}><div style={{fontSize:11,fontWeight:800}}>{row.tema||row.postagem}</div><div className="cxp-muted" style={{fontSize:10,marginTop:3}}>{row.rede||"sem rede"} · {row.formato||"sem formato"}</div></div><div className="cxp-adapt-grid"><label className="cxp-field"><span>Rede destino</span><select className="cxp-input" value={network} onChange={e=>changeNetwork(e.target.value)}>{REDE_OPTIONS.filter(value=>value!=="Todos").map(value=><option key={value}>{value}</option>)}</select></label><label className="cxp-field"><span>Formato destino</span><select className="cxp-input" value={format} onChange={e=>setFormat(e.target.value)}>{FORMATO_OPTIONS.filter(value=>value!==EXTRA_TIKTOK_FORMAT).map(value=><option key={value}>{value}</option>)}</select></label></div><p className="cxp-muted" style={{fontSize:10,lineHeight:1.55,marginTop:12}}>Tema e materiais serão copiados. A adaptação volta para <strong>Ideia</strong> e ganha um checklist novo.</p><div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:14}}><button type="button" className="cxp-btn" onClick={onClose}>Cancelar</button><button type="button" className="cxp-btn primary" onClick={()=>onCreate(network,format)}>Criar adaptação</button></div></section></>;
}

function DayActionSheet({ dateISO, rows, onClose, onNew, onExtra, onIdea, onDuplicate }: { dateISO:string;rows:Row[];onClose:()=>void;onNew:()=>void;onExtra:()=>void;onIdea:()=>void;onDuplicate:(row:Row)=>void }) {
  const ref=useDialogFocus(true,onClose);
  const [sourceId,setSourceId]=useState("");
  const sources=rows.filter(row=>row.status!=="Cancelado").slice().sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||"")).slice(0,40);
  return <><div className="cxp-overlay" onClick={onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal" role="dialog" aria-modal="true" aria-labelledby="day-actions-title" tabIndex={-1}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Ação rápida</div><h2 id="day-actions-title" className="cxp-section-title" style={{margin:0}}>{prettyDate(dateISO,true)}</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} aria-label="Fechar ações do dia">×</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><button type="button" className="cxp-card interactive" style={{padding:14,color:"inherit",textAlign:"left"}} onClick={onNew}><div style={{fontSize:20,marginBottom:7}} aria-hidden="true">✦</div><div style={{fontSize:11,fontWeight:800}}>Nova postagem</div><div className="cxp-muted" style={{fontSize:10,marginTop:3}}>Já nasce nesta data</div></button><button type="button" className="cxp-card interactive" style={{padding:14,color:"inherit",textAlign:"left"}} onClick={onExtra}><div style={{fontSize:20,marginBottom:7}} aria-hidden="true">🎵</div><div style={{fontSize:11,fontWeight:800}}>Extra TikTok</div><div className="cxp-muted" style={{fontSize:10,marginTop:3}}>Linha rápida no calendário</div></button><button type="button" className="cxp-card interactive" style={{padding:14,color:"inherit",textAlign:"left"}} onClick={onIdea}><div style={{fontSize:20,marginBottom:7}} aria-hidden="true">💡</div><div style={{fontSize:11,fontWeight:800}}>Nova ideia aqui</div><div className="cxp-muted" style={{fontSize:10,marginTop:3}}>Status Ideia nesta data</div></button><div className="cxp-card" style={{padding:14}}><div style={{fontSize:20,marginBottom:7}} aria-hidden="true">⧉</div><label className="cxp-field"><span>Duplicar conteúdo</span><select className="cxp-input" value={sourceId} onChange={e=>setSourceId(e.target.value)}><option value="">Escolher…</option>{sources.map(row=><option key={row.id} value={row.id}>{row.tema||row.postagem}</option>)}</select></label><button type="button" className="cxp-btn" style={{width:"100%"}} disabled={!sourceId} onClick={()=>{const source=sources.find(row=>row.id===sourceId);if(source)onDuplicate(source)}}>Duplicar para este dia</button></div></div></section></>;
}

// ─── Produtividade e performance ──────────────────────────────────────────

function ProductivityView({ rows }: { rows:Row[] }) {
  const active=rows.filter(r=>r.status!=="Cancelado"),published=active.filter(r=>r.status==="Publicado"),overdue=active.filter(isOverdue);
  const onTime=published.filter(r=>r.published_at&&dateInputValue(r)&&new Date(r.published_at).toISOString().slice(0,10)<=dateInputValue(r)).length,onTimePct=published.length?Math.round(onTime/published.length*100):0;
  const withPerf=published.filter(r=>r.views>0),engagement=(r:Row)=>r.likes+r.shares+r.saves;
  const byNetwork=REDE_OPTIONS.filter(x=>x!=="Todos").map(label=>({label,val:published.filter(r=>r.rede===label).length})).filter(x=>x.val);
  const byFormat=FORMATO_OPTIONS.map(label=>({label,val:published.filter(r=>r.formato===label).length})).filter(x=>x.val);
  const weekly=Array.from({length:6},(_,i)=>({label:`Semana ${i+1}`,planned:active.filter(r=>{const iso=dateInputValue(r);return !!iso&&Math.floor((Number(iso.slice(8,10))-1)/7)===i}).length,published:published.filter(r=>{const iso=dateInputValue(r);return !!iso&&Math.floor((Number(iso.slice(8,10))-1)/7)===i}).length})).filter(x=>x.planned||x.published);
  const perfFormat=Array.from(new Set(withPerf.map(r=>r.formato))).map(label=>{const rs=withPerf.filter(r=>r.formato===label);return{label,avg:Math.round(rs.reduce((s,r)=>s+r.views,0)/rs.length),eng:Math.round(rs.reduce((s,r)=>s+engagement(r),0)/rs.length)}}).sort((a,b)=>b.avg-a.avg);
  const perfTheme=Array.from(new Set(withPerf.map(r=>r.tema.trim()).filter(Boolean))).map(label=>{const rs=withPerf.filter(r=>r.tema.trim()===label);return{label,avg:Math.round(rs.reduce((s,r)=>s+r.views,0)/rs.length),count:rs.length}}).sort((a,b)=>b.avg-a.avg).slice(0,6);
  const top=withPerf.slice().sort((a,b)=>b.views-a.views).slice(0,6),maxBar=Math.max(1,...byNetwork.map(x=>x.val),...byFormat.map(x=>x.val));
  const barList=(items:{label:string;val:number}[])=>items.length?<>{items.map(x=><div className="cxp-bar-row" key={x.label}><span>{REDE_ICONS[x.label]||""} {x.label}</span><div className="cxp-bar"><div style={{width:`${x.val/maxBar*100}%`}}/></div><span className="cxp-muted" style={{textAlign:"right"}}>{x.val}</span></div>)}</>:<div className="cxp-muted" style={{fontSize:10}}>Sem dados suficientes ainda.</div>;
  return <div><SectionTitle eyebrow="Leitura do mês">Produtividade editorial</SectionTitle><div className="cxp-kpi-grid" style={{marginBottom:12}}><KpiCard label="Planejados" value={active.length} hint="conteúdos ativos" color="#c084fc"/><KpiCard label="Publicados" value={published.length} hint="entregas concluídas" color="#4ade80"/><KpiCard label="No prazo" value={`${onTimePct}%`} hint="dos publicados" color="#67e8f9"/><KpiCard label="Atrasados" value={overdue.length} hint="fora do calendário" color="#fb7185"/><KpiCard label="Com métricas" value={withPerf.length} hint="base de aprendizado" color="#e8c77b"/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:18}}><div className="cxp-panel" style={{padding:15}}><div className="cxp-label">Distribuição</div><div className="cxp-title" style={{fontSize:12,marginBottom:10}}>Publicados por rede</div>{barList(byNetwork)}</div><div className="cxp-panel" style={{padding:15}}><div className="cxp-label">Distribuição</div><div className="cxp-title" style={{fontSize:12,marginBottom:10}}>Publicados por formato</div>{barList(byFormat)}</div><div className="cxp-panel" style={{padding:15}}><div className="cxp-label">Cadência</div><div className="cxp-title" style={{fontSize:12,marginBottom:10}}>Produção semanal</div>{weekly.length?weekly.map(x=><div key={x.label} style={{padding:"8px 0",borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between",fontSize:10}}><span>{x.label}</span><span className="cxp-muted">{x.published} publicados / {x.planned} planejados</span></div>):<div className="cxp-muted" style={{fontSize:10}}>Sem conteúdo datado.</div>}</div></div><SectionTitle eyebrow="O que está funcionando">Inteligência editorial</SectionTitle><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}><div className="cxp-panel" style={{padding:15}}><div className="cxp-title" style={{fontSize:12,marginBottom:10,color:"#86efac"}}>Formato × desempenho</div>{perfFormat.length?perfFormat.map(x=><div key={x.label} style={{padding:"8px 0",borderTop:"1px solid var(--line)"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,gap:8}}><strong>{x.label}</strong><span style={{color:"#c084fc"}}>{x.avg.toLocaleString("pt-BR")} views</span></div><div className="cxp-muted" style={{fontSize:10,marginTop:3}}>{x.eng.toLocaleString("pt-BR")} interações médias</div></div>):<div className="cxp-muted" style={{fontSize:10}}>Preencha métricas dos publicados para comparar formatos.</div>}</div><div className="cxp-panel" style={{padding:15}}><div className="cxp-title" style={{fontSize:12,marginBottom:10,color:"#86efac"}}>Top conteúdos / hooks</div>{top.length?top.map((r,i)=><div key={r.id} style={{padding:"8px 0",borderTop:i?"1px solid var(--line)":"none"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:10}}><strong>{r.tema||r.postagem}</strong><span style={{color:"#c084fc"}}>{r.views.toLocaleString("pt-BR")}</span></div><div className="cxp-muted" style={{fontSize:10,marginTop:3}}>{r.hook?`Hook: ${r.hook}`:`${r.formato} · ${r.rede}`}</div></div>):<div className="cxp-muted" style={{fontSize:10}}>Ainda não há dados orgânicos suficientes.</div>}</div><div className="cxp-panel" style={{padding:15}}><div className="cxp-title" style={{fontSize:12,marginBottom:10,color:"#86efac"}}>Tema × desempenho</div>{perfTheme.length?perfTheme.map((x,i)=><div key={`${x.label}-${i}`} style={{padding:"8px 0",borderTop:i?"1px solid var(--line)":"none",display:"flex",justifyContent:"space-between",gap:8,fontSize:10}}><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{x.label}</span><span style={{color:"#c084fc",whiteSpace:"nowrap"}}>{x.avg.toLocaleString("pt-BR")} · {x.count} post{x.count!==1?"s":""}</span></div>):<div className="cxp-muted" style={{fontSize:10}}>Repita temas e alimente views para enxergar padrões.</div>}</div></div></div>;
}

// ─── Leads / CRM ───────────────────────────────────────────────────────────
function LeadEditModal({ lead, onClose, onSave }: { lead:Lead;onClose:()=>void;onSave:(id:string,patch:Partial<Lead>)=>Promise<boolean> }) {
  const ref=useDialogFocus(true,onClose);
  const [draft,setDraft]=useState<Lead>({...lead});
  const [saving,setSaving]=useState(false),[error,setError]=useState("");
  const set=<K extends keyof Lead>(key:K,value:Lead[K])=>setDraft(previous=>({...previous,[key]:value}));
  const save=async(event:FormEvent)=>{event.preventDefault();if(draft.nome.trim().length<2){setError("Informe um nome com pelo menos 2 caracteres.");return}setSaving(true);setError("");const patch:Partial<Lead>={...draft,nome:draft.nome.trim()};delete patch.id;delete patch.created_at;const ok=await onSave(lead.id,patch);setSaving(false);if(ok)onClose();else setError("Não foi possível salvar. Confira a conexão e tente novamente.")};
  return <><div className="cxp-overlay" onClick={saving?undefined:onClose} aria-hidden="true"/><section ref={ref} className="cxp-modal cxp-lead-edit-modal" role="dialog" aria-modal="true" aria-labelledby="lead-edit-title" tabIndex={-1}><form onSubmit={save}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">CRM</div><h2 id="lead-edit-title" className="cxp-section-title" style={{margin:0}}>Editar lead</h2></div><button type="button" className="cxp-btn icon ghost" onClick={onClose} disabled={saving} aria-label="Fechar edição">×</button></div>{error&&<div className="cxp-inline-error" role="alert">{error}</div>}<div className="cxp-lead-edit-grid"><label className="cxp-field cxp-span-2"><span>Nome *</span><input autoFocus className="cxp-input" value={draft.nome} onChange={e=>set("nome",e.target.value)}/></label><label className="cxp-field"><span>WhatsApp / Discord</span><input className="cxp-input" value={draft.whatsapp_discord||""} onChange={e=>set("whatsapp_discord",e.target.value)}/></label><label className="cxp-field"><span>Status</span><select className="cxp-input" value={draft.status} onChange={e=>set("status",e.target.value)}>{LEAD_STATUS_OPTIONS.map(status=><option key={status}>{status}</option>)}</select></label><label className="cxp-field"><span>Origem</span><input className="cxp-input" value={draft.origem||""} onChange={e=>set("origem",e.target.value)}/></label><label className="cxp-field"><span>Responsável</span><input className="cxp-input" value={draft.responsavel||""} onChange={e=>set("responsavel",e.target.value)}/></label><label className="cxp-field"><span>Idade</span><input className="cxp-input" value={draft.idade||""} onChange={e=>set("idade",e.target.value)}/></label><label className="cxp-field"><span>Tempo de RPG</span><input className="cxp-input" value={draft.tempo_rpg||""} onChange={e=>set("tempo_rpg",e.target.value)}/></label><label className="cxp-field cxp-span-2"><span>Sistemas já jogados</span><input className="cxp-input" value={draft.sistemas_jogados||""} onChange={e=>set("sistemas_jogados",e.target.value)}/></label><label className="cxp-field cxp-span-2"><span>Sistemas desejados</span><input className="cxp-input" value={draft.sistemas_desejados||""} onChange={e=>set("sistemas_desejados",e.target.value)}/></label><label className="cxp-field"><span>Melhor dia</span><input className="cxp-input" value={draft.melhor_dia||""} onChange={e=>set("melhor_dia",e.target.value)}/></label><label className="cxp-field"><span>Melhor período</span><input className="cxp-input" value={draft.melhor_periodo||""} onChange={e=>set("melhor_periodo",e.target.value)}/></label><label className="cxp-field"><span>Pronto para ingressar</span><input className="cxp-input" value={draft.pronto_ingressar||""} onChange={e=>set("pronto_ingressar",e.target.value)}/></label><label className="cxp-field"><span>Código de desconto</span><input className="cxp-input" value={draft.codigo_desconto||""} onChange={e=>set("codigo_desconto",e.target.value)}/></label><label className="cxp-field cxp-span-2"><span>Próxima ação</span><input className="cxp-input" value={draft.proxima_acao||""} onChange={e=>set("proxima_acao",e.target.value)}/></label><div><div className="cxp-label">Follow-up</div><DatePicker value={draft.follow_up_date||""} onChange={iso=>set("follow_up_date",iso)} label="Data de follow-up"/></div><div><div className="cxp-label">Último contato</div><DatePicker value={draft.ultimo_contato||""} onChange={iso=>set("ultimo_contato",iso)} label="Data do último contato"/></div><label className="cxp-field cxp-span-2"><span>Anotação rápida</span><input className="cxp-input" value={draft.anotacao_rapida||""} onChange={e=>set("anotacao_rapida",e.target.value)}/></label><label className="cxp-field"><span>UTM Source</span><input className="cxp-input" value={draft.utm_source||""} onChange={e=>set("utm_source",e.target.value)}/></label><label className="cxp-field"><span>UTM Campaign</span><input className="cxp-input" value={draft.utm_campaign||""} onChange={e=>set("utm_campaign",e.target.value)}/></label><label className="cxp-field cxp-span-2"><span>Influencer / parceiro</span><input className="cxp-input" value={draft.influencer_codigo||""} onChange={e=>set("influencer_codigo",e.target.value)}/></label><label className="cxp-field cxp-span-2"><span>Notas</span><textarea className="cxp-input" value={draft.notas||""} onChange={e=>set("notas",e.target.value)} rows={4}/></label></div><div className="cxp-modal-actions-sticky"><button type="button" className="cxp-btn" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="cxp-btn primary" disabled={saving}>{saving?"Salvando…":"Salvar alterações"}</button></div></form></section></>;
}

function LeadsView({ isMobile, openNewNonce = 0, onConsumeNew }: { isMobile:boolean;openNewNonce?:number;onConsumeNew?:()=>void }) {
  const [leads,setLeads]=useState<Lead[]>([]);
  const [loading,setLoading]=useState(true),[search,setSearch]=useState(""),[filterStatus,setFilterStatus]=useState("Todos");
  const deferredSearch=useDeferredValue(search);
  const [expandedChannel,setExpandedChannel]=useState<string|null>(null),[showNew,setShowNew]=useState(false),[editingLead,setEditingLead]=useState<Lead|null>(null),[visibleCount,setVisibleCount]=useState(40);
  const [newLead,setNewLead]=useState({nome:"",whatsapp_discord:"",origem:"Manual"});
  const [error,setError]=useState(""),[creating,setCreating]=useState(false),[copyNotice,setCopyNotice]=useState(""),[savingLeadId,setSavingLeadId]=useState<string|null>(null);
  const modalRef=useDialogFocus(showNew,()=>setShowNew(false));
  const load=useCallback(async()=>{setLoading(true);setError("");try{setLeads(await dbLoadLeads())}catch(err){console.error("CRM load failed",err);setError("Não foi possível carregar os leads agora.")}finally{setLoading(false)}},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
  useEffect(()=>{if(openNewNonce<=0)return;const timer=window.setTimeout(()=>{setShowNew(true);onConsumeNew?.()},0);return()=>window.clearTimeout(timer)},[openNewNonce,onConsumeNew]);
  const copied=(message:string)=>{setCopyNotice(message);window.setTimeout(()=>setCopyNotice(""),1500)};
  const patch=async(id:string,payload:Partial<Lead>):Promise<boolean>=>{const before=leads.find(lead=>lead.id===id);setSavingLeadId(id);setError("");setLeads(previous=>previous.map(lead=>lead.id===id?{...lead,...payload}:lead));try{await dbUpdateLead(id,payload);if("status" in payload)copied("Status atualizado");return true}catch(err){console.error("CRM update failed",err);if(before)setLeads(previous=>previous.map(lead=>lead.id===id?before:lead));setError("A alteração não foi salva. O valor anterior foi restaurado.");return false}finally{setSavingLeadId(current=>current===id?null:current)}};
  const create=async()=>{const nome=newLead.nome.trim();if(creating)return;if(nome.length<2){setError("Informe um nome com pelo menos 2 caracteres.");return}setCreating(true);setError("");try{await dbCreateLead({...newLead,nome,status:"Novo lead",notas:"Origem: Manual"});setNewLead({nome:"",whatsapp_discord:"",origem:"Manual"});setShowNew(false);await load()}catch(err){console.error("CRM create failed",err);setError("Não foi possível criar o lead. Tente novamente.")}finally{setCreating(false)}};
  const query=deferredSearch.trim().toLowerCase();
  const filtered=leads.filter(lead=>{if(filterStatus!=="Todos"&&lead.status!==filterStatus)return false;return !query||[lead.nome,lead.whatsapp_discord,lead.sistemas_desejados,lead.origem,lead.utm_source,lead.utm_campaign,lead.influencer_codigo,lead.anotacao_rapida].some(value=>value?.toLowerCase().includes(query))});
  const visible=filtered.slice(0,visibleCount);
  const channelLeads=(keys:string[])=>leads.filter(lead=>{const text=sourceText(lead).toLowerCase();return keys.some(key=>text.includes(key))});
  const copyLead=async(lead:Lead)=>{const value=[lead.nome,lead.whatsapp_discord].filter(Boolean).join(" · ");if(await copyText(value))copied("Nome e contato copiados");else setError("Não foi possível copiar nome e contato.")};
  const changeStatusFilter=(value:string)=>{setFilterStatus(value);setVisibleCount(40)};
  const changeSearch=(value:string)=>{setSearch(value);setVisibleCount(40)};
  return <div><SectionTitle eyebrow="Pipeline de comunidade" right={<button type="button" className="cxp-btn primary" onClick={()=>setShowNew(true)}>＋ Novo lead</button>}>Leads & clientes</SectionTitle>{copyNotice&&<div className="cxp-inline-success" role="status">✓ {copyNotice}</div>}{error&&<div style={{marginBottom:10}}><StatePanel tone="error" title="CRM precisa de atenção" description={error} actionLabel="Recarregar" onAction={()=>void load()}/></div>}<div className="cxp-crm-grid" style={{marginBottom:10}}>{LEAD_STATUS_OPTIONS.map(status=>{const color=LEAD_STATUS_COLORS[status],count=leads.filter(lead=>lead.status===status).length;return <button type="button" key={status} onClick={()=>changeStatusFilter(filterStatus===status?"Todos":status)} aria-pressed={filterStatus===status} className="cxp-card interactive cxp-status-card" style={{padding:10,color:color.text,borderColor:filterStatus===status?color.border:undefined,textAlign:"left",background:color.bg}}><div style={{font:"800 22px 'Cinzel',serif"}}>{count}</div><div style={{fontSize:10,fontWeight:800,marginTop:3}}>{status}</div></button>})}</div><div className="cxp-origin-grid" style={{marginBottom:10}}>{LEAD_CHANNELS.map(channel=>{const items=channelLeads(channel.chaves),isOpen=expandedChannel===channel.label;return <button type="button" key={channel.label} onClick={()=>setExpandedChannel(isOpen?null:channel.label)} aria-expanded={isOpen} className="cxp-card interactive cxp-origin" style={{color:"inherit",borderColor:isOpen?"#7c3aed":undefined}}><img src={channel.icon} alt=""/><strong>{items.length}</strong><div className="cxp-origin-name">{channel.label}</div></button>})}</div>{expandedChannel&&(()=>{const channel=LEAD_CHANNELS.find(item=>item.label===expandedChannel)!,items=channelLeads(channel.chaves);return <div className="cxp-panel cxp-channel-breakdown" style={{padding:12,marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}><img src={channel.icon} alt="" style={{width:24,height:24,objectFit:"contain"}}/><div className="cxp-title" style={{fontSize:11}}>{channel.label} · {items.length} lead{items.length!==1?"s":""}</div></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{LEAD_STATUS_OPTIONS.map(status=><span key={status} className="cxp-chip">{status}: {items.filter(lead=>lead.status===status).length}</span>)}</div></div>})()}<div className="cxp-toolbar"><label className="grow"><span className="sr-only">Buscar leads</span><input className="cxp-input" value={search} onChange={e=>changeSearch(e.target.value)} placeholder="Buscar nome, contato, origem, campanha…"/></label><label><span className="sr-only">Filtrar leads por status</span><select className="cxp-input" style={{width:isMobile?"100%":190}} value={filterStatus} onChange={e=>changeStatusFilter(e.target.value)}><option>Todos</option>{LEAD_STATUS_OPTIONS.map(status=><option key={status}>{status}</option>)}</select></label><button type="button" className="cxp-btn icon" onClick={()=>void load()} aria-label="Atualizar leads">↻</button></div>{!loading&&<div className="cxp-result-count">{filtered.length} lead{filtered.length!==1?"s":""}{query?" encontrado(s)":""}</div>}{loading?<LoadingState label="Carregando leads…"/>:visible.length?<div className="cxp-lead-list">{visible.map(lead=>{const color=LEAD_STATUS_COLORS[lead.status]||LEAD_STATUS_COLORS["Novo lead"],wa=whatsappUrl(lead.whatsapp_discord||"");return <article key={lead.id} className="cxp-panel cxp-lead-card" style={{boxShadow:`inset 4px 0 ${color.border}`}}><div className="cxp-lead-head-simple"><div className="cxp-lead-identity"><span className="cxp-lead-avatar" style={{background:color.bg,color:color.text,borderColor:color.border}}>{(lead.nome||"?").slice(0,1).toUpperCase()}</span><div><strong className="cxp-lead-name">{lead.nome||"—"}</strong><span className="cxp-lead-meta">{lead.whatsapp_discord||"sem contato"}</span><span className="cxp-lead-meta">{lead.origem||lead.utm_source||"origem não informada"}{lead.responsavel?` · ${lead.responsavel}`:""}</span></div></div><label className="cxp-lead-status-quick"><span>Status {savingLeadId===lead.id?"· salvando…":""}</span><select value={lead.status} disabled={savingLeadId===lead.id} onChange={e=>void patch(lead.id,{status:e.target.value})} style={{...inputStyle,background:color.bg,color:color.text,borderColor:`${color.border}88`}}>{LEAD_STATUS_OPTIONS.map(status=><option key={status}>{status}</option>)}</select></label></div><div className="cxp-lead-summary">{lead.proxima_acao&&<span><b>Próxima:</b> {lead.proxima_acao}</span>}{lead.follow_up_date&&<span><b>Follow-up:</b> {prettyDate(lead.follow_up_date)}</span>}{lead.sistemas_desejados&&<span><b>Sistemas:</b> {lead.sistemas_desejados}</span>}</div><div className="cxp-lead-actions-simple"><button type="button" className="cxp-btn primary" onClick={()=>setEditingLead(lead)}>Editar lead</button><button type="button" className="cxp-btn" onClick={()=>void copyLead(lead)}>☷ Copiar contato</button>{wa&&<a className="cxp-btn green" href={wa} target="_blank" rel="noreferrer">💬 WhatsApp</a>}</div></article>})}{visibleCount<filtered.length&&<button type="button" className="cxp-btn cxp-load-more" onClick={()=>setVisibleCount(count=>count+40)}>Carregar mais · {filtered.length-visibleCount} restantes</button>}</div>:<StatePanel title="Nenhum lead neste filtro" description={leads.length?"Ajuste a busca ou o status para ver outros contatos.":"Novos inscritos e leads manuais aparecerão aqui."} actionLabel={leads.length?"Limpar filtro":"Criar lead"} onAction={()=>leads.length?changeStatusFilter("Todos"):setShowNew(true)}/>} {editingLead&&<LeadEditModal lead={editingLead} onClose={()=>setEditingLead(null)} onSave={patch}/>} {showNew&&<><div className="cxp-overlay" onClick={()=>setShowNew(false)} aria-hidden="true"/><section ref={modalRef} className="cxp-modal" role="dialog" aria-modal="true" aria-labelledby="new-lead-title" tabIndex={-1}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Entrada manual</div><h2 id="new-lead-title" className="cxp-section-title" style={{margin:0}}>Novo lead</h2></div><button type="button" className="cxp-btn icon ghost" onClick={()=>setShowNew(false)} aria-label="Fechar novo lead">×</button></div><div style={{display:"grid",gap:4}}><label className="cxp-field"><span>Nome *</span><input autoFocus className="cxp-input" value={newLead.nome} maxLength={100} onChange={e=>setNewLead(previous=>({...previous,nome:e.target.value}))}/></label><label className="cxp-field"><span>WhatsApp / Discord</span><input className="cxp-input" value={newLead.whatsapp_discord} maxLength={80} onChange={e=>setNewLead(previous=>({...previous,whatsapp_discord:e.target.value}))}/></label><label className="cxp-field"><span>Origem</span><input className="cxp-input" value={newLead.origem} maxLength={100} onChange={e=>setNewLead(previous=>({...previous,origem:e.target.value}))}/></label></div><div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:14}}><button type="button" className="cxp-btn" onClick={()=>setShowNew(false)}>Cancelar</button><button type="button" className="cxp-btn primary" disabled={creating} onClick={()=>void create()}>{creating?"Criando…":"Criar lead"}</button></div></section></>}</div>;
}

function InfluencersView({ isMobile }: { isMobile:boolean }) {
  const [influencers,setInfluencers]=useState<Influencer[]>([]),[leads,setLeads]=useState<Lead[]>([]),[loading,setLoading]=useState(true),[nome,setNome]=useState(""),[codigo,setCodigo]=useState(""),[saving,setSaving]=useState(false),[error,setError]=useState(""),[copied,setCopied]=useState<string|null>(null),[deleteTarget,setDeleteTarget]=useState<Influencer|null>(null),[deleting,setDeleting]=useState(false);
  const load=useCallback(async()=>{setLoading(true);setError("");try{const[items,leadItems]=await Promise.all([dbLoadInfluencers(),dbLoadLeadAttribution()]);setInfluencers(items);setLeads(leadItems)}catch(err){console.error("Influencer load failed",err);setError("Não foi possível carregar parceiros e conversões agora.")}finally{setLoading(false)}},[]);useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
  const leadsFor=(code:string)=>leads.filter(lead=>{const text=sourceText(lead).toLowerCase();return lead.influencer_codigo?.toLowerCase()===code.toLowerCase()||text.includes(code.toLowerCase())});
  const create=async()=>{const name=nome.trim(),code=slugifyCodigo(codigo||nome);if(saving)return;if(name.length<2||!code){setError("Informe nome e um código válido.");return}if(influencers.some(item=>item.codigo===code)){setError("Já existe um parceiro com esse código.");return}setSaving(true);setError("");try{await dbCreateInfluencer(name,code);setNome("");setCodigo("");await load()}catch(err){console.error("Influencer create failed",err);setError("Não foi possível criar o link agora.")}finally{setSaving(false)}};
  const ranking=[...influencers].sort((a,b)=>leadsFor(b.codigo).length-leadsFor(a.codigo).length||b.clicks-a.clicks);
  const toggleActive=async(item:Influencer)=>{const next=!item.ativo;setInfluencers(previous=>previous.map(value=>value.id===item.id?{...value,ativo:next}:value));try{await dbUpdateInfluencer(item.id,{ativo:next})}catch(err){console.error("Influencer update failed",err);setInfluencers(previous=>previous.map(value=>value.id===item.id?item:value));setError("A mudança de status não foi salva.")}};
  const confirmDelete=async()=>{if(!deleteTarget||deleting)return;const item=deleteTarget;setDeleting(true);setError("");try{await dbDeleteInfluencer(item.id);setDeleteTarget(null);await load()}catch(err){console.error("Influencer delete failed",err);setError("Não foi possível excluir o parceiro.")}finally{setDeleting(false)}};
  return <><div><SectionTitle eyebrow="Rede de aquisição">Influencers & links</SectionTitle>{error&&<div style={{marginBottom:10}}><StatePanel tone="error" title="Parceiros precisam de atenção" description={error} actionLabel="Recarregar" onAction={()=>void load()}/></div>}<div className="cxp-panel" style={{padding:15,marginBottom:12}}><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 210px auto",gap:9,alignItems:"end"}}><label className="cxp-field"><span>Nome do parceiro</span><input className="cxp-input" value={nome} maxLength={100} onChange={e=>{const value=e.target.value;setNome(value);if(!codigo)setCodigo(slugifyCodigo(value))}} placeholder="Ex.: Zonad20"/></label><label className="cxp-field"><span>Código do link</span><input className="cxp-input" value={codigo} maxLength={64} onChange={e=>setCodigo(slugifyCodigo(e.target.value))} placeholder="zonad20"/></label><button type="button" className="cxp-btn primary large" disabled={saving} onClick={()=>void create()}>{saving?"Criando…":"Criar link"}</button></div></div>{loading?<LoadingState label="Carregando parceiros…"/>:ranking.length?<div style={{display:"grid",gap:9}}>{ranking.map((item,idx)=>{const partnerLeads=leadsFor(item.codigo),qualified=partnerLeads.filter(lead=>["Em contato","Lista de espera","Mesa alocada"].includes(lead.status)),final=partnerLeads.filter(lead=>lead.status==="Mesa alocada"),finalRate=item.clicks?final.length/item.clicks*100:0,link=`${window.location.origin}/?ref=${encodeURIComponent(item.codigo)}`;return <article key={item.id} className="cxp-panel" style={{padding:14,boxShadow:`inset 3px 0 ${item.ativo?"#8b5cf6":"#4b5563"}`,opacity:item.ativo?1:.68}}><div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{width:38,height:38,borderRadius:12,display:"grid",placeItems:"center",background:idx===0&&partnerLeads.length?"rgba(232,199,123,.12)":"rgba(139,92,246,.09)",font:"800 13px 'Cinzel',serif",color:idx===0&&partnerLeads.length?"#e8c77b":"#c4b5fd"}} aria-hidden="true">{idx===0&&partnerLeads.length?"♛":`#${idx+1}`}</div><div style={{flex:1,minWidth:140}}><div style={{fontSize:12,fontWeight:800,overflowWrap:"anywhere"}}>{item.nome}</div><div className="cxp-muted" style={{fontSize:10,marginTop:3}}>@{item.codigo}</div></div><button type="button" className={`cxp-btn ${item.ativo?"green":""}`} onClick={()=>void toggleActive(item)} aria-pressed={item.ativo}>{item.ativo?"Ativo":"Pausado"}</button><button type="button" className="cxp-btn icon danger" onClick={()=>setDeleteTarget(item)} aria-label={`Excluir ${item.nome}`}>×</button></div><div style={{display:"flex",gap:6,marginTop:10}}><input className="cxp-input" readOnly value={link} aria-label={`Link de ${item.nome}`}/><button type="button" className="cxp-btn" onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(item.codigo);setTimeout(()=>setCopied(null),1200)}catch{setError("Não foi possível copiar automaticamente. Selecione o link e copie manualmente.")}}}>{copied===item.codigo?"Copiado ✓":"Copiar"}</button></div><div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:7,marginTop:10}}>{[["Cliques",item.clicks,"#93c5fd"],["Leads",partnerLeads.length,"#c084fc"],["Qualificados",qualified.length,"#fcd34d"],["Mesas",final.length,"#86efac"],["Conv. final",`${finalRate.toFixed(1)}%`,"#67e8f9"]].map(([label,value,color])=><div key={String(label)} className="cxp-metric"><div style={{font:"800 18px 'Cinzel',serif",color:String(color)}}>{value}</div><div className="cxp-label" style={{margin:"4px 0 0"}}>{label}</div></div>)}</div></article>})}</div>:<StatePanel title="Nenhum parceiro cadastrado" description="Cadastre um parceiro para gerar um link rastreável e acompanhar o funil de cliques até mesas alocadas."/>}</div><ConfirmDialog open={!!deleteTarget} title="Excluir parceiro?" description={deleteTarget?`O link de ${deleteTarget.nome} deixará de aparecer na central. Os leads já gerados não serão apagados.`:""} confirmLabel="Excluir parceiro" onClose={()=>{if(!deleting)setDeleteTarget(null)}} onConfirm={()=>void confirmDelete()} busy={deleting}/></>;
}

// ─── Command palette

// ─── Command palette ───────────────────────────────────────────────────────
function CommandButton({ icon, label, onClick, meta }: { icon:string;label:string;onClick:()=>void;meta?:string }) {
  return <button type="button" className="cxp-command-row" onClick={onClick}><span style={{width:30,height:30,borderRadius:8,background:"rgba(124,58,237,.1)",display:"grid",placeItems:"center",flex:"0 0 auto"}} aria-hidden="true">{icon}</span><span style={{minWidth:0}}><span style={{fontSize:11,fontWeight:800,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>{meta&&<span className="cxp-muted" style={{fontSize:10,display:"block",marginTop:2}}>{meta}</span>}</span></button>;
}

interface CommandPaletteProps { open:boolean;onClose:()=>void;onNewPost:()=>void;onExtraTikTok:()=>void;onToday:()=>void;onLeads:()=>void;onInfluencers:()=>void;onOpenPost:(r:Row)=>void }

function CommandPaletteContent({ onClose, onNewPost, onExtraTikTok, onToday, onLeads, onInfluencers, onOpenPost }: Omit<CommandPaletteProps,"open">) {
  const ref=useDialogFocus(true,onClose);
  const [q,setQ]=useState(""),[rows,setRows]=useState<Row[]>([]),[leads,setLeads]=useState<Lead[]>([]),[infs,setInfs]=useState<Influencer[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{let cancelled=false;const timer=window.setTimeout(()=>{Promise.all([dbLoadAllRows(),dbLoadLeadAttribution(),dbLoadInfluencers()]).then(([r,l,i])=>{if(!cancelled){setRows(r);setLeads(l);setInfs(i)}}).catch(()=>{if(!cancelled)setError("A busca não conseguiu carregar todos os dados. Tente novamente.")}).finally(()=>{if(!cancelled)setLoading(false)})},0);return()=>{cancelled=true;window.clearTimeout(timer)}},[]);
  const query=q.trim().toLowerCase(),postResults=query?rows.filter(row=>[row.postagem,row.tema,row.hook,row.rede,row.formato,row.responsavel].some(value=>value?.toLowerCase().includes(query))).slice(0,7):[],leadResults=query?leads.filter(lead=>[lead.nome,lead.whatsapp_discord,lead.origem,lead.utm_source,lead.utm_campaign,lead.anotacao_rapida].some(value=>value?.toLowerCase().includes(query))).slice(0,5):[],infResults=query?infs.filter(item=>[item.nome,item.codigo].some(value=>value?.toLowerCase().includes(query))).slice(0,5):[];
  const run=(fn:()=>void)=>{fn();onClose()};
  return <><div className="cxp-overlay" style={{zIndex:1399}} onClick={onClose} aria-hidden="true"/><section ref={ref} className="cxp-command" role="dialog" aria-modal="true" aria-labelledby="command-title" tabIndex={-1}><div style={{padding:"12px 14px 8px",display:"flex",alignItems:"center",gap:9,borderBottom:"1px solid var(--line)"}}><span style={{fontSize:16,color:"#c084fc"}} aria-hidden="true">⌕</span><label className="sr-only" htmlFor="cxp-command-input" id="command-title">Buscar em toda a central</label><input autoFocus id="cxp-command-input" className="cxp-command-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar conteúdo, lead, influencer ou comando…"/><button type="button" className="cxp-btn icon ghost" onClick={onClose} aria-label="Fechar busca">×</button></div>{loading&&<LoadingState label="Carregando busca…"/>}{error&&!loading&&<div style={{padding:14}}><StatePanel tone="error" title="Busca indisponível" description={error}/></div>}{!query&&!loading&&!error&&<div style={{padding:"5px 0 8px"}}><CommandButton icon="✦" label="Nova postagem" onClick={()=>run(onNewPost)}/><CommandButton icon="🎵" label="Vídeo extra TikTok" onClick={()=>run(onExtraTikTok)}/><CommandButton icon="⌂" label="Ir para Central de Hoje" onClick={()=>run(onToday)}/><CommandButton icon="♙" label="Novo lead / abrir CRM" onClick={()=>run(onLeads)}/><CommandButton icon="↗" label="Novo influencer" onClick={()=>run(onInfluencers)}/></div>}{query&&!loading&&!error&&<>{postResults.map(row=><CommandButton key={row.id} icon={REDE_ICONS[row.rede]||"◆"} label={row.tema||row.postagem} meta={`Conteúdo · ${row.data||"sem data"} · ${row.formato||"sem formato"}`} onClick={()=>run(()=>onOpenPost(row))}/>)}{leadResults.map(lead=><CommandButton key={lead.id} icon="♙" label={lead.nome||"Lead sem nome"} meta={`Lead · ${lead.whatsapp_discord||"sem contato"}`} onClick={()=>run(onLeads)}/>)}{infResults.map(item=><CommandButton key={item.id} icon="↗" label={item.nome} meta={`Influencer · ${item.codigo}`} onClick={()=>run(onInfluencers)}/>)}{!postResults.length&&!leadResults.length&&!infResults.length&&<StatePanel title="Nada encontrado" description="Tente outra palavra, rede, tema, nome ou contato."/>}</>}</section></>;
}

function CommandPalette({ open, ...props }: CommandPaletteProps) {
  return open?<CommandPaletteContent {...props}/>:null;
}

function Dashboard({ onVoltar }: { onVoltar:()=>void }) {
  const isMobile=useIsMobile();
  const [rows,setRows]=useState<Row[]>([]),rowsRef=useRef<Row[]>([]);
  const [centralRows,setCentralRows]=useState<Row[]>([]),[centralLeads,setCentralLeads]=useState<Lead[]>([]),[centralLoading,setCentralLoading]=useState(true),[centralError,setCentralError]=useState("");
  const [mes,setMes]=useState(new Date().getMonth()),[appTab,setAppTab]=useState<AppTab>(()=>{const tab=new URLSearchParams(window.location.search).get("tab") as AppTab|null;return tab&&["hoje","conteudo","produtividade","leads","influencers"].includes(tab)?tab:"hoje"}),[viewMode,setViewMode]=useState<ViewMode>("calendario"),[calendarScope,setCalendarScope]=useState<CalendarScope>(()=>window.innerWidth<920?"agenda":"mes"),[weekIndex,setWeekIndex]=useState(0);
  const [filterStatus,setFilterStatus]=useState("Todos"),[filterRede,setFilterRede]=useState("Todos"),[search,setSearch]=useState("");
  const deferredSearch=useDeferredValue(search);
  const [loading,setLoading]=useState(true),[syncStatus,setSyncStatus]=useState<"ok"|"saving"|"error">("ok"),[syncError,setSyncError]=useState("");
  const [selectedPostId,setSelectedPostId]=useState<string|null>(null),[selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
  const [showTemplates,setShowTemplates]=useState(false),[showRecurrence,setShowRecurrence]=useState(false),[contentToolsOpen,setContentToolsOpen]=useState(false),[adaptRow,setAdaptRow]=useState<Row|null>(null),[commandOpen,setCommandOpen]=useState(false),[leadNewNonce,setLeadNewNonce]=useState(0),[filterOpen,setFilterOpen]=useState(false),[dayMenuDate,setDayMenuDate]=useState<string|null>(null),[quickCreateDate,setQuickCreateDate]=useState<string|null>(null);
  const [undo,setUndo]=useState<{rows:Row[];indexes:number[]}|null>(null),[notice,setNotice]=useState<{type:"success"|"error"|"info";message:string}|null>(null),[isOnline,setIsOnline]=useState(()=>navigator.onLine),[helpOpen,setHelpOpen]=useState(false),[tourRestartToken,setTourRestartToken]=useState(0);
  const undoTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pendingTimers=useRef<Map<string,ReturnType<typeof setTimeout>>>(new Map()),pendingPatches=useRef<Map<string,Partial<Row>>>(new Map()),savingIds=useRef<Set<string>>(new Set()),saveQueues=useRef<Map<string,Promise<void>>>(new Map());
  const filterDialogRef=useDialogFocus(filterOpen,()=>setFilterOpen(false));
  const contentToolsDialogRef=useDialogFocus(contentToolsOpen,()=>setContentToolsOpen(false));
  const goTab=useCallback((tab:AppTab,replace=false)=>{
    setAppTab(tab);
    const url=new URL(window.location.href);url.pathname="/central";url.searchParams.set("tab",tab);
    window.history[replace?"replaceState":"pushState"]({},"",`${url.pathname}${url.search}`);
  },[]);

  const announce=useCallback((message:string,type:"success"|"error"|"info"="info")=>{
    if(noticeTimer.current)clearTimeout(noticeTimer.current);
    setNotice({type,message});
    noticeTimer.current=setTimeout(()=>setNotice(null),type==="error"?6500:3500);
  },[]);
  const setRowsSafe=useCallback((fn:(prev:Row[])=>Row[])=>setRows(prev=>{const next=fn(prev);rowsRef.current=next;return next}),[]);
  const loadRows=useCallback(async(m:number,silent=false)=>{
    if(!silent)setLoading(true);
    try{
      const data=await dbLoad(m);
      setRows(prev=>{
        const next=data.map(sr=>{const local=prev.find(r=>r.id===sr.id);return (pendingTimers.current.has(sr.id)||savingIds.current.has(sr.id)||saveQueues.current.has(sr.id)||local?.details_loaded)?(local||sr):sr});
        rowsRef.current=next;
        return next;
      });
      if(!pendingTimers.current.size&&!saveQueues.current.size){setSyncStatus("ok");setSyncError("")}
    }catch(e){
      console.error("Calendar load failed",e);
      setSyncError("Falha ao sincronizar dados");setSyncStatus("error");
      if(!silent)announce("Não foi possível carregar o calendário. Tente novamente.","error");
    }finally{if(!silent)setLoading(false)}
  },[announce]);
  const loadCentral=useCallback(async()=>{
    setCentralLoading(true);setCentralError("");
    try{const[r,l]=await Promise.all([dbLoadCentralRows(),dbLoadLeadSummary()]);setCentralRows(r);setCentralLeads(l)}
    catch(e){console.error("Central summary load failed",e);setCentralError("Não foi possível carregar o resumo agora. Verifique sua conexão e tente novamente.")}
    finally{setCentralLoading(false)}
  },[]);

  useEffect(()=>{
    const syncFromHistory=()=>{const tab=new URLSearchParams(window.location.search).get("tab") as AppTab|null;if(tab&&["hoje","conteudo","produtividade","leads","influencers"].includes(tab))setAppTab(tab)};
    window.addEventListener("popstate",syncFromHistory);return()=>window.removeEventListener("popstate",syncFromHistory);
  },[]);
  useEffect(()=>{if(appTab!=="conteudo"&&appTab!=="produtividade")return;const timer=window.setTimeout(()=>{void loadRows(mes);setSelectedIds(new Set())},0);return()=>window.clearTimeout(timer)},[appTab,mes,loadRows,isMobile]);
  useEffect(()=>{const timer=window.setTimeout(()=>{const now=new Date(),year=now.getFullYear(),firstDay=new Date(year,mes,1).getDay();setWeekIndex(now.getMonth()===mes?Math.floor((firstDay+now.getDate()-1)/7):0)},0);return()=>window.clearTimeout(timer)},[mes,calendarScope]);
  useEffect(()=>{if(appTab!=="hoje")return;const timer=window.setTimeout(()=>void loadCentral(),0);return()=>window.clearTimeout(timer)},[appTab,loadCentral]);
  useEffect(()=>{
    if(appTab!=="conteudo"&&appTab!=="produtividade")return;
    const t=setInterval(()=>{
      const tag=document.activeElement?.tagName;
      if(document.visibilityState!=="visible"||!navigator.onLine||["INPUT","TEXTAREA","SELECT"].includes(tag||"")||pendingTimers.current.size||saveQueues.current.size)return;
      void loadRows(mes,true);
    },isMobile?120000:60000);
    return()=>clearInterval(t)
  },[appTab,mes,loadRows,isMobile]);
  useEffect(()=>{
    const online=()=>{setIsOnline(true);announce("Conexão restabelecida.","success");if(appTab==="hoje")void loadCentral();else if(appTab==="conteudo"||appTab==="produtividade")void loadRows(mes,true)};
    const offline=()=>{setIsOnline(false);announce("Você está offline. Alterações ainda não salvas podem ficar pendentes.","error")};
    window.addEventListener("online",online);window.addEventListener("offline",offline);
    return()=>{window.removeEventListener("online",online);window.removeEventListener("offline",offline)}
  },[announce,appTab,loadCentral,loadRows,mes]);
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setCommandOpen(true)}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[]);
  useEffect(()=>()=>{
    pendingTimers.current.forEach(clearTimeout);pendingTimers.current.clear();
    if(undoTimer.current)clearTimeout(undoTimer.current);
    if(noticeTimer.current)clearTimeout(noticeTimer.current);
  },[]);

  const persistNow=useCallback(async(id:string,patch:Partial<Row>)=>{
    savingIds.current.add(id);setSyncStatus("saving");setSyncError("");
    try{await dbPatch(id,patch)}
    finally{savingIds.current.delete(id)}
  },[]);
  const enqueuePersist=useCallback((id:string,patch:Partial<Row>)=>{
    const previous=saveQueues.current.get(id)||Promise.resolve();
    const task=previous.catch(()=>undefined).then(()=>persistNow(id,patch)).then(()=>{setSyncError("");setSyncStatus("ok")}).catch(async(e)=>{
      console.error("Post save failed",{id,fields:Object.keys(patch)},e);
      setSyncStatus("error");setSyncError("A última alteração não foi salva");
      announce("A alteração não foi salva. O dado foi restaurado a partir do servidor.","error");
      await loadRows(mes,true);
      throw e;
    });
    const tracked=task.finally(()=>{if(saveQueues.current.get(id)===tracked)saveQueues.current.delete(id)});
    saveQueues.current.set(id,tracked);
    return tracked;
  },[announce,loadRows,mes,persistNow]);
  const schedule=useCallback((id:string,patch:Partial<Row>,immediate=false)=>{
    pendingPatches.current.set(id,{...(pendingPatches.current.get(id)||{}),...patch});
    const old=pendingTimers.current.get(id);if(old)clearTimeout(old);
    const flush=()=>{
      const queued=pendingPatches.current.get(id);
      pendingPatches.current.delete(id);pendingTimers.current.delete(id);
      if(queued)void enqueuePersist(id,queued).catch(()=>undefined);
    };
    setSyncStatus("saving");
    if(immediate)flush();else pendingTimers.current.set(id,setTimeout(flush,500));
  },[enqueuePersist]);
  const updateRow=(id:string,key:keyof Row,val:unknown)=>{
    const current=rowsRef.current.find(r=>r.id===id);if(!current)return;
    let safeVal=val;
    if(["views","likes","shares","saves","followers_gained"].includes(String(key)))safeVal=Math.max(0,Math.round(Number(val)||0));
    const patch:Partial<Row>={[key]:safeVal} as Partial<Row>;
    const historyKeys=(['status','data','rede','formato','responsavel'] as (keyof Row)[]);
    if(key==="data"){
      const iso=brToISO(String(safeVal));patch.data_iso=iso;patch.mes=iso?Number(iso.slice(5,7))-1:current.mes;
    }
    if(key==="formato"&&String(safeVal)!==current.formato)patch.checklist=makeChecklist(String(safeVal));
    if(key==="status"&&safeVal==="Publicado"&&current.status!=="Publicado")patch.published_at=new Date().toISOString();
    if(historyKeys.includes(key)&&String(current[key]??"")!==String(safeVal??""))patch.historico=appendHistory(current.historico,makeHistory(String(key),current[key],safeVal));
    setRowsSafe(prev=>prev.map(r=>r.id===id?{...r,...patch}:r));
    const nextISO = key === "data" ? patch.data_iso : null;
    const movesOutsideVisibleMonth = !!nextISO && (() => {
      const nextDate = parseDateBR(nextISO);
      return !!nextDate && (nextDate.getFullYear() !== new Date().getFullYear() || nextDate.getMonth() !== mes);
    })();
    if (movesOutsideVisibleMonth) {
      void enqueuePersist(id,patch).then(()=>{
        setRowsSafe(prev=>prev.filter(row=>row.id!==id));
        setSelectedIds(prev=>{const next=new Set(prev);next.delete(id);return next});
        setSelectedPostId(currentId=>currentId===id?null:currentId);
        const destination=parseDateBR(nextISO!);
        announce(`Conteúdo movido para ${destination?MONTHS[destination.getMonth()]:"outro período"}.`,"success");
      }).catch(()=>undefined);
      return;
    }
    schedule(id,patch,['status','rede','formato','data','checklist','published_at'].includes(String(key)));
  };
  const patchMany=async(ids:string[],patcher:(r:Row)=>Partial<Row>)=>{
    const tasks:Promise<void>[]=[],movedOutside:string[]=[];
    for(const id of ids){
      const r=rowsRef.current.find(x=>x.id===id);if(!r)continue;
      const patch=patcher(r);
      const nextDate=patch.data_iso?parseDateBR(patch.data_iso):null;
      if(nextDate&&(nextDate.getFullYear()!==new Date().getFullYear()||nextDate.getMonth()!==mes))movedOutside.push(id);
      setRowsSafe(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));tasks.push(enqueuePersist(id,patch));
    }
    const result=await Promise.allSettled(tasks);
    if(result.some(r=>r.status==="rejected"))return;
    if(movedOutside.length)setRowsSafe(prev=>prev.filter(row=>!movedOutside.includes(row.id)));
    announce(`${ids.length} ${ids.length===1?"item atualizado":"itens atualizados"}.`,"success");
  };
  const addAndOpen=async(partial:Partial<Row>={},dateISO="",openDetails=true)=>{
    const row=makeRow(rowsRef.current.length+1,mes,dateISO,partial);setRowsSafe(p=>[...p,row]);setSyncStatus("saving");
    try{await dbUpsert(row);setSyncStatus("ok");announce("Conteúdo criado.","success");if(openDetails)setSelectedPostId(row.id);return row}
    catch(e){console.error("Post create failed",e);setRowsSafe(p=>p.filter(x=>x.id!==row.id));setSyncStatus("error");setSyncError("Conteúdo não salvo");announce("Não foi possível criar o conteúdo.","error");return null}
  };
  const createTemplate=async(t:TemplateDef)=>{setShowTemplates(false);await addAndOpen({postagem:t.label,tema:t.tema,rede:t.rede,formato:t.formato,checklist:makeChecklist(t.formato)})};
  const createExtraTikTok=async(date=todayISO())=>addAndOpen({postagem:EXTRA_TIKTOK_FORMAT,tema:EXTRA_TIKTOK_FORMAT,rede:"TikTok",formato:EXTRA_TIKTOK_FORMAT,checklist:makeChecklist(EXTRA_TIKTOK_FORMAT)},date);
  const generateRecurrence=async(days:number[],t:TemplateDef,start:string,end:string)=>{
    const startDate=parseDateBR(start),endDate=parseDateBR(end);if(!startDate||!endDate||startDate>endDate){announce("Revise o período da recorrência.","error");return}
    const span=Math.round((endDate.getTime()-startDate.getTime())/86400000);if(span>366){announce("Por segurança, gere recorrências de até 12 meses por vez.","error");return}
    const created:Row[]=[];
    for(const dt=new Date(startDate);dt<=endDate;dt.setDate(dt.getDate()+1))if(days.includes(dt.getDay())){const iso=`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;created.push(makeRow(rowsRef.current.length+created.length+1,dt.getMonth(),iso,{postagem:t.label,tema:t.tema,rede:t.rede,formato:t.formato,checklist:makeChecklist(t.formato)}))}
    if(!created.length){announce("Nenhuma data corresponde aos dias escolhidos.","info");return}
    setRowsSafe(p=>[...p,...created.filter(r=>r.mes===mes)]);setShowRecurrence(false);setSyncStatus("saving");
    try{await dbUpsertMany(created);setSyncStatus("ok");announce(`${created.length} conteúdos recorrentes criados.`,"success")}
    catch(e){console.error("Recurrence save failed",e);setRowsSafe(p=>p.filter(r=>!created.some(c=>c.id===r.id)));setSyncStatus("error");setSyncError("Recorrência não salva");announce("A recorrência não foi salva.","error")}
  };
  const adapt=async(source:Row,network:string,format:string)=>{
    const base=await loadFullSource(source);if(!base)return;
    const row=makeRow(rowsRef.current.length+1,mes,"",{...base,postagem:`${source.postagem} · ${network}`,rede:network,formato:format,status:"Ideia",checklist:makeChecklist(format),historico:[makeHistory("adaptação",base.rede,network)],published_at:null,views:0,likes:0,shares:0,saves:0,followers_gained:0});
    setRowsSafe(p=>{const i=p.findIndex(r=>r.id===source.id),next=[...p];next.splice(i+1,0,row);return next});setAdaptRow(null);
    try{await dbUpsert(row);setSelectedPostId(row.id);announce("Adaptação criada.","success")}catch{setRowsSafe(p=>p.filter(x=>x.id!==row.id));announce("Não foi possível criar a adaptação.","error")}
  };
  const duplicateToDate=async(source:Row,iso:string)=>{
    const base=await loadFullSource(source);if(!base)return;
    const row=makeRow(rowsRef.current.length+1,Number(iso.slice(5,7))-1,iso,{...base,postagem:`${source.postagem} (cópia)`,status:"Ideia",published_at:null,views:0,likes:0,shares:0,saves:0,followers_gained:0,historico:[makeHistory("duplicação",base.data,isoToBR(iso))]});
    if(row.mes===mes)setRowsSafe(p=>[...p,row]);
    try{await dbUpsert(row);setDayMenuDate(null);if(row.mes!==mes)setMes(row.mes);setSelectedPostId(row.id);announce("Conteúdo duplicado.","success")}
    catch{setRowsSafe(p=>p.filter(x=>x.id!==row.id));announce("Não foi possível duplicar o conteúdo.","error")}
  };
  const movePost=(id:string,iso:string)=>updateRow(id,"data",isoToBR(iso));
  const toggleChecklist=(id:string,itemId:string)=>{
    const r=rowsRef.current.find(x=>x.id===id);if(!r)return;
    const next=r.checklist.map(i=>i.id===itemId?{...i,done:!i.done}:i),patch:Partial<Row>={checklist:next,historico:appendHistory(r.historico,makeHistory("checklist",`${r.checklist.filter(i=>i.done).length}/${r.checklist.length}`,`${next.filter(i=>i.done).length}/${next.length}`))};
    setRowsSafe(p=>p.map(x=>x.id===id?{...x,...patch}:x));schedule(id,patch,true)
  };
  const finalizeUndo=async()=>{
    if(!undo)return;const snapshot=undo;setUndo(null);if(undoTimer.current){clearTimeout(undoTimer.current);undoTimer.current=null}
    const results=await Promise.allSettled(snapshot.rows.map(r=>dbDelete(r.id)));
    if(results.some(r=>r.status==="rejected")){setSyncStatus("error");announce("Algumas exclusões falharam; a lista será sincronizada novamente.","error");void loadRows(mes,true)}
  };
  const removeRows=(ids:string[])=>{
    if(!ids.length)return;if(undo)void finalizeUndo();
    const current=rowsRef.current,pack=ids.map(id=>({row:current.find(r=>r.id===id),index:current.findIndex(r=>r.id===id)})).filter(x=>x.row) as {row:Row;index:number}[];
    if(!pack.length)return;
    pack.forEach(x=>{const t=pendingTimers.current.get(x.row.id);if(t)clearTimeout(t);pendingTimers.current.delete(x.row.id);pendingPatches.current.delete(x.row.id)});
    setRowsSafe(p=>p.filter(r=>!ids.includes(r.id)));setSelectedIds(new Set());setSelectedPostId(p=>p&&ids.includes(p)?null:p);setUndo({rows:pack.map(x=>x.row),indexes:pack.map(x=>x.index)});
    undoTimer.current=setTimeout(()=>void finalizeDeletePack(pack),6500);
  };
  const finalizeDeletePack=async(pack:{row:Row;index:number}[])=>{
    const results=await Promise.allSettled(pack.map(x=>dbDelete(x.row.id)));setUndo(null);
    if(results.some(r=>r.status==="rejected")){setSyncStatus("error");announce("A exclusão não foi concluída no servidor. Atualizando a lista…","error");void loadRows(mes,true)}
  };
  const undoDelete=()=>{
    if(!undo)return;if(undoTimer.current)clearTimeout(undoTimer.current);
    const items=undo.rows.map((row,i)=>({row,index:undo.indexes[i]})).sort((a,b)=>a.index-b.index);
    setRowsSafe(prev=>{const next=[...prev];items.forEach(({row,index})=>next.splice(Math.min(index,next.length),0,row));return next});setUndo(null);announce("Exclusão desfeita.","success")
  };

  const loadFullSource=async(source:Row)=>{
    if(source.details_loaded)return source;
    try{return await dbLoadPost(source.id)}
    catch(error){console.error("Post source load failed",error);announce("Não foi possível carregar todos os dados desta postagem.","error");return null}
  };

  const duplicateOne=async(source:Row)=>{
    const base=await loadFullSource(source);if(!base)return;
    const iso=dateInputValue(base);
    const row=makeRow(rowsRef.current.length+1,base.mes,iso,{...base,postagem:`${source.postagem} (cópia)`,status:"Ideia",published_at:null,views:0,likes:0,shares:0,saves:0,followers_gained:0,historico:[makeHistory("duplicação",base.id,"nova cópia")]});
    if(row.mes===mes)setRowsSafe(previous=>{const index=previous.findIndex(item=>item.id===source.id),next=[...previous];next.splice(index>=0?index+1:next.length,0,row);return next});
    setSyncStatus("saving");
    try{await dbUpsert(row);setSyncStatus("ok");setSelectedPostId(row.id);announce("Conteúdo duplicado.","success")}
    catch(error){console.error("Duplicate failed",error);setRowsSafe(previous=>previous.filter(item=>item.id!==row.id));setSyncStatus("error");setSyncError("Cópia não salva");announce("Não foi possível duplicar o conteúdo.","error")}
  };

  const duplicateSelected=async()=>{
    const selectedSources=selectedArray.map(id=>rowsRef.current.find(row=>row.id===id)).filter((row):row is Row=>!!row);
    if(!selectedSources.length)return;
    const sources=(await Promise.all(selectedSources.map(loadFullSource))).filter((source):source is Row=>!!source);
    if(sources.length!==selectedSources.length)return;
    const copies=sources.map(source=>makeRow(rowsRef.current.length+1,mes,"",{...source,postagem:`${source.postagem} (cópia)`,status:"Ideia",published_at:null,views:0,likes:0,shares:0,saves:0,followers_gained:0,historico:[makeHistory("duplicação",source.id,"nova cópia")]}));
    setRowsSafe(previous=>[...previous,...copies]);setSelectedIds(new Set());setSyncStatus("saving");
    try{await dbUpsertMany(copies);setSyncStatus("ok");announce(`${copies.length} ${copies.length===1?"cópia criada":"cópias criadas"}.`,"success")}
    catch(error){console.error("Bulk duplicate failed",error);setRowsSafe(previous=>previous.filter(row=>!copies.some(copy=>copy.id===row.id)));setSyncStatus("error");setSyncError("Cópias não salvas");announce("Não foi possível duplicar os itens selecionados.","error")}
  };

  const filtered=useMemo(()=>rows.filter(r=>{if(filterStatus!=="Todos"&&r.status!==filterStatus)return false;if(filterRede!=="Todos"&&r.rede!==filterRede&&r.rede!=="Todos")return false;const q=deferredSearch.trim().toLowerCase();return !q||[r.postagem,r.tema,r.hook,r.responsavel,r.formato,r.rede].some(v=>v?.toLowerCase().includes(q))}).sort((a,b)=>{const da=dateInputValue(a),db=dateInputValue(b);if(!da&&!db)return 0;if(!da)return 1;if(!db)return-1;return da.localeCompare(db)}),[rows,filterStatus,filterRede,deferredSearch]);
  const selectedPost=useMemo(()=>rows.find(r=>r.id===selectedPostId)||null,[rows,selectedPostId]);
  const selectedArray=[...selectedIds];
  const openPost=useCallback((r:Row)=>{
    setSelectedPostId(r.id);
    if(r.details_loaded)return;
    void dbLoadPost(r.id).then(full=>setRowsSafe(previous=>{const exists=previous.some(row=>row.id===full.id);return exists?previous.map(row=>row.id===full.id?full:row):[...previous,full]})).catch(error=>{console.error("Post detail load failed",error);announce("Não foi possível carregar a ficha completa desta postagem.","error")});
  },[announce,setRowsSafe]);
  const openExternalPost=(r:Row)=>{if(r.mes!==mes)setMes(r.mes);if(!rowsRef.current.some(row=>row.id===r.id))setRowsSafe(previous=>[...previous,r]);goTab("conteudo");openPost(r)};
  const titleMap:Record<AppTab,string>={hoje:"Central de Hoje",conteudo:`Conteúdo · ${MONTHS[mes]}`,produtividade:"Produtividade",leads:"Leads & clientes",influencers:"Influencers & links"};
  const syncClass=syncStatus==="saving"?"saving":syncStatus==="error"?"error":"";
  const urgentCount=rows.filter(row=>{const urgency=getUrgencyMeta(row);return urgency?.level==="atrasado"||urgency?.level==="hoje"||urgency?.level==="amanha"}).length;
  const openNew=(dateISO="")=>{goTab("conteudo");setQuickCreateDate(dateISO)};
  const consumeLeadNew=useCallback(()=>setLeadNewNonce(0),[]);
  const effectiveViewMode:ViewMode = isMobile&&viewMode==="kanban"?"calendario":viewMode;

  const contentView=<div data-tour="content-view"><SectionTitle eyebrow="Mapa editorial" right={<><button type="button" className="cxp-btn desktop-only" onClick={()=>setShowTemplates(true)}>✦ Modelos</button><button type="button" className="cxp-btn desktop-only" onClick={()=>setShowRecurrence(true)}>↻ Recorrência</button><button type="button" className="cxp-btn mobile-only" onClick={()=>setContentToolsOpen(true)}>••• Ferramentas</button><button type="button" className="cxp-btn primary" onClick={()=>openNew()}>＋ Nova postagem</button></>}>Conteúdo · {MONTHS[mes]}</SectionTitle>
    <div className="cxp-toolbar"><label><span className="sr-only">Mês</span><select className="cxp-input" style={{width:isMobile?"100%":155}} value={mes} onChange={e=>setMes(Number(e.target.value))}>{MONTHS.map((month,i)=><option key={month} value={i}>{month}</option>)}</select></label><label className="grow"><span className="sr-only">Buscar conteúdo</span><input className="cxp-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tema, hook, responsável…"/></label>{!isMobile&&<><label><span className="sr-only">Filtrar por rede</span><select className="cxp-input" style={{width:155}} value={filterRede} onChange={e=>setFilterRede(e.target.value)}><option>Todos</option>{REDE_OPTIONS.filter(network=>network!=="Todos").map(network=><option key={network}>{network}</option>)}</select></label><label><span className="sr-only">Filtrar por status</span><select className="cxp-input" style={{width:155}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option>Todos</option>{STATUS_OPTIONS.map(status=><option key={status}>{status}</option>)}</select></label></>} {isMobile&&<button type="button" className="cxp-btn" onClick={()=>setFilterOpen(true)}>☷ Filtros{filterRede!=="Todos"||filterStatus!=="Todos"?" •":""}</button>}<button type="button" className="cxp-btn icon" onClick={()=>void loadRows(mes)} aria-label="Atualizar conteúdo">↻</button></div>
    <StatusOverview rows={rows} active={filterStatus} onChange={setFilterStatus}/>
    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}} data-tour="view-switch"><div className="cxp-view-switch" role="group" aria-label="Visualização do conteúdo">{(isMobile?["calendario","tabela"] as ViewMode[]:["calendario","kanban","tabela"] as ViewMode[]).map(view=><button type="button" key={view} className={effectiveViewMode===view?"active":""} aria-pressed={effectiveViewMode===view} onClick={()=>setViewMode(view)}>{view==="calendario"?"◫ Calendário":view==="kanban"?"▥ Kanban":"≡ Tabela"}</button>)}</div>{effectiveViewMode==="calendario"&&!isMobile&&<div style={{display:"flex",gap:5,overflowX:"auto"}} role="group" aria-label="Escala do calendário">{(["agenda","semana","mes"] as CalendarScope[]).map(scope=><button type="button" key={scope} className={`cxp-chip ${calendarScope===scope?"active":""}`} aria-pressed={calendarScope===scope} onClick={()=>setCalendarScope(scope)}>{scope==="agenda"?"Agenda":scope==="semana"?"Semana":"Mês"}</button>)}</div>}</div>
    {viewMode==="calendario"&&<div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:8}} role="group" aria-label="Filtrar calendário por rede"><button type="button" className={`cxp-chip ${filterRede==="Todos"?"active":""}`} aria-pressed={filterRede==="Todos"} onClick={()=>setFilterRede("Todos")}>Todas as redes</button>{REDE_OPTIONS.filter(network=>network!=="Todos").map(network=><button type="button" key={network} className={`cxp-chip ${filterRede===network?"active":""}`} aria-pressed={filterRede===network} onClick={()=>setFilterRede(network)}>{REDE_ICONS[network]} {network}</button>)}</div>}
    {selectedIds.size>0&&<BulkBar count={selectedIds.size} onStatus={status=>void patchMany(selectedArray,row=>({status,historico:appendHistory(row.historico,makeHistory("status",row.status,status)),...(status==="Publicado"&&row.status!=="Publicado"?{published_at:new Date().toISOString()}:{})}))} onResponsavel={value=>void patchMany(selectedArray,row=>({responsavel:value,historico:appendHistory(row.historico,makeHistory("responsavel",row.responsavel,value))}))} onDate={iso=>void patchMany(selectedArray,row=>({data:isoToBR(iso),data_iso:iso,mes:Number(iso.slice(5,7))-1,historico:appendHistory(row.historico,makeHistory("data",row.data,isoToBR(iso)))}))} onPublish={()=>void patchMany(selectedArray,row=>({status:"Publicado",published_at:row.published_at||new Date().toISOString(),historico:appendHistory(row.historico,makeHistory("status",row.status,"Publicado"))}))} onDuplicate={()=>void duplicateSelected()} onDelete={()=>removeRows(selectedArray)} onClear={()=>setSelectedIds(new Set())}/>} 
    {loading?<LoadingState label="Carregando conteúdo…"/>:syncStatus==="error"&&!rows.length?<StatePanel tone="error" title="Conteúdo indisponível" description="Não foi possível carregar os dados deste mês." actionLabel="Tentar novamente" onAction={()=>void loadRows(mes)}/>:effectiveViewMode==="tabela"?(isMobile?<MobileContentCards rows={filtered} onOpen={openPost} onUpdate={updateRow} onAdapt={setAdaptRow} onDuplicate={row=>void duplicateOne(row)}/>:<ContentTable rows={filtered} selected={selectedIds} onSelect={id=>setSelectedIds(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next})} onSelectAll={()=>setSelectedIds(previous=>filtered.length&&filtered.every(row=>previous.has(row.id))?new Set():new Set(filtered.map(row=>row.id)))} onOpen={openPost} onUpdate={updateRow} onAdapt={setAdaptRow} onDuplicate={row=>void duplicateOne(row)} onRemove={id=>removeRows([id])}/>):effectiveViewMode==="kanban"?<KanbanView rows={filtered} onOpen={openPost} onStatus={(id,status)=>updateRow(id,"status",status)}/>:<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"245px minmax(0,1fr)",gap:10,alignItems:"start"}}>{!isMobile&&<Backlog rows={rows} onOpen={openPost} onAdd={()=>openNew()}/>}<div className="cxp-panel"><CalendarBoard rows={filtered} mes={mes} scope={isMobile?"agenda":calendarScope} weekIndex={weekIndex} onWeekIndex={setWeekIndex} onMovePost={movePost} onOpen={openPost} onDayMenu={setDayMenuDate}/></div>{isMobile&&<Backlog rows={rows} onOpen={openPost} onAdd={()=>openNew()}/>}</div>}
  </div>;

  return <div className="cxp-app"><div className="cxp-app-shell"><aside className="cxp-sidebar"><div className="cxp-brand"><div className="cxp-brand-logo"><img src="/icons/criandoxp.png" alt=""/></div><div><div className="cxp-brand-title">Criando XP</div><div className="cxp-brand-sub">Central editorial</div></div></div><button type="button" className="cxp-btn primary large" style={{width:"100%",marginBottom:13}} onClick={()=>openNew()} data-tour="new-content">＋ Nova postagem</button><div className="cxp-side-label">Central</div><Navigation appTab={appTab} setAppTab={tab=>goTab(tab)}/><div className="cxp-side-spacer"/><div className="cxp-sidebar-foot"><div className={`cxp-sync ${syncClass}`} title={syncError||undefined} aria-live="polite"><span className="cxp-sync-dot" aria-hidden="true"/><span>{!isOnline?"Offline":syncStatus==="saving"?"Salvando alterações…":syncStatus==="error"?"Falha na sincronização":"Tudo sincronizado"}</span></div><button type="button" className="cxp-btn" onClick={()=>setCommandOpen(true)} data-tour="search">⌕ Buscar · Ctrl K</button><button type="button" className="cxp-btn" onClick={()=>setHelpOpen(true)} data-tour="help">? Ajuda</button><button type="button" className="cxp-btn ghost" onClick={onVoltar}>Sair da central</button></div></aside><main className="cxp-main"><MobileTop title={titleMap[appTab]} syncStatus={syncStatus} onSearch={()=>setCommandOpen(true)} onNew={()=>openNew()} onHelp={()=>setHelpOpen(true)}/><header className="cxp-topbar"><div className="cxp-topbar-title"><div className="cxp-topbar-eyebrow">Criando XP · operação editorial</div><div className="cxp-topbar-name">{titleMap[appTab]}</div></div>{urgentCount>0&&<span className="cxp-header-urgent">⚡ {urgentCount} urgente{urgentCount!==1?"s":""}</span>}<div className="cxp-top-actions"><button type="button" className="cxp-searchbar" onClick={()=>setCommandOpen(true)} data-tour="search"><span aria-hidden="true">⌕</span><span>Buscar em tudo</span><kbd>Ctrl K</kbd></button><button type="button" className="cxp-btn primary large" onClick={()=>openNew()} data-tour="new-content">＋ Novo conteúdo</button></div></header>{!isOnline&&<div className="cxp-offline" role="status">Sem conexão. Evite fechar a página até a internet voltar e a sincronização concluir.</div>}<div className="cxp-content">{appTab==="hoje"&&<TodayCenter rows={centralRows} leads={centralLeads} loading={centralLoading} error={centralError} onRetry={()=>void loadCentral()} onOpenPost={openExternalPost} onGoContent={()=>goTab("conteudo")} onGoLeads={()=>goTab("leads")} onCreateForDate={iso=>openNew(iso)} onNew={openNew}/>} {appTab==="conteudo"&&contentView} {appTab==="produtividade"&&<><label style={{display:"block",width:isMobile?"100%":170,marginBottom:10}}><span className="sr-only">Mês dos indicadores</span><select className="cxp-input" value={mes} onChange={e=>setMes(Number(e.target.value))}>{MONTHS.map((month,i)=><option value={i} key={month}>{month}</option>)}</select></label><ProductivityView rows={rows}/></>} {appTab==="leads"&&<LeadsView isMobile={isMobile} openNewNonce={leadNewNonce} onConsumeNew={consumeLeadNew}/>} {appTab==="influencers"&&<InfluencersView isMobile={isMobile}/>}</div></main></div><Navigation appTab={appTab} setAppTab={tab=>goTab(tab)} mobile/>
    {contentToolsOpen&&<><div className="cxp-overlay" onClick={()=>setContentToolsOpen(false)} aria-hidden="true"/><section ref={contentToolsDialogRef} className="cxp-modal cxp-tools-sheet" role="dialog" aria-modal="true" aria-labelledby="content-tools-title" tabIndex={-1}><div className="cxp-modal-head"><div><div className="cxp-section-eyebrow">Conteúdo</div><h2 id="content-tools-title" className="cxp-section-title" style={{margin:0}}>Ferramentas</h2></div><button type="button" className="cxp-btn icon ghost" onClick={()=>setContentToolsOpen(false)} aria-label="Fechar ferramentas">×</button></div><div className="cxp-tools-actions"><button type="button" className="cxp-btn" onClick={()=>{setContentToolsOpen(false);setShowTemplates(true)}}>✦ Usar modelo</button><button type="button" className="cxp-btn" onClick={()=>{setContentToolsOpen(false);setShowRecurrence(true)}}>↻ Criar recorrência</button></div></section></>} {quickCreateDate!==null&&<QuickPostModal initialDate={quickCreateDate} onClose={()=>setQuickCreateDate(null)} onCreate={async(partial,dateISO,openDetails)=>!!(await addAndOpen(partial,dateISO,openDetails))}/>} {selectedPost&&<PostDrawer row={selectedPost} onClose={()=>setSelectedPostId(null)} onUpdate={updateRow} onToggleChecklist={toggleChecklist} onAdapt={setAdaptRow} onDuplicate={row=>void duplicateOne(row)} onRemove={id=>removeRows([id])}/>} {showTemplates&&<TemplateModal onClose={()=>setShowTemplates(false)} onCreate={createTemplate}/>} {showRecurrence&&<RecurrenceModal mes={mes} onClose={()=>setShowRecurrence(false)} onGenerate={generateRecurrence}/>} {adaptRow&&<AdaptModal row={adaptRow} onClose={()=>setAdaptRow(null)} onCreate={(network,format)=>void adapt(adaptRow,network,format)}/>} {dayMenuDate&&<DayActionSheet dateISO={dayMenuDate} rows={rows} onClose={()=>setDayMenuDate(null)} onNew={()=>{const iso=dayMenuDate;setDayMenuDate(null);openNew(iso)}} onExtra={()=>{const iso=dayMenuDate;setDayMenuDate(null);void createExtraTikTok(iso)}} onIdea={()=>{const iso=dayMenuDate;setDayMenuDate(null);openNew(iso)}} onDuplicate={row=>void duplicateToDate(row,dayMenuDate)}/>} {filterOpen&&<><div className="cxp-overlay" onClick={()=>setFilterOpen(false)} aria-hidden="true"/><section ref={filterDialogRef} className="cxp-modal cxp-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title" tabIndex={-1}><div className="cxp-modal-head"><h2 id="filter-title" className="cxp-section-title" style={{margin:0}}>Filtros</h2><button type="button" className="cxp-btn icon ghost" onClick={()=>setFilterOpen(false)} aria-label="Fechar filtros">×</button></div><div style={{display:"grid",gap:10}}><label className="cxp-field"><span>Rede</span><select className="cxp-input" value={filterRede} onChange={e=>setFilterRede(e.target.value)}><option>Todos</option>{REDE_OPTIONS.filter(network=>network!=="Todos").map(network=><option key={network}>{network}</option>)}</select></label><label className="cxp-field"><span>Status</span><select className="cxp-input" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option>Todos</option>{STATUS_OPTIONS.map(status=><option key={status}>{status}</option>)}</select></label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}><button type="button" className="cxp-btn" onClick={()=>{setFilterRede("Todos");setFilterStatus("Todos")}}>Limpar</button><button type="button" className="cxp-btn primary" onClick={()=>setFilterOpen(false)}>Aplicar</button></div></div></section></>} {undo&&<div className="cxp-toast info" role="status" aria-live="polite"><span>{undo.rows.length===1?"Postagem excluída":`${undo.rows.length} postagens excluídas`}</span><button type="button" className="cxp-btn" onClick={undoDelete}>DESFAZER</button></div>}{notice&&!undo&&<div className={`cxp-toast ${notice.type}`} role={notice.type==="error"?"alert":"status"} aria-live={notice.type==="error"?"assertive":"polite"}><span>{notice.message}</span><button type="button" className="cxp-btn icon ghost" onClick={()=>setNotice(null)} aria-label="Fechar aviso">×</button></div>}<CommandPalette open={commandOpen} onClose={()=>setCommandOpen(false)} onNewPost={openNew} onExtraTikTok={()=>void createExtraTikTok(todayISO())} onToday={()=>goTab("hoje")} onLeads={()=>{goTab("leads");setLeadNewNonce(value=>value+1)}} onInfluencers={()=>goTab("influencers")} onOpenPost={openExternalPost}/><HelpCenter open={helpOpen} onClose={()=>setHelpOpen(false)} onRestartTutorial={()=>setTourRestartToken(value=>value+1)}/><OnboardingTour steps={TOUR_STEPS} restartToken={tourRestartToken} onNavigate={step=>{if(step.tab)goTab(step.tab as AppTab,true)}}/></div>;
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const pageFromPath=():AppPage=>window.location.pathname.startsWith("/central")?"dashboard":"landing";
  const [page,setPage]=useState<AppPage>(pageFromPath),[autenticado,setAutenticado]=useState(false),[checando,setChecando]=useState(true),[authError,setAuthError]=useState(""),[senha,setSenha]=useState(""),[erro,setErro]=useState(""),[entrando,setEntrando]=useState(false);
  const EMAIL_LOGIN=import.meta.env.VITE_DASHBOARD_EMAIL||"giovannihilario@hotmail.com";
  useEffect(()=>{
    let alive=true;
    supabase.auth.getSession().then(({data:{session},error})=>{if(!alive)return;if(error){console.error("Auth session read failed",error);setAuthError("Não foi possível verificar sua sessão.")}setAutenticado(!!session);setChecando(false)}).catch(error=>{if(!alive)return;console.error("Auth bootstrap failed",error);setAuthError("Não foi possível verificar sua sessão.");setChecando(false)});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(alive)setAutenticado(!!session)});
    const onPop=()=>setPage(pageFromPath());window.addEventListener("popstate",onPop);
    return()=>{alive=false;subscription.unsubscribe();window.removeEventListener("popstate",onPop)};
  },[]);
  const openDashboard=()=>{const url="/central?tab=hoje";if(window.location.pathname+window.location.search!==url)window.history.pushState({},"",url);setPage("dashboard")};
  const entrar=async(event?:FormEvent)=>{event?.preventDefault();if(entrando||!senha)return;setEntrando(true);setErro("");try{const{error}=await supabase.auth.signInWithPassword({email:EMAIL_LOGIN,password:senha});if(error){setErro("Email ou senha incorretos.");return}setSenha("")}catch(error){console.error("Sign-in failed",error);setErro("Não foi possível entrar agora. Verifique sua conexão.")}finally{setEntrando(false)}};
  const sair=async()=>{try{await supabase.auth.signOut()}catch(error){console.error("Sign-out failed",error)}window.history.pushState({},"","/");setPage("landing")};
  if(checando)return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0d0720",color:"#e2d0ff"}}><LoadingState label="Preparando a Criando XP…"/></main>;
  if(authError&&page==="dashboard"&&!autenticado)return <main style={{minHeight:"100vh",padding:20,background:"#0d0720",color:"#e2d0ff"}}><StatePanel tone="error" title="Sessão indisponível" description={authError} actionLabel="Recarregar" onAction={()=>window.location.reload()}/></main>;
  const login=<main className="cxp-login-shell"><section className="cxp-login-card" aria-labelledby="login-title"><div className="cxp-login-brand"><img src="/icons/criandoxp.png" alt=""/></div><p className="cxp-section-eyebrow">Criando XP · acesso interno</p><h1 id="login-title">Central de Operações</h1><p className="cxp-login-copy">Entre com a senha da equipe para acessar planejamento, produção e CRM.</p><form onSubmit={entrar}><label className="cxp-field" htmlFor="dashboard-password"><span>Senha</span><input id="dashboard-password" className="cxp-input" type="password" value={senha} onChange={e=>{setSenha(e.target.value);setErro("")}} autoComplete="current-password" required placeholder="Digite sua senha"/></label>{erro&&<div className="cxp-form-error" role="alert">{erro}</div>}<button type="submit" className="cxp-btn primary large" disabled={entrando||!senha} style={{width:"100%",marginTop:10}}>{entrando?"Entrando…":"Entrar na central"}</button></form><button type="button" className="cxp-btn ghost" style={{width:"100%",marginTop:8}} onClick={()=>{window.history.pushState({},"","/");setPage("landing")}}>Voltar ao site</button></section></main>;
  return <>{page==="landing"?<LandingPage onAbrirDashboard={openDashboard}/>:autenticado?<Dashboard onVoltar={()=>void sair()}/>:login}</>;
}
