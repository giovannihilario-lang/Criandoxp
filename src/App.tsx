import { useState, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import LandingPage from "./LandingPage";
import mayoouImg from "../public/icons/mayoou.png";
import zonad20Img from "../public/icons/zonad20.png";

// ─── Supabase ──────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://zovgkatndrgzxocwpdjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Constantes ────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const STATUS_OPTIONS = ["Ideia","Roteiro","Produção","Edição","Agendado","Publicado","Cancelado"] as const;
const FLOW_STATUS = STATUS_OPTIONS.filter(s => s !== "Cancelado") as Status[];
const EXTRA_TIKTOK_FORMAT = "Vídeo extra TikTok";
const FORMATO_OPTIONS = ["Post","Reels","Story","Carrossel","Live","Shorts","Thread", EXTRA_TIKTOK_FORMAT];
const REDE_OPTIONS = ["Instagram","TikTok","YouTube","Twitter/X","Facebook","Todos"];
const CURRENT_ACTOR = "Giovanni";

type Status = typeof STATUS_OPTIONS[number];
type ViewMode = "tabela" | "calendario" | "kanban";
type CalendarScope = "mes" | "semana";
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
  Ideia:      { bg: "#32204f", text: "#d8b4fe", border: "#7e22ce", rowBg: "rgba(126,34,206,.12)", calBg: "#4c1d95dd" },
  Roteiro:    { bg: "#2a2659", text: "#c4b5fd", border: "#6366f1", rowBg: "rgba(99,102,241,.12)", calBg: "#3730a3dd" },
  Produção:   { bg: "#1f3155", text: "#93c5fd", border: "#3b82f6", rowBg: "rgba(59,130,246,.12)", calBg: "#1d4ed8dd" },
  Edição:     { bg: "#27364a", text: "#67e8f9", border: "#0891b2", rowBg: "rgba(8,145,178,.12)", calBg: "#0e7490dd" },
  Agendado:   { bg: "#163b38", text: "#6ee7b7", border: "#10b981", rowBg: "rgba(16,185,129,.11)", calBg: "#047857dd" },
  Publicado:  { bg: "#19391f", text: "#86efac", border: "#16a34a", rowBg: "rgba(22,163,74,.11)", calBg: "#15803ddd" },
  Cancelado:  { bg: "#3a1a1a", text: "#fca5a5", border: "#dc2626", rowBg: "rgba(220,38,38,.09)", calBg: "#991b1bdd" },
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
function legacyStatus(status: unknown): Status {
  if (status === "Planejado") return "Ideia";
  if (status === "Em produção") return "Produção";
  return STATUS_OPTIONS.includes(status as Status) ? status as Status : "Ideia";
}
function normalizeChecklist(v: unknown): ChecklistItem[] {
  return Array.isArray(v) ? v.filter(Boolean).map((x: any, i) => ({ id: String(x.id ?? `item-${i}`), label: String(x.label ?? "Item"), done: !!x.done })) : [];
}
function normalizeHistory(v: unknown): HistoryItem[] {
  return Array.isArray(v) ? v.filter(Boolean).map((x: any) => ({ at: String(x.at ?? ""), actor: String(x.actor ?? ""), field: String(x.field ?? ""), from: String(x.from ?? ""), to: String(x.to ?? "") })) : [];
}
function normalizeRow(raw: any): Row {
  const iso = raw.data_iso || brToISO(raw.data || "");
  return {
    id: String(raw.id), postagem: raw.postagem || "Postagem", data: raw.data || isoToBR(iso), data_iso: iso,
    tema: raw.tema || "", briefing: raw.briefing || "", hook: raw.hook || "", roteiro: raw.roteiro || "", cta: raw.cta || "",
    referencias: raw.referencias || "", formato: raw.formato || "", rede: raw.rede || "", responsavel: raw.responsavel || "",
    status: legacyStatus(raw.status), observacoes: raw.observacoes || "", mes: Number.isFinite(Number(raw.mes)) ? Number(raw.mes) : (iso ? Number(iso.slice(5,7))-1 : new Date().getMonth()),
    link_arquivo: raw.link_arquivo || "", checklist: normalizeChecklist(raw.checklist), historico: normalizeHistory(raw.historico),
    views: Number(raw.views || 0), likes: Number(raw.likes || 0), shares: Number(raw.shares || 0), saves: Number(raw.saves || 0),
    followers_gained: Number(raw.followers_gained || 0), published_at: raw.published_at || null, created_at: raw.created_at,
  };
}
function parseLinks(raw: string): string[] { return raw.split(",").map(s => s.trim()).filter(Boolean); }
function driveFileId(url: string): string | null { return url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? null; }
function driveThumbnailUrl(url: string): string | null { const id = driveFileId(url); return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w500` : null; }
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
  return { at: new Date().toISOString(), actor: CURRENT_ACTOR, field, from: String(from ?? ""), to: String(to ?? "") };
}
function makeRow(n: number, mes: number, dateISO = "", partial: Partial<Row> = {}): Row {
  const format = partial.formato || "";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    postagem: partial.postagem || `Postagem ${n}`,
    data: dateISO ? isoToBR(dateISO) : "",
    data_iso: dateISO || null,
    tema: partial.tema || "", briefing: partial.briefing || "", hook: partial.hook || "", roteiro: partial.roteiro || "", cta: partial.cta || "",
    referencias: partial.referencias || "", formato: format, rede: partial.rede || "", responsavel: partial.responsavel || "",
    status: partial.status || "Ideia", observacoes: partial.observacoes || "", mes: dateISO ? Number(dateISO.slice(5,7))-1 : mes,
    link_arquivo: partial.link_arquivo || "", checklist: partial.checklist || makeChecklist(format), historico: partial.historico || [],
    views: partial.views || 0, likes: partial.likes || 0, shares: partial.shares || 0, saves: partial.saves || 0,
    followers_gained: partial.followers_gained || 0, published_at: partial.published_at || null,
  };
}

// ─── Banco ─────────────────────────────────────────────────────────────────
async function dbLoad(mes: number): Promise<Row[]> {
  // Usa o cliente autenticado do Supabase. Assim as policies de RLS enxergam
  // o usuário logado, em vez de receberem sempre a anon key no Authorization.
  const primary = await supabase
    .from("postagens")
    .select("*")
    .eq("mes", mes)
    .order("data_iso", { ascending: true });

  if (!primary.error) return (primary.data ?? []).map(normalizeRow);

  // Compatibilidade de deploy: antes da migração criar data_iso, ainda consegue
  // abrir o calendário usando o campo mes legado.
  const msg = primary.error.message || "";
  if (msg.includes("data_iso") || msg.includes("PGRST") || msg.includes("schema cache")) {
    const fallback = await supabase
      .from("postagens")
      .select("*")
      .eq("mes", mes);

    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []).map(normalizeRow);
  }

  throw new Error(primary.error.message);
}

async function dbLoadAllRows(): Promise<Row[]> {
  const { data, error } = await supabase
    .from("postagens")
    .select("*");

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeRow);
}

async function dbUpsert(row: Row): Promise<void> {
  const { data, error } = await supabase
    .from("postagens")
    .upsert(row, { onConflict: "id" })
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
    .upsert(rows, { onConflict: "id" })
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
  const { data, error } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Lead[];
}
async function dbUpdateLead(id: string, patch: Partial<Lead>): Promise<void> {
  const { error } = await supabase.from("clientes").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}
async function dbCreateLead(payload: Partial<Lead>): Promise<void> {
  const { error } = await supabase.from("clientes").insert(payload);
  if (error) throw new Error(error.message);
}
async function dbLoadInfluencers(): Promise<Influencer[]> {
  const { data, error } = await supabase.from("influencers").select("*").order("clicks", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Influencer[];
}
async function dbCreateInfluencer(nome: string, codigo: string): Promise<void> {
  const { error } = await supabase.from("influencers").insert({ nome, codigo });
  if (error) throw new Error(error.message);
}
async function dbUpdateInfluencer(id: string, patch: Partial<Influencer>): Promise<void> {
  const { error } = await supabase.from("influencers").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}
async function dbDeleteInfluencer(id: string): Promise<void> {
  const { error } = await supabase.from("influencers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
function slugifyCodigo(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

// ─── UI base ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 800);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 800); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return isMobile;
}

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
*{box-sizing:border-box} body{margin:0;background:#0d0720} button,input,select,textarea{font:inherit} button{touch-action:manipulation}
::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-track{background:#0d0720}::-webkit-scrollbar-thumb{background:#4a2a8a;border-radius:8px}
@keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{50%{opacity:.45}} @keyframes pulse{50%{box-shadow:0 0 0 5px transparent}}
.cxp-shell{min-height:100vh;background:radial-gradient(circle at 15% 0%,#2a1655 0,transparent 28%),linear-gradient(135deg,#0d0720,#150b2d 50%,#0d0720);color:#e2d0ff;padding:18px 16px 40px;text-align:left}
.cxp-wrap{width:min(1500px,100%);margin:0 auto}.cxp-card{background:linear-gradient(145deg,#160b31,#100722);border:1px solid #2d1b69;border-radius:14px}.cxp-card:hover{border-color:#4a2a8a}
.cxp-btn{border:1px solid #4a2a8a;background:#160b31;color:#c9a0f5;border-radius:9px;padding:9px 13px;cursor:pointer;font-family:'Cinzel',serif;font-size:11px}.cxp-btn:hover{border-color:#8b5cf6;background:#211042}.cxp-btn.primary{background:linear-gradient(135deg,#6d28d9,#9333ea);color:#fff;border:none;font-weight:700}.cxp-btn.danger{border-color:#7f1d1d;color:#fca5a5}.cxp-btn.green{border-color:#166534;color:#86efac}
.cxp-input{width:100%;background:#0d0720;border:1px solid #3d246f;border-radius:8px;padding:9px 10px;color:#e2d0ff;outline:none;font-family:'Lato',sans-serif;font-size:13px}.cxp-input:focus{border-color:#8b5cf6;box-shadow:0 0 0 2px rgba(139,92,246,.12)} textarea.cxp-input{resize:vertical;min-height:84px}
.cxp-label{font-family:'Cinzel',serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#7c5caf;margin-bottom:5px}.cxp-title{font-family:'Cinzel',serif;font-weight:900}.cxp-muted{color:#6f5a95}.cxp-grid-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.cxp-kpi{padding:14px}.cxp-kpi strong{display:block;font-family:'Cinzel',serif;font-size:24px;margin-top:5px}.cxp-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid #3d246f;background:#120925;color:#a78bfa;border-radius:999px;padding:5px 9px;font:700 9px 'Cinzel',serif;cursor:pointer}.cxp-chip.active{border-color:#8b5cf6;background:#3b1d73;color:#fff}.cxp-nav{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}.cxp-nav button{white-space:nowrap}.cxp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:1000}.cxp-modal{position:fixed;z-index:1001;left:50%;top:50%;transform:translate(-50%,-50%);width:min(680px,calc(100vw - 24px));max-height:88vh;overflow:auto;background:#100722;border:1px solid #5b32a3;border-radius:16px;box-shadow:0 30px 90px #000;padding:18px}.cxp-drawer{position:fixed;z-index:1002;right:0;top:0;height:100vh;width:min(620px,100vw);overflow:auto;background:#100722;border-left:1px solid #5b32a3;box-shadow:-30px 0 80px #000;padding:18px}
.cxp-table{width:100%;border-collapse:collapse;min-width:940px}.cxp-table th{position:sticky;top:0;z-index:2;background:#24104a;color:#c084fc;font:700 9px 'Cinzel',serif;text-transform:uppercase;letter-spacing:1px;padding:10px;border-right:1px solid #3d246f}.cxp-table td{padding:7px;border-right:1px solid #211042;border-bottom:1px solid #211042;vertical-align:middle}.cxp-table tr:hover td{background:rgba(124,58,237,.05)}
.cxp-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.cxp-day{min-height:118px;background:#100722;border:1px solid #2d1b69;border-radius:9px;padding:6px;position:relative}.cxp-day.today{border:2px solid #7c3aed}.cxp-day.drop{outline:2px dashed #c084fc;background:#251044}.cxp-day.empty{opacity:.3}.cxp-daypost{padding:4px 6px;border-radius:5px;margin-top:4px;font-size:10px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cxp-kanban{display:grid;grid-template-columns:repeat(6,minmax(210px,1fr));gap:10px;overflow-x:auto;padding-bottom:8px}.cxp-kanban-col{min-height:500px;padding:10px;background:#0f071f;border:1px solid #2d1b69;border-radius:12px}.cxp-kanban-card{padding:10px;border-radius:9px;margin-bottom:8px;cursor:grab;background:#160b31;border:1px solid #3d246f}.cxp-progress{height:7px;background:#0d0720;border-radius:99px;overflow:hidden}.cxp-progress>div{height:100%;background:linear-gradient(90deg,#7c3aed,#c084fc)}
.cxp-toast{position:fixed;z-index:1100;left:50%;bottom:20px;transform:translateX(-50%);background:#1a0d3a;border:1px solid #7c3aed;border-radius:12px;padding:12px 14px;color:#e2d0ff;display:flex;gap:14px;align-items:center;box-shadow:0 20px 60px #000;font:12px 'Lato',sans-serif}.cxp-command{position:fixed;z-index:1200;left:50%;top:12%;transform:translateX(-50%);width:min(720px,calc(100vw - 24px));background:#100722;border:1px solid #6d28d9;border-radius:16px;box-shadow:0 35px 100px #000;overflow:hidden}.cxp-command-row{padding:11px 14px;border-top:1px solid #211042;cursor:pointer;display:flex;align-items:center;gap:10px}.cxp-command-row:hover{background:#211042}
@media(max-width:900px){.cxp-shell{padding:12px 8px 30px}.cxp-grid-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.cxp-calendar{gap:2px}.cxp-day{min-height:72px;padding:4px}.cxp-daypost{font-size:0;height:8px;padding:0}.cxp-kanban{grid-template-columns:repeat(6,220px)}.cxp-drawer{padding:14px}.hide-mobile{display:none!important}}
`;

const inputStyle: CSSProperties = { width: "100%", background: "#0d0720", color: "#e2d0ff", border: "1px solid #3d246f", borderRadius: 8, padding: "8px 9px", outline: "none", fontFamily: "'Lato',sans-serif", fontSize: 13 };

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_COLORS[status];
  return <span style={{ display:"inline-flex", padding:"4px 8px", borderRadius:999, background:c.bg, color:c.text, border:`1px solid ${c.border}`, font:"700 9px 'Cinzel',serif", whiteSpace:"nowrap" }}>{status}</span>;
}
function Spinner() { return <div style={{ width:30,height:30,border:"3px solid #3d246f",borderTopColor:"#c084fc",borderRadius:"50%",animation:"spin .8s linear infinite" }} />; }
function SectionTitle({ eyebrow, children, right }: { eyebrow?: string; children: ReactNode; right?: ReactNode }) {
  return <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:12,marginBottom:14,flexWrap:"wrap" }}><div>{eyebrow && <div className="cxp-label">{eyebrow}</div>}<div className="cxp-title" style={{ fontSize:18,color:"#e9d5ff" }}>{children}</div></div>{right}</div>;
}

// ─── Central de Hoje ───────────────────────────────────────────────────────
function TodayCenter({ rows, leads, loading, onOpenPost, onGoContent, onGoLeads }: {
  rows: Row[]; leads: Lead[]; loading: boolean; onOpenPost: (r: Row) => void; onGoContent: () => void; onGoLeads: () => void;
}) {
  const today = todayISO(), tomorrow = tomorrowISO();
  const todayRows = rows.filter(r => dateInputValue(r) === today && !isDone(r.status));
  const late = rows.filter(isOverdue).sort((a,b) => dateInputValue(a).localeCompare(dateInputValue(b)));
  const tomorrowRows = rows.filter(r => dateInputValue(r) === tomorrow && !isDone(r.status));
  const backlog = rows.filter(r => !dateInputValue(r) && !isDone(r.status));
  const newLeads = leads.filter(l => l.status === "Novo lead");
  const production = rows.filter(r => ["Roteiro","Produção","Edição"].includes(r.status));

  const group = (title: string, items: Row[], empty: string) => <div className="cxp-card" style={{ padding:14 }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}><div className="cxp-title" style={{ fontSize:12,color:"#c084fc" }}>{title}</div><span className="cxp-chip">{items.length}</span></div>
    {items.length === 0 ? <div className="cxp-muted" style={{ fontSize:12,padding:"12px 0" }}>{empty}</div> : items.slice(0,6).map(r => <button key={r.id} onClick={() => onOpenPost(r)} style={{ width:"100%",background:"transparent",border:"none",borderTop:"1px solid #211042",padding:"9px 0",cursor:"pointer",textAlign:"left",color:"inherit" }}>
      <div style={{ display:"flex",gap:8,alignItems:"center" }}><span>{REDE_ICONS[r.rede] || "📄"}</span><div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,color:"#e2d0ff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.tema || r.postagem}</div><div className="cxp-muted" style={{ fontSize:10 }}>{r.data || "Sem data"} · {r.formato || "sem formato"}</div></div><StatusBadge status={r.status}/></div>
    </button>)}
  </div>;

  if (loading) return <div style={{ padding:60,display:"flex",justifyContent:"center" }}><Spinner/></div>;
  return <div>
    <SectionTitle eyebrow="Visão operacional">Central de Hoje</SectionTitle>
    <div className="cxp-grid-kpis" style={{ marginBottom:14 }}>
      {[
        ["Hoje",todayRows.length,"#fca5a5"],["Atrasados",late.length,"#fb7185"],["Amanhã",tomorrowRows.length,"#fcd34d"],["Novos leads",newLeads.length,"#c084fc"]
      ].map(([label,val,color]) => <div key={String(label)} className="cxp-card cxp-kpi"><div className="cxp-label">{label}</div><strong style={{ color:String(color) }}>{val}</strong></div>)}
    </div>
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12 }}>
      {group("🔥 Precisa acontecer hoje", todayRows, "Nada pendente para hoje.")}
      {group("⏰ Atrasados", late, "Nenhum conteúdo atrasado. Um raro momento civilizatório.")}
      {group("🌤 Amanhã", tomorrowRows, "Nada marcado para amanhã.")}
      {group("⚙ Em produção", production, "Nenhum conteúdo em produção agora.")}
      {group("💡 Banco de ideias", backlog, "O backlog está vazio.")}
      <div className="cxp-card" style={{ padding:14 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}><div className="cxp-title" style={{ fontSize:12,color:"#c084fc" }}>👥 Leads novos</div><span className="cxp-chip">{newLeads.length}</span></div>
        {newLeads.slice(0,6).map(l => <div key={l.id} style={{ borderTop:"1px solid #211042",padding:"9px 0" }}><div style={{ fontSize:12 }}>{l.nome || "Sem nome"}</div><div className="cxp-muted" style={{ fontSize:10 }}>{l.whatsapp_discord || "sem contato"} · {l.origem || l.utm_source || "origem não informada"}</div></div>)}
        {newLeads.length === 0 && <div className="cxp-muted" style={{ fontSize:12,padding:"12px 0" }}>Nenhum lead novo.</div>}
      </div>
    </div>
    <div style={{ display:"flex",gap:8,marginTop:14,flexWrap:"wrap" }}><button className="cxp-btn primary" onClick={onGoContent}>Abrir conteúdo</button><button className="cxp-btn" onClick={onGoLeads}>Abrir CRM</button></div>
  </div>;
}

// ─── Calendário ────────────────────────────────────────────────────────────
function CalendarBoard({ rows, mes, scope, weekIndex, onWeekIndex, onMovePost, onOpen, onCreateForDay }: {
  rows: Row[]; mes: number; scope: CalendarScope; weekIndex: number; onWeekIndex: (n:number)=>void;
  onMovePost:(id:string,dateISO:string)=>void; onOpen:(r:Row)=>void; onCreateForDay:(dateISO:string)=>void;
}) {
  const year = new Date().getFullYear();
  const firstDay = new Date(year, mes, 1).getDay();
  const daysInMonth = new Date(year, mes+1, 0).getDate();
  const cells:(number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while (cells.length % 7) cells.push(null);
  const maxWeek = Math.max(0, cells.length/7 - 1);
  const currentWeek = Math.min(weekIndex, maxWeek);
  const visible = scope === "semana" ? cells.slice(currentWeek*7,currentWeek*7+7) : cells;
  const [dragOverDay,setDragOverDay] = useState<number|null>(null);
  const byDay:Record<number,Row[]> = {};
  rows.forEach(r => { const d = dateInputValue(r); if (d && Number(d.slice(5,7))-1===mes && Number(d.slice(0,4))===year) { const day=Number(d.slice(8,10)); (byDay[day] ||= []).push(r); } });
  const now = new Date(); const todayDay = now.getMonth()===mes && now.getFullYear()===year ? now.getDate() : -1;
  return <div>
    {scope === "semana" && <div style={{ display:"flex",justifyContent:"flex-end",gap:6,marginBottom:8 }}><button className="cxp-btn" disabled={currentWeek===0} onClick={()=>onWeekIndex(Math.max(0,currentWeek-1))}>‹ Semana</button><button className="cxp-btn" disabled={currentWeek===maxWeek} onClick={()=>onWeekIndex(Math.min(maxWeek,currentWeek+1))}>Semana ›</button></div>}
    <div className="cxp-calendar" style={{ marginBottom:4 }}>{WEEKDAYS.map(w => <div key={w} style={{ textAlign:"center",font:"700 9px 'Cinzel',serif",color:"#7656a8",padding:5 }}>{w}</div>)}</div>
    <div className="cxp-calendar">{visible.map((day,idx) => {
      if (!day) return <div key={`e-${idx}`} className="cxp-day empty"/>;
      const items=(byDay[day]||[]).sort((a,b)=>FLOW_STATUS.indexOf(a.status)-FLOW_STATUS.indexOf(b.status));
      const iso=`${year}-${pad(mes+1)}-${pad(day)}`;
      return <div key={day} className={`cxp-day ${day===todayDay?"today":""} ${dragOverDay===day?"drop":""}`}
        onDragOver={e=>{e.preventDefault();setDragOverDay(day)}} onDragLeave={()=>setDragOverDay(null)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("rowId");if(id)onMovePost(id,iso);setDragOverDay(null)}}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><span style={{ font:"700 10px 'Cinzel',serif",color:day===todayDay?"#c084fc":"#6f5a95" }}>{day}</span><button onClick={()=>onCreateForDay(iso)} title="Criar conteúdo neste dia" style={{ background:"none",border:"none",color:"#6f5a95",cursor:"pointer",fontSize:14 }}>＋</button></div>
        {items.slice(0,5).map(r=>{const c=STATUS_COLORS[r.status];return <div key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("rowId",r.id)} onClick={()=>onOpen(r)} className="cxp-daypost" title={`${r.tema||r.postagem} · ${r.formato}`} style={{ background:c.calBg,border:`1px solid ${c.border}`,color:c.text }}>{REDE_ICONS[r.rede]||"📄"} {r.formato===EXTRA_TIKTOK_FORMAT?"Extra TikTok":r.tema||r.postagem}</div>})}
        {items.length>5&&<div className="cxp-muted" style={{fontSize:9,textAlign:"center",marginTop:3}}>+{items.length-5}</div>}
        {items.length>0&&<div style={{display:"flex",gap:2,marginTop:5,flexWrap:"wrap"}}>{Array.from(new Set(items.map(i=>i.formato))).slice(0,4).map(f=><span key={f} title={f} style={{width:5,height:5,borderRadius:"50%",background:f.includes("Reels")||f.includes("TikTok")?"#e879f9":f==="Carrossel"?"#818cf8":"#7c3aed"}}/>)}</div>}
      </div>;
    })}</div>
  </div>;
}

function Backlog({ rows, onOpen, onAdd }: { rows:Row[]; onOpen:(r:Row)=>void; onAdd:()=>void }) {
  const backlog=rows.filter(r=>!dateInputValue(r)&&!isDone(r.status));
  return <div className="cxp-card" style={{ padding:10,minWidth:230 }}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div className="cxp-title" style={{fontSize:11,color:"#c084fc"}}>💡 Banco de Ideias</div><button className="cxp-btn" onClick={onAdd}>＋</button></div><div className="cxp-muted" style={{fontSize:10,marginBottom:8}}>Arraste uma ideia para um dia do calendário.</div>{backlog.length===0&&<div className="cxp-muted" style={{fontSize:11,padding:12,textAlign:"center"}}>Sem ideias soltas.</div>}{backlog.map(r=><div key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("rowId",r.id)} onClick={()=>onOpen(r)} className="cxp-kanban-card" style={{cursor:"grab"}}><div style={{fontSize:11,color:"#e2d0ff"}}>{r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:9,marginTop:4}}>{REDE_ICONS[r.rede]||"📄"} {r.formato||"sem formato"}</div></div>)}</div>;
}

// ─── Kanban ────────────────────────────────────────────────────────────────
function KanbanView({ rows, onOpen, onStatus }: { rows:Row[]; onOpen:(r:Row)=>void; onStatus:(id:string,status:Status)=>void }) {
  const [over,setOver]=useState<Status|null>(null);
  return <div className="cxp-kanban">{FLOW_STATUS.map(status=>{const c=STATUS_COLORS[status];const items=rows.filter(r=>r.status===status);return <div key={status} className="cxp-kanban-col" onDragOver={e=>{e.preventDefault();setOver(status)}} onDragLeave={()=>setOver(null)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("rowId");if(id)onStatus(id,status);setOver(null)}} style={{outline:over===status?`2px dashed ${c.border}`:"none"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><StatusBadge status={status}/><span className="cxp-muted" style={{fontSize:10}}>{items.length}</span></div>{items.map(r=><div key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("rowId",r.id)} onClick={()=>onOpen(r)} className="cxp-kanban-card" style={{borderLeft:`3px solid ${c.border}`}}><div style={{fontSize:12,fontWeight:700,color:"#e2d0ff",marginBottom:4}}>{r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:10}}>{r.data||"Backlog"} · {REDE_ICONS[r.rede]||"📄"} {r.formato||"—"}</div>{r.checklist.length>0&&<div style={{marginTop:7}}><div className="cxp-progress"><div style={{width:`${Math.round(r.checklist.filter(i=>i.done).length/r.checklist.length*100)}%`}}/></div></div>}</div>)}</div>})}</div>;
}

// ─── Tabela / ações em massa ──────────────────────────────────────────────
function ContentTable({ rows, selected, onSelect, onSelectAll, onOpen, onUpdate, onAdapt, onRemove }: {
  rows:Row[];selected:Set<string>;onSelect:(id:string)=>void;onSelectAll:()=>void;onOpen:(r:Row)=>void;onUpdate:(id:string,key:keyof Row,val:any)=>void;onAdapt:(r:Row)=>void;onRemove:(id:string)=>void;
}) {
  return <div className="cxp-card" style={{overflowX:"auto"}}><table className="cxp-table"><thead><tr><th style={{width:38}}><input type="checkbox" checked={rows.length>0&&rows.every(r=>selected.has(r.id))} onChange={onSelectAll}/></th><th>Data</th><th>Conteúdo</th><th>Rede</th><th>Formato</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead><tbody>{rows.map(r=>{const c=STATUS_COLORS[r.status];if(r.formato===EXTRA_TIKTOK_FORMAT)return <tr key={r.id} style={{background:"linear-gradient(90deg,#160a2b,#251044)"}}><td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>onSelect(r.id)}/></td><td><input className="cxp-input" type="date" value={dateInputValue(r)} onChange={e=>onUpdate(r.id,"data",isoToBR(e.target.value))}/></td><td colSpan={5} onClick={()=>onOpen(r)} style={{cursor:"pointer",color:"#f0abfc",font:"900 11px 'Cinzel',serif"}}>🎵 VÍDEO EXTRA TIKTOK</td><td><button className="cxp-btn danger" onClick={()=>onRemove(r.id)}>✕</button></td></tr>;
    return <tr key={r.id} style={{borderLeft:`3px solid ${c.border}`}}><td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>onSelect(r.id)}/></td><td style={{minWidth:145}}><input className="cxp-input" type="date" value={dateInputValue(r)} onChange={e=>onUpdate(r.id,"data",isoToBR(e.target.value))}/></td><td onClick={()=>onOpen(r)} style={{cursor:"pointer",minWidth:220}}><div style={{fontWeight:700,fontSize:12}}>{r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:9}}>{r.hook?`Hook: ${r.hook}`:"Abrir painel completo"}</div></td><td><select className="cxp-input" value={r.rede} onChange={e=>onUpdate(r.id,"rede",e.target.value)}><option value="">—</option>{REDE_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></td><td><select className="cxp-input" value={r.formato} onChange={e=>onUpdate(r.id,"formato",e.target.value)}><option value="">—</option>{FORMATO_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></td><td><input className="cxp-input" value={r.responsavel} onChange={e=>onUpdate(r.id,"responsavel",e.target.value)} placeholder="Nome"/></td><td><select value={r.status} onChange={e=>onUpdate(r.id,"status",e.target.value)} style={{...inputStyle,background:c.bg,color:c.text,borderColor:c.border,fontFamily:"'Cinzel',serif",fontWeight:700}}>{STATUS_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></td><td><div style={{display:"flex",gap:5}}><button className="cxp-btn" onClick={()=>onAdapt(r)} title="Adaptar para outra rede">↗</button><button className="cxp-btn danger" onClick={()=>onRemove(r.id)}>✕</button></div></td></tr>})}</tbody></table>{rows.length===0&&<div style={{padding:40,textAlign:"center"}} className="cxp-muted">Nenhum conteúdo nesse filtro.</div>}</div>;
}

function MobileContentCards({ rows, selected, onSelect, onOpen, onUpdate, onAdapt, onRemove }: Parameters<typeof ContentTable>[0]) {
  return <div style={{display:"grid",gap:9}}>{rows.map(r=>{const c=STATUS_COLORS[r.status];return <div key={r.id} className="cxp-card" style={{padding:12,borderLeft:`4px solid ${c.border}`}}><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={selected.has(r.id)} onChange={()=>onSelect(r.id)}/><div onClick={()=>onOpen(r)} style={{flex:1,cursor:"pointer"}}><div style={{fontSize:12,fontWeight:700}}>{r.formato===EXTRA_TIKTOK_FORMAT?"🎵 Vídeo extra TikTok":r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:10}}>{r.data||"Sem data"} · {r.rede||"—"} · {r.formato||"—"}</div></div><StatusBadge status={r.status}/></div><div style={{display:"flex",gap:6,marginTop:10}}><select className="cxp-input" value={r.status} onChange={e=>onUpdate(r.id,"status",e.target.value)}>{STATUS_OPTIONS.map(x=><option key={x}>{x}</option>)}</select><button className="cxp-btn" onClick={()=>onAdapt(r)}>↗</button><button className="cxp-btn danger" onClick={()=>onRemove(r.id)}>✕</button></div></div>})}</div>;
}

function BulkBar({ count, onStatus, onResponsavel, onDate, onPublish, onDuplicate, onDelete, onClear }: { count:number;onStatus:(s:Status)=>void;onResponsavel:(v:string)=>void;onDate:(iso:string)=>void;onPublish:()=>void;onDuplicate:()=>void;onDelete:()=>void;onClear:()=>void }) {
  const [resp,setResp]=useState("");
  return <div className="cxp-card" style={{padding:10,display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:10,borderColor:"#7c3aed"}}><strong style={{font:"700 11px 'Cinzel',serif",color:"#c084fc"}}>{count} selecionado{count!==1?"s":""}</strong><select className="cxp-btn" defaultValue="" onChange={e=>{if(e.target.value)onStatus(e.target.value as Status);e.currentTarget.value=""}}><option value="">Mudar status…</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select><input className="cxp-input" style={{width:150}} value={resp} onChange={e=>setResp(e.target.value)} placeholder="Responsável"/><button className="cxp-btn" onClick={()=>{if(resp.trim())onResponsavel(resp.trim())}}>Aplicar</button><input className="cxp-input" style={{width:145}} type="date" onChange={e=>e.target.value&&onDate(e.target.value)}/><button className="cxp-btn green" onClick={onPublish}>✓ Publicar</button><button className="cxp-btn" onClick={onDuplicate}>Duplicar</button><button className="cxp-btn danger" onClick={onDelete}>Excluir</button><button className="cxp-btn" onClick={onClear}>Limpar</button></div>;
}

// ─── Drawer completo da postagem ──────────────────────────────────────────
function PostDrawer({ row, onClose, onUpdate, onToggleChecklist, onAdapt, onRemove }: { row:Row; onClose:()=>void; onUpdate:(id:string,key:keyof Row,val:any)=>void; onToggleChecklist:(id:string,itemId:string)=>void; onAdapt:(r:Row)=>void; onRemove:(id:string)=>void }) {
  const progress = row.checklist.length ? Math.round(row.checklist.filter(i=>i.done).length/row.checklist.length*100) : 0;
  const field = (label:string,key:keyof Row, multiline=false, placeholder="") => <div><div className="cxp-label">{label}</div>{multiline?<textarea className="cxp-input" value={String(row[key]??"")} onChange={e=>onUpdate(row.id,key,e.target.value)} placeholder={placeholder}/>:<input className="cxp-input" value={String(row[key]??"")} onChange={e=>onUpdate(row.id,key,e.target.value)} placeholder={placeholder}/>}</div>;
  return <><div className="cxp-overlay" onClick={onClose}/><aside className="cxp-drawer">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:14}}><div><div className="cxp-label">Painel da postagem</div><div className="cxp-title" style={{fontSize:18,color:"#e9d5ff"}}>{row.tema||row.postagem}</div></div><button className="cxp-btn" onClick={onClose}>✕</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}><div><div className="cxp-label">Data</div><input className="cxp-input" type="date" value={dateInputValue(row)} onChange={e=>onUpdate(row.id,"data",isoToBR(e.target.value))}/></div><div><div className="cxp-label">Status</div><select className="cxp-input" value={row.status} onChange={e=>onUpdate(row.id,"status",e.target.value)}>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></div><div><div className="cxp-label">Rede</div><select className="cxp-input" value={row.rede} onChange={e=>onUpdate(row.id,"rede",e.target.value)}><option value="">—</option>{REDE_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></div><div><div className="cxp-label">Formato</div><select className="cxp-input" value={row.formato} onChange={e=>onUpdate(row.id,"formato",e.target.value)}><option value="">—</option>{FORMATO_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></div></div>
    <div style={{display:"grid",gap:10}}>{field("Tema","tema",false,"Tema do conteúdo")}{field("Hook","hook",true,"A primeira frase / ideia que prende atenção")}{field("Roteiro / legenda","roteiro",true,"Roteiro, legenda ou copy principal")}{field("CTA","cta",true,"O que a pessoa deve fazer depois")}{field("Briefing","briefing",true,"Contexto, objetivo e direcionamento")}{field("Referências","referencias",true,"Links, ideias, referências visuais")}{field("Responsável","responsavel",false,"Nome")}{field("Arquivos","link_arquivo",true,"Links do Drive separados por vírgula")}{field("Observações","observacoes",true,"Anotações internas")}</div>
    <div className="cxp-card" style={{padding:12,marginTop:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div className="cxp-title" style={{fontSize:11,color:"#c084fc"}}>Checklist automático</div><span className="cxp-muted" style={{fontSize:10}}>{progress}%</span></div><div className="cxp-progress" style={{marginBottom:10}}><div style={{width:`${progress}%`}}/></div>{row.checklist.map(item=><label key={item.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={item.done} onChange={()=>onToggleChecklist(row.id,item.id)}/><span style={{textDecoration:item.done?"line-through":"none",color:item.done?"#6f5a95":"#e2d0ff"}}>{item.label}</span></label>)}</div>
    {row.status==="Publicado"&&<div className="cxp-card" style={{padding:12,marginTop:12}}><div className="cxp-title" style={{fontSize:11,color:"#86efac",marginBottom:10}}>Performance orgânica</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{(["views","likes","shares","saves","followers_gained"] as (keyof Row)[]).map(k=><div key={String(k)}><div className="cxp-label">{{views:"Views",likes:"Curtidas",shares:"Compart.",saves:"Salvos",followers_gained:"Seguidores"}[k as string]}</div><input className="cxp-input" type="number" min="0" value={Number(row[k]||0)} onChange={e=>onUpdate(row.id,k,Number(e.target.value))}/></div>)}</div></div>}
    <div className="cxp-card" style={{padding:12,marginTop:12}}><div className="cxp-title" style={{fontSize:11,color:"#c084fc",marginBottom:8}}>Histórico</div>{row.historico.length===0?<div className="cxp-muted" style={{fontSize:11}}>Nenhuma alteração importante registrada ainda.</div>:row.historico.slice().reverse().slice(0,30).map((h,i)=><div key={`${h.at}-${i}`} style={{borderTop:i?"1px solid #211042":"none",padding:"7px 0"}}><div style={{fontSize:11}}><strong>{h.actor}</strong> alterou {prettyField(h.field)} <span className="cxp-muted">{h.from||"—"}</span> → <span style={{color:"#c084fc"}}>{h.to||"—"}</span></div><div className="cxp-muted" style={{fontSize:9,marginTop:2}}>{humanDateTime(h.at)}</div></div>)}</div>
    <div style={{display:"flex",gap:7,marginTop:14,flexWrap:"wrap"}}><button className="cxp-btn primary" onClick={()=>onAdapt(row)}>Adaptar para outra rede</button><button className="cxp-btn danger" onClick={()=>onRemove(row.id)}>Excluir</button></div>
  </aside></>;
}

// ─── Templates / recorrência / adaptação ──────────────────────────────────
function TemplateModal({ onClose, onCreate }: { onClose:()=>void; onCreate:(t:TemplateDef)=>void }) {
  return <><div className="cxp-overlay" onClick={onClose}/><div className="cxp-modal"><SectionTitle eyebrow="Novo conteúdo">Criar a partir de modelo</SectionTitle><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:9}}>{TEMPLATES.map(t=><button key={t.id} onClick={()=>onCreate(t)} className="cxp-card" style={{padding:14,textAlign:"left",cursor:"pointer",color:"#e2d0ff"}}><div style={{fontSize:24,marginBottom:8}}>{t.icon}</div><div className="cxp-title" style={{fontSize:11,color:"#c084fc"}}>{t.label}</div><div className="cxp-muted" style={{fontSize:10,marginTop:4}}>{t.rede} · {t.formato}</div></button>)}</div><div style={{textAlign:"right",marginTop:12}}><button className="cxp-btn" onClick={onClose}>Cancelar</button></div></div></>;
}
function RecurrenceModal({ mes, onClose, onGenerate }: { mes:number;onClose:()=>void;onGenerate:(weekdays:number[],template:TemplateDef)=>void }) {
  const [days,setDays]=useState<number[]>([2,4]);
  const [templateId,setTemplateId]=useState("reels");
  const toggle=(d:number)=>setDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);
  const preset=(type:string)=>{if(type==="tt"){setTemplateId("tiktok");setDays([1,3,5])}else if(type==="daily"){setTemplateId("caixinha");setDays([0,1,2,3,4,5,6])}else{setTemplateId("reels");setDays([2,4])}};
  const template=TEMPLATES.find(t=>t.id===templateId)!;
  return <><div className="cxp-overlay" onClick={onClose}/><div className="cxp-modal"><SectionTitle eyebrow={`Recorrência · ${MONTHS[mes]}`}>Gerar calendário automático</SectionTitle><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}><button className="cxp-btn" onClick={()=>preset("twice")}>Terça + quinta</button><button className="cxp-btn" onClick={()=>preset("tt")}>3 extras TikTok / semana</button><button className="cxp-btn" onClick={()=>preset("daily")}>Story diário</button></div><div className="cxp-label">Modelo</div><select className="cxp-input" value={templateId} onChange={e=>setTemplateId(e.target.value)}>{TEMPLATES.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select><div className="cxp-label" style={{marginTop:12}}>Dias da semana</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{WEEKDAYS.map((w,i)=><button key={w} className={`cxp-chip ${days.includes(i)?"active":""}`} onClick={()=>toggle(i)}>{w}</button>)}</div><div className="cxp-muted" style={{fontSize:11,marginTop:12}}>O sistema criará uma postagem em todos os dias selecionados deste mês. Depois você pode arrastar datas normalmente.</div><div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:14}}><button className="cxp-btn" onClick={onClose}>Cancelar</button><button className="cxp-btn primary" disabled={!days.length} onClick={()=>onGenerate(days,template)}>Gerar recorrência</button></div></div></>;
}
function AdaptModal({ row, onClose, onCreate }: { row:Row;onClose:()=>void;onCreate:(network:string,format:string)=>void }) {
  const [network,setNetwork]=useState(row.rede==="TikTok"?"Instagram":"TikTok");
  const suggested=network==="YouTube"?"Shorts":network==="TikTok"?"Reels":row.formato===EXTRA_TIKTOK_FORMAT?"Reels":row.formato;
  const [format,setFormat]=useState(suggested);
  useEffect(()=>{setFormat(network==="YouTube"?"Shorts":network==="TikTok"?"Reels":row.formato===EXTRA_TIKTOK_FORMAT?"Reels":row.formato)},[network,row.formato]);
  return <><div className="cxp-overlay" onClick={onClose}/><div className="cxp-modal"><SectionTitle eyebrow="Reaproveitar conteúdo">Adaptar para outra rede</SectionTitle><div className="cxp-muted" style={{fontSize:12,marginBottom:12}}>{row.tema||row.postagem}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><div><div className="cxp-label">Rede destino</div><select className="cxp-input" value={network} onChange={e=>setNetwork(e.target.value)}>{REDE_OPTIONS.filter(r=>r!=="Todos").map(r=><option key={r}>{r}</option>)}</select></div><div><div className="cxp-label">Formato destino</div><select className="cxp-input" value={format} onChange={e=>setFormat(e.target.value)}>{FORMATO_OPTIONS.filter(f=>f!==EXTRA_TIKTOK_FORMAT).map(f=><option key={f}>{f}</option>)}</select></div></div><div className="cxp-muted" style={{fontSize:11,marginTop:12}}>Tema, hook, roteiro, arquivos e briefing serão copiados. A nova versão volta para “Ideia” com checklist novo.</div><div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:14}}><button className="cxp-btn" onClick={onClose}>Cancelar</button><button className="cxp-btn primary" onClick={()=>onCreate(network,format)}>Criar adaptação</button></div></div></>;
}

// ─── Produtividade e performance ──────────────────────────────────────────
function ProductivityView({ rows }: { rows:Row[] }) {
  const active=rows.filter(r=>r.status!=="Cancelado");
  const published=active.filter(r=>r.status==="Publicado");
  const overdue=active.filter(isOverdue);
  const onTime=published.filter(r=>{if(!r.published_at||!dateInputValue(r))return false;return new Date(r.published_at).toISOString().slice(0,10)<=dateInputValue(r)}).length;
  const onTimePct=published.length?Math.round(onTime/published.length*100):0;
  const withPerf=published.filter(r=>r.views>0);
  const engagement=(r:Row)=>r.likes+r.shares+r.saves;
  const byNetwork=REDE_OPTIONS.filter(x=>x!=="Todos").map(rede=>({label:rede,val:published.filter(r=>r.rede===rede).length})).filter(x=>x.val);
  const byFormat=FORMATO_OPTIONS.map(formato=>({label:formato,val:published.filter(r=>r.formato===formato).length})).filter(x=>x.val);
  const weekly=Array.from({length:6},(_,i)=>({label:`Sem. ${i+1}`,planned:active.filter(r=>{const iso=dateInputValue(r);return iso&&Math.floor((Number(iso.slice(8,10))-1)/7)===i}).length,published:published.filter(r=>{const iso=dateInputValue(r);return iso&&Math.floor((Number(iso.slice(8,10))-1)/7)===i}).length})).filter(x=>x.planned||x.published);
  const perfFormat=Array.from(new Set(withPerf.map(r=>r.formato))).map(formato=>{const rs=withPerf.filter(r=>r.formato===formato);return{label:formato,avg:Math.round(rs.reduce((s,r)=>s+r.views,0)/rs.length),eng:Math.round(rs.reduce((s,r)=>s+engagement(r),0)/rs.length)}}).sort((a,b)=>b.avg-a.avg);
  const perfTheme=Array.from(new Set(withPerf.map(r=>r.tema.trim()).filter(Boolean))).map(tema=>{const rs=withPerf.filter(r=>r.tema.trim()===tema);return{label:tema,avg:Math.round(rs.reduce((sum,r)=>sum+r.views,0)/rs.length),count:rs.length}}).sort((a,b)=>b.avg-a.avg).slice(0,6);
  const top=withPerf.slice().sort((a,b)=>b.views-a.views).slice(0,6);
  const maxBar=Math.max(1,...byNetwork.map(x=>x.val),...byFormat.map(x=>x.val));
  return <div><SectionTitle eyebrow="O que está saindo do papel">Produtividade editorial</SectionTitle><div className="cxp-grid-kpis" style={{marginBottom:14}}>{[["Planejados",active.length,"#c084fc"],["Publicados",published.length,"#86efac"],["No prazo",`${onTimePct}%`,"#6ee7b7"],["Atrasados",overdue.length,"#fca5a5"]].map(([l,v,c])=><div className="cxp-card cxp-kpi" key={String(l)}><div className="cxp-label">{l}</div><strong style={{color:String(c)}}>{v}</strong></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12}}><div className="cxp-card" style={{padding:14}}><div className="cxp-title" style={{fontSize:11,color:"#c084fc",marginBottom:10}}>Publicados por rede</div>{byNetwork.length?byNetwork.map(x=><div key={x.label} style={{display:"grid",gridTemplateColumns:"95px 1fr 30px",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:11}}>{REDE_ICONS[x.label]} {x.label}</span><div className="cxp-progress"><div style={{width:`${x.val/maxBar*100}%`}}/></div><span className="cxp-muted" style={{fontSize:10,textAlign:"right"}}>{x.val}</span></div>):<div className="cxp-muted" style={{fontSize:11}}>Sem publicações ainda.</div>}</div><div className="cxp-card" style={{padding:14}}><div className="cxp-title" style={{fontSize:11,color:"#c084fc",marginBottom:10}}>Publicados por formato</div>{byFormat.length?byFormat.map(x=><div key={x.label} style={{display:"grid",gridTemplateColumns:"110px 1fr 30px",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:11}}>{x.label}</span><div className="cxp-progress"><div style={{width:`${x.val/maxBar*100}%`}}/></div><span className="cxp-muted" style={{fontSize:10,textAlign:"right"}}>{x.val}</span></div>):<div className="cxp-muted" style={{fontSize:11}}>Sem dados ainda.</div>}</div><div className="cxp-card" style={{padding:14}}><div className="cxp-title" style={{fontSize:11,color:"#c084fc",marginBottom:10}}>Produção semanal</div>{weekly.length?weekly.map(x=><div key={x.label} style={{borderTop:"1px solid #211042",padding:"8px 0",display:"grid",gridTemplateColumns:"70px 1fr",gap:8}}><span style={{fontSize:10}}>{x.label}</span><span className="cxp-muted" style={{fontSize:10}}>{x.published} publicados / {x.planned} planejados</span></div>):<div className="cxp-muted" style={{fontSize:11}}>Sem conteúdo datado neste mês.</div>}</div></div><SectionTitle eyebrow="Leitura do orgânico" right={<span className="cxp-muted" style={{fontSize:10}}>{withPerf.length} posts com métricas</span>}>Performance do conteúdo</SectionTitle><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12}}><div className="cxp-card" style={{padding:14}}><div className="cxp-title" style={{fontSize:11,color:"#86efac",marginBottom:10}}>Formato x desempenho</div>{perfFormat.length?perfFormat.map(x=><div key={x.label} style={{borderTop:"1px solid #211042",padding:"8px 0",display:"flex",justifyContent:"space-between",gap:10}}><span style={{fontSize:11}}>{x.label}</span><span style={{fontSize:10,color:"#c084fc"}}>{x.avg.toLocaleString("pt-BR")} views · {x.eng.toLocaleString("pt-BR")} interações</span></div>):<div className="cxp-muted" style={{fontSize:11}}>Preencha as métricas nos posts publicados para começar a comparar formatos.</div>}</div><div className="cxp-card" style={{padding:14}}><div className="cxp-title" style={{fontSize:11,color:"#86efac",marginBottom:10}}>Top conteúdos / hooks</div>{top.length?top.map((r,i)=><div key={r.id} style={{borderTop:i?"1px solid #211042":"none",padding:"8px 0"}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span style={{fontSize:11,fontWeight:700}}>{r.tema||r.postagem}</span><span style={{fontSize:10,color:"#c084fc"}}>{r.views.toLocaleString("pt-BR")}</span></div><div className="cxp-muted" style={{fontSize:9,marginTop:2}}>{r.hook?`Hook: ${r.hook}`:`${r.formato} · ${r.rede}`}</div></div>):<div className="cxp-muted" style={{fontSize:11}}>Ainda não há métricas orgânicas suficientes.</div>}</div><div className="cxp-card" style={{padding:14}}><div className="cxp-title" style={{fontSize:11,color:"#86efac",marginBottom:10}}>Tema x desempenho</div>{perfTheme.length?perfTheme.map((x,i)=><div key={`${x.label}-${i}`} style={{borderTop:i?"1px solid #211042":"none",padding:"8px 0",display:"flex",justifyContent:"space-between",gap:10}}><span style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis"}}>{x.label}</span><span style={{fontSize:10,color:"#c084fc",whiteSpace:"nowrap"}}>{x.avg.toLocaleString("pt-BR")} views · {x.count} post{x.count!==1?"s":""}</span></div>):<div className="cxp-muted" style={{fontSize:11}}>Repita temas e preencha views para enxergar padrões reais.</div>}</div></div></div>;
}

// ─── Leads / CRM ───────────────────────────────────────────────────────────
function LeadsView({ isMobile, openNewNonce = 0 }: { isMobile:boolean; openNewNonce?:number }) {
  const [leads,setLeads]=useState<Lead[]>([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(""),[filterStatus,setFilterStatus]=useState("Todos"),[expanded,setExpanded]=useState<string|null>(null),[expandedChannel,setExpandedChannel]=useState<string|null>(null),[showNew,setShowNew]=useState(false),[newLead,setNewLead]=useState({nome:"",whatsapp_discord:"",origem:"Manual"}),[error,setError]=useState("");
  const load=()=>{setLoading(true);dbLoadLeads().then(setLeads).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
  useEffect(load,[]);
  useEffect(()=>{ if(openNewNonce>0) setShowNew(true); },[openNewNonce]);
  const patch=async(id:string,p:Partial<Lead>)=>{setLeads(prev=>prev.map(l=>l.id===id?{...l,...p}:l));try{await dbUpdateLead(id,p)}catch(e){setError((e as Error).message);load()}};
  const create=async()=>{if(!newLead.nome.trim())return;try{await dbCreateLead({...newLead,status:"Novo lead",notas:"Origem: Manual"});setNewLead({nome:"",whatsapp_discord:"",origem:"Manual"});setShowNew(false);load()}catch(e){setError((e as Error).message)}};
  const filtered=leads.filter(l=>{if(filterStatus!=="Todos"&&l.status!==filterStatus)return false;const q=search.toLowerCase();return !q||[l.nome,l.whatsapp_discord,l.sistemas_desejados,l.origem,l.utm_source,l.utm_campaign,l.influencer_codigo,l.anotacao_rapida].some(v=>v?.toLowerCase().includes(q))});
  const channelLeads=(chaves:string[])=>leads.filter(l=>{const s=sourceText(l).toLowerCase();return chaves.some(k=>s.includes(k))});
  return <div><SectionTitle eyebrow="Mini CRM" right={<button className="cxp-btn primary" onClick={()=>setShowNew(true)}>＋ Novo lead</button>}>Leads & clientes</SectionTitle>{error&&<div className="cxp-card" style={{padding:10,borderColor:"#7f1d1d",color:"#fca5a5",fontSize:11,marginBottom:10}}>{error}</div>}<div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:7,marginBottom:10}}>{LEAD_STATUS_OPTIONS.map(s=>{const c=LEAD_STATUS_COLORS[s];const n=leads.filter(l=>l.status===s).length;return <button key={s} onClick={()=>setFilterStatus(filterStatus===s?"Todos":s)} style={{background:c.bg,border:`1px solid ${filterStatus===s?"#fff":c.border}`,borderRadius:9,padding:9,cursor:"pointer",color:c.text}}><div style={{font:"900 18px 'Cinzel',serif"}}>{n}</div><div style={{font:"700 8px 'Cinzel',serif"}}>{s}</div></button>})}</div><div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(5,1fr)",gap:7,marginBottom:10}}>{LEAD_CHANNELS.map(ch=>{const items=channelLeads(ch.chaves);return <button key={ch.label} onClick={()=>setExpandedChannel(expandedChannel===ch.label?null:ch.label)} className="cxp-card" style={{padding:8,cursor:"pointer",color:"#e2d0ff"}}><img src={ch.icon} alt="" style={{width:30,height:30,objectFit:"contain"}}/><div style={{font:"900 17px 'Cinzel',serif"}}>{items.length}</div><div className="cxp-muted" style={{fontSize:8}}>{ch.label}</div></button>})}</div>{expandedChannel&&(()=>{const ch=LEAD_CHANNELS.find(x=>x.label===expandedChannel)!;const items=channelLeads(ch.chaves);return <div className="cxp-card" style={{padding:10,marginBottom:10}}><div className="cxp-label">{ch.label} · funil</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{LEAD_STATUS_OPTIONS.map(s=><span key={s} className="cxp-chip">{s}: {items.filter(l=>l.status===s).length}</span>)}</div></div>})()}<div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}><input className="cxp-input" style={{flex:1,minWidth:220}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome, contato, origem, campanha…"/><select className="cxp-input" style={{width:180}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option>Todos</option>{LEAD_STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select><button className="cxp-btn" onClick={load}>⟳</button></div>{loading?<div style={{padding:50,display:"flex",justifyContent:"center"}}><Spinner/></div>:<div style={{display:"grid",gap:8}}>{filtered.map(lead=>{const c=LEAD_STATUS_COLORS[lead.status]||LEAD_STATUS_COLORS["Novo lead"];const open=expanded===lead.id;return <div key={lead.id} className="cxp-card" style={{borderLeft:`4px solid ${c.border}`,overflow:"hidden"}}><div onClick={()=>setExpanded(open?null:lead.id)} style={{padding:11,display:"flex",gap:8,alignItems:"center",cursor:"pointer"}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700}}>{lead.nome||"—"}</div><div className="cxp-muted" style={{fontSize:10}}>{lead.whatsapp_discord||"sem contato"} · {lead.origem||lead.utm_source||"origem não informada"}</div></div><select value={lead.status} onClick={e=>e.stopPropagation()} onChange={e=>patch(lead.id,{status:e.target.value})} style={{...inputStyle,width:"auto",background:c.bg,color:c.text,borderColor:c.border,fontSize:10}}>{LEAD_STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></div>{open&&<div style={{padding:"0 11px 12px",borderTop:"1px solid #211042"}}><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:8,marginTop:10}}>{[
          ["Próxima ação","proxima_acao","text"],["Follow-up","follow_up_date","date"],["Responsável","responsavel","text"],["Último contato","ultimo_contato","date"],["Anotação rápida","anotacao_rapida","text"],["Origem","origem","text"],["UTM Source","utm_source","text"],["UTM Campaign","utm_campaign","text"],["Influencer","influencer_codigo","text"]
        ].map(([label,key,type])=><div key={key}><div className="cxp-label">{label}</div><input className="cxp-input" type={type} defaultValue={String((lead as any)[key]||"")} onBlur={e=>patch(lead.id,{[key]:e.target.value} as any)}/></div>)}</div><div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:8,marginTop:10}}>{[["Idade",lead.idade],["Tempo RPG",lead.tempo_rpg],["Sistemas",lead.sistemas_desejados],["Melhor dia",lead.melhor_dia]].map(([l,v])=><div key={l}><div className="cxp-label">{l}</div><div style={{fontSize:11}}>{v||"—"}</div></div>)}</div></div>}</div>})}</div>}{showNew&&<><div className="cxp-overlay" onClick={()=>setShowNew(false)}/><div className="cxp-modal"><SectionTitle>Novo lead manual</SectionTitle><div style={{display:"grid",gap:8}}><input className="cxp-input" placeholder="Nome" value={newLead.nome} onChange={e=>setNewLead(p=>({...p,nome:e.target.value}))}/><input className="cxp-input" placeholder="WhatsApp / Discord" value={newLead.whatsapp_discord} onChange={e=>setNewLead(p=>({...p,whatsapp_discord:e.target.value}))}/><input className="cxp-input" placeholder="Origem" value={newLead.origem} onChange={e=>setNewLead(p=>({...p,origem:e.target.value}))}/></div><div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:12}}><button className="cxp-btn" onClick={()=>setShowNew(false)}>Cancelar</button><button className="cxp-btn primary" onClick={create}>Criar</button></div></div></>}</div>;
}

// ─── Influencers ───────────────────────────────────────────────────────────
function InfluencersView({ isMobile }: { isMobile:boolean }) {
  const [influencers,setInfluencers]=useState<Influencer[]>([]),[leads,setLeads]=useState<Lead[]>([]),[loading,setLoading]=useState(true),[nome,setNome]=useState(""),[codigo,setCodigo]=useState(""),[saving,setSaving]=useState(false),[error,setError]=useState(""),[copied,setCopied]=useState<string|null>(null);
  const load=()=>{setLoading(true);Promise.all([dbLoadInfluencers(),dbLoadLeads()]).then(([i,l])=>{setInfluencers(i);setLeads(l)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))};useEffect(load,[]);
  const leadsFor=(code:string)=>leads.filter(l=>{const s=sourceText(l).toLowerCase();return l.influencer_codigo?.toLowerCase()===code.toLowerCase()||s.includes(code.toLowerCase())});
  const create=async()=>{const c=slugifyCodigo(codigo||nome);if(!nome.trim()||!c)return;setSaving(true);try{await dbCreateInfluencer(nome.trim(),c);setNome("");setCodigo("");load()}catch(e){setError((e as Error).message)}finally{setSaving(false)}};
  const ranking=[...influencers].sort((a,b)=>leadsFor(b.codigo).length-leadsFor(a.codigo).length||b.clicks-a.clicks);
  return <div><SectionTitle eyebrow="Aquisição por parceiro">Influencers & links</SectionTitle><div className="cxp-card" style={{padding:12,marginBottom:12}}><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"end"}}><div style={{flex:1,minWidth:180}}><div className="cxp-label">Nome</div><input className="cxp-input" value={nome} onChange={e=>{setNome(e.target.value);if(!codigo)setCodigo(slugifyCodigo(e.target.value))}}/></div><div style={{width:isMobile?"100%":180}}><div className="cxp-label">Código</div><input className="cxp-input" value={codigo} onChange={e=>setCodigo(slugifyCodigo(e.target.value))}/></div><button className="cxp-btn primary" disabled={saving} onClick={create}>{saving?"Criando…":"Criar link"}</button></div>{error&&<div style={{color:"#fca5a5",fontSize:11,marginTop:8}}>{error}</div>}</div>{loading?<div style={{padding:50,display:"flex",justifyContent:"center"}}><Spinner/></div>:<div style={{display:"grid",gap:9}}>{ranking.map((inf,idx)=>{const li=leadsFor(inf.codigo);const qualified=li.filter(l=>["Em contato","Lista de espera","Mesa alocada"].includes(l.status));const final=li.filter(l=>l.status==="Mesa alocada");const finalRate=inf.clicks?final.length/inf.clicks*100:0;const link=`${window.location.origin}/?ref=${inf.codigo}`;return <div key={inf.id} className="cxp-card" style={{padding:13,borderLeft:`4px solid ${inf.ativo?"#7c3aed":"#4b5563"}`,opacity:inf.ativo?1:.65}}><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{font:"900 16px 'Cinzel',serif",color:idx===0&&li.length?"#fbbf24":"#6f5a95"}}>{idx===0&&li.length?"🏆":`#${idx+1}`}</span><div style={{flex:1,fontWeight:700}}>{inf.nome}</div><button className={`cxp-btn ${inf.ativo?"green":""}`} onClick={()=>{setInfluencers(p=>p.map(x=>x.id===inf.id?{...x,ativo:!x.ativo}:x));dbUpdateInfluencer(inf.id,{ativo:!inf.ativo}).catch(()=>load())}}>{inf.ativo?"Ativo":"Pausado"}</button><button className="cxp-btn danger" onClick={async()=>{if(window.confirm(`Excluir ${inf.nome}?`)){await dbDeleteInfluencer(inf.id);load()}}}>✕</button></div><div style={{display:"flex",gap:6,marginTop:9}}><input className="cxp-input" readOnly value={link}/><button className="cxp-btn" onClick={()=>{navigator.clipboard.writeText(link);setCopied(inf.codigo);setTimeout(()=>setCopied(null),1200)}}>{copied===inf.codigo?"Copiado":"Copiar"}</button></div><div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:7,marginTop:9}}>{[["Cliques",inf.clicks,"#93c5fd"],["Leads",li.length,"#c084fc"],["Qualificados",qualified.length,"#fcd34d"],["Mesas",final.length,"#86efac"],["Conv. final",`${finalRate.toFixed(1)}%`,"#6ee7b7"]].map(([l,v,c])=><div key={String(l)} style={{background:"#0d0720",borderRadius:8,padding:8,textAlign:"center"}}><div style={{font:"900 17px 'Cinzel',serif",color:String(c)}}>{v}</div><div className="cxp-label" style={{margin:0}}>{l}</div></div>)}</div></div>})}</div>}</div>;
}

// ─── Command palette ───────────────────────────────────────────────────────
function CommandPalette({ open, onClose, onNewPost, onExtraTikTok, onToday, onLeads, onInfluencers, onOpenPost }: { open:boolean;onClose:()=>void;onNewPost:()=>void;onExtraTikTok:()=>void;onToday:()=>void;onLeads:()=>void;onInfluencers:()=>void;onOpenPost:(r:Row)=>void }) {
  const [q,setQ]=useState(""),[rows,setRows]=useState<Row[]>([]),[leads,setLeads]=useState<Lead[]>([]),[infs,setInfs]=useState<Influencer[]>([]),[loading,setLoading]=useState(false);
  useEffect(()=>{if(open){setQ("");setLoading(true);Promise.all([dbLoadAllRows(),dbLoadLeads(),dbLoadInfluencers()]).then(([r,l,i])=>{setRows(r);setLeads(l);setInfs(i)}).finally(()=>setLoading(false))}},[open]);
  useEffect(()=>{if(open)setTimeout(()=>document.getElementById("cxp-command-input")?.focus(),30)},[open]);
  if(!open)return null;
  const query=q.trim().toLowerCase();
  const postResults=query?rows.filter(r=>[r.postagem,r.tema,r.hook,r.roteiro,r.briefing,r.observacoes,r.rede,r.formato].some(v=>v?.toLowerCase().includes(query))).slice(0,7):[];
  const leadResults=query?leads.filter(l=>[l.nome,l.whatsapp_discord,l.origem,l.utm_source,l.utm_campaign,l.anotacao_rapida].some(v=>v?.toLowerCase().includes(query))).slice(0,5):[];
  const infResults=query?infs.filter(i=>[i.nome,i.codigo].some(v=>v?.toLowerCase().includes(query))).slice(0,5):[];
  const run=(fn:()=>void)=>{fn();onClose()};
  return <><div className="cxp-overlay" style={{zIndex:1199}} onClick={onClose}/><div className="cxp-command"><input id="cxp-command-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar tudo ou executar um comando…" style={{width:"100%",background:"#0d0720",border:"none",borderBottom:"1px solid #3d246f",padding:"16px",color:"#e2d0ff",outline:"none",fontSize:14}}/>{loading&&<div style={{padding:15,display:"flex",justifyContent:"center"}}><Spinner/></div>}{!query&&!loading&&<>{[["＋","Nova postagem",onNewPost],["🎵","Vídeo extra TikTok",onExtraTikTok],["☀","Ir para Central de Hoje",onToday],["👥","Novo lead / abrir CRM",onLeads],["🔗","Novo influencer",onInfluencers]].map(([icon,label,fn])=><div key={String(label)} className="cxp-command-row" onClick={()=>run(fn as ()=>void)}><span>{icon as string}</span><span style={{fontSize:12}}>{label as string}</span></div>)}</>}{query&&!loading&&<>{postResults.map(r=><div key={r.id} className="cxp-command-row" onClick={()=>run(()=>onOpenPost(r))}><span>{REDE_ICONS[r.rede]||"📄"}</span><div><div style={{fontSize:12}}>{r.tema||r.postagem}</div><div className="cxp-muted" style={{fontSize:9}}>Conteúdo · {r.data||"sem data"} · {r.formato}</div></div></div>)}{leadResults.map(l=><div key={l.id} className="cxp-command-row" onClick={()=>run(onLeads)}><span>👥</span><div><div style={{fontSize:12}}>{l.nome}</div><div className="cxp-muted" style={{fontSize:9}}>Lead · {l.whatsapp_discord||"sem contato"}</div></div></div>)}{infResults.map(i=><div key={i.id} className="cxp-command-row" onClick={()=>run(onInfluencers)}><span>🔗</span><div><div style={{fontSize:12}}>{i.nome}</div><div className="cxp-muted" style={{fontSize:9}}>Influencer · {i.codigo}</div></div></div>)}{!postResults.length&&!leadResults.length&&!infResults.length&&<div className="cxp-muted" style={{padding:18,textAlign:"center",fontSize:11}}>Nada encontrado.</div>}</>}</div></>;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard({ onVoltar }: { onVoltar:()=>void }) {
  const isMobile=useIsMobile();
  const [rows,setRows]=useState<Row[]>([]),rowsRef=useRef<Row[]>([]);
  const [centralRows,setCentralRows]=useState<Row[]>([]),[centralLeads,setCentralLeads]=useState<Lead[]>([]),[centralLoading,setCentralLoading]=useState(true);
  const [mes,setMes]=useState(new Date().getMonth()),[appTab,setAppTab]=useState<AppTab>("hoje"),[viewMode,setViewMode]=useState<ViewMode>("tabela"),[calendarScope,setCalendarScope]=useState<CalendarScope>("mes"),[weekIndex,setWeekIndex]=useState(0);
  const [filterStatus,setFilterStatus]=useState("Todos"),[filterRede,setFilterRede]=useState("Todos"),[search,setSearch]=useState("");
  const [loading,setLoading]=useState(true),[syncStatus,setSyncStatus]=useState<"ok"|"saving"|"error">("ok"),[syncError,setSyncError]=useState("");
  const [selectedPostId,setSelectedPostId]=useState<string|null>(null),[selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
  const [showTemplates,setShowTemplates]=useState(false),[showRecurrence,setShowRecurrence]=useState(false),[adaptRow,setAdaptRow]=useState<Row|null>(null),[commandOpen,setCommandOpen]=useState(false),[leadNewNonce,setLeadNewNonce]=useState(0);
  const [undo,setUndo]=useState<{rows:Row[];indexes:number[]}|null>(null);const undoTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pendingTimers=useRef<Map<string,ReturnType<typeof setTimeout>>>(new Map()),pendingPatches=useRef<Map<string,Partial<Row>>>(new Map()),savingIds=useRef<Set<string>>(new Set());

  const setRowsSafe=(fn:(prev:Row[])=>Row[])=>setRows(prev=>{const next=fn(prev);rowsRef.current=next;return next});
  const loadRows=useCallback(async(m:number,silent=false)=>{if(!silent)setLoading(true);try{const data=await dbLoad(m);setRows(prev=>{const next=data.map(sr=>(pendingTimers.current.has(sr.id)||savingIds.current.has(sr.id))?(prev.find(r=>r.id===sr.id)||sr):sr);rowsRef.current=next;return next});setSyncStatus("ok")}catch(e){setSyncError((e as Error).message);setSyncStatus("error")}finally{if(!silent)setLoading(false)}},[]);
  const loadCentral=useCallback(async()=>{setCentralLoading(true);try{const [r,l]=await Promise.all([dbLoadAllRows(),dbLoadLeads()]);setCentralRows(r);setCentralLeads(l)}catch(e){console.error(e)}finally{setCentralLoading(false)}},[]);
  useEffect(()=>{loadRows(mes);setSelectedIds(new Set())},[mes,loadRows]);
  useEffect(()=>{
    const now=new Date(), year=now.getFullYear();
    const firstDay=new Date(year,mes,1).getDay();
    setWeekIndex(now.getMonth()===mes?Math.floor((firstDay+now.getDate()-1)/7):0);
  },[mes,calendarScope]);
  useEffect(()=>{loadCentral()},[loadCentral]);
  useEffect(()=>{const t=setInterval(()=>{const tag=document.activeElement?.tagName;if(["INPUT","TEXTAREA","SELECT"].includes(tag||""))return;loadRows(mes,true)},30000);return()=>clearInterval(t)},[mes,loadRows]);
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setCommandOpen(true)}if(e.key==="Escape"){setCommandOpen(false);setSelectedPostId(null)}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[]);

  const persist=useCallback(async(id:string,patch:Partial<Row>)=>{savingIds.current.add(id);setSyncStatus("saving");setSyncError("");try{await dbPatch(id,patch);setSyncStatus("ok")}catch(e){setSyncStatus("error");setSyncError((e as Error).message);throw e}finally{savingIds.current.delete(id)}},[]);
  const schedule=useCallback((id:string,patch:Partial<Row>,immediate=false)=>{pendingPatches.current.set(id,{...(pendingPatches.current.get(id)||{}),...patch});const old=pendingTimers.current.get(id);if(old)clearTimeout(old);const flush=async()=>{const p=pendingPatches.current.get(id);pendingPatches.current.delete(id);pendingTimers.current.delete(id);if(p)try{await persist(id,p)}catch{}};if(immediate){void flush()}else{setSyncStatus("saving");pendingTimers.current.set(id,setTimeout(()=>void flush(),650))}},[persist]);

  const updateRow=(id:string,key:keyof Row,val:any)=>{const current=rowsRef.current.find(r=>r.id===id);if(!current)return;const patch:Partial<Row>={[key]:val} as any;const historyKeys=(['status','data','rede','formato','responsavel'] as (keyof Row)[]);if(key==="data"){const iso=brToISO(String(val));patch.data_iso=iso;patch.mes=iso?Number(iso.slice(5,7))-1:current.mes}if(key==="formato"&&String(val)!==current.formato){patch.checklist=makeChecklist(String(val))}if(key==="status"&&val==="Publicado"&&current.status!=="Publicado"){patch.published_at=new Date().toISOString()}if(historyKeys.includes(key)&&String((current as any)[key]??"")!==String(val??"")){patch.historico=[...current.historico,makeHistory(String(key),(current as any)[key],val)]}setRowsSafe(prev=>prev.map(r=>r.id===id?{...r,...patch}:r));const immediate=['status','rede','formato','data','checklist','published_at'].includes(String(key));schedule(id,patch,immediate)};
  const patchMany=async(ids:string[],patcher:(r:Row)=>Partial<Row>)=>{for(const id of ids){const r=rowsRef.current.find(x=>x.id===id);if(!r)continue;const patch=patcher(r);setRowsSafe(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));schedule(id,patch,true)}};
  const addAndOpen=async(partial:Partial<Row>={},dateISO="")=>{const row=makeRow(rowsRef.current.length+1,mes,dateISO,partial);setRowsSafe(p=>[...p,row]);setSyncStatus("saving");try{await dbUpsert(row);setSyncStatus("ok")}catch(e){setSyncStatus("error");setSyncError((e as Error).message)}setSelectedPostId(row.id);return row};
  const createTemplate=async(t:TemplateDef)=>{setShowTemplates(false);await addAndOpen({postagem:t.label,tema:t.tema,rede:t.rede,formato:t.formato,checklist:makeChecklist(t.formato)})};
  const createExtraTikTok=async(date=todayISO())=>addAndOpen({postagem:EXTRA_TIKTOK_FORMAT,tema:EXTRA_TIKTOK_FORMAT,rede:"TikTok",formato:EXTRA_TIKTOK_FORMAT,checklist:makeChecklist(EXTRA_TIKTOK_FORMAT)},date);
  const generateRecurrence=async(days:number[],t:TemplateDef)=>{const year=new Date().getFullYear(),n=new Date(year,mes+1,0).getDate();const created:Row[]=[];for(let d=1;d<=n;d++){const dt=new Date(year,mes,d);if(days.includes(dt.getDay())){const iso=`${year}-${pad(mes+1)}-${pad(d)}`;created.push(makeRow(rowsRef.current.length+created.length+1,mes,iso,{postagem:t.label,tema:t.tema,rede:t.rede,formato:t.formato,checklist:makeChecklist(t.formato)}))}}setRowsSafe(p=>[...p,...created]);setShowRecurrence(false);setSyncStatus("saving");try{await dbUpsertMany(created);setSyncStatus("ok")}catch(e){setSyncStatus("error");setSyncError((e as Error).message)}};
  const adapt=async(source:Row,network:string,format:string)=>{const row=makeRow(rowsRef.current.length+1,mes,"",{...source,id:undefined as any,postagem:`${source.postagem} · ${network}`,rede:network,formato:format,status:"Ideia",checklist:makeChecklist(format),historico:[makeHistory("adaptação",source.rede,network)],published_at:null,views:0,likes:0,shares:0,saves:0,followers_gained:0});setRowsSafe(p=>{const i=p.findIndex(r=>r.id===source.id);const next=[...p];next.splice(i+1,0,row);return next});setAdaptRow(null);await dbUpsert(row);setSelectedPostId(row.id)};
  const movePost=(id:string,iso:string)=>updateRow(id,"data",isoToBR(iso));
  const toggleChecklist=(id:string,itemId:string)=>{const r=rowsRef.current.find(x=>x.id===id);if(!r)return;const next=r.checklist.map(i=>i.id===itemId?{...i,done:!i.done}:i);const patch:Partial<Row>={checklist:next,historico:[...r.historico,makeHistory("checklist",`${r.checklist.filter(i=>i.done).length}/${r.checklist.length}`,`${next.filter(i=>i.done).length}/${next.length}`)]};setRowsSafe(p=>p.map(x=>x.id===id?{...x,...patch}:x));schedule(id,patch,true)};
  const finalizeUndo=async()=>{if(!undo)return;const ids=undo.rows.map(r=>r.id);setUndo(null);if(undoTimer.current){clearTimeout(undoTimer.current);undoTimer.current=null}for(const id of ids)try{await dbDelete(id)}catch(e){setSyncError((e as Error).message);setSyncStatus("error")}};
  const removeRows=(ids:string[])=>{if(undo)void finalizeUndo();const current=rowsRef.current;const pack=ids.map(id=>({row:current.find(r=>r.id===id),index:current.findIndex(r=>r.id===id)})).filter(x=>x.row) as {row:Row;index:number}[];pack.forEach(x=>{const t=pendingTimers.current.get(x.row.id);if(t)clearTimeout(t);pendingTimers.current.delete(x.row.id);pendingPatches.current.delete(x.row.id)});setRowsSafe(p=>p.filter(r=>!ids.includes(r.id)));setSelectedIds(new Set());setSelectedPostId(p=>p&&ids.includes(p)?null:p);setUndo({rows:pack.map(x=>x.row),indexes:pack.map(x=>x.index)});undoTimer.current=setTimeout(()=>{pack.forEach(x=>dbDelete(x.row.id).catch(e=>{setSyncError((e as Error).message);setSyncStatus("error")}));setUndo(null)},6500)};
  const undoDelete=()=>{if(!undo)return;if(undoTimer.current)clearTimeout(undoTimer.current);const items=undo.rows.map((row,i)=>({row,index:undo.indexes[i]})).sort((a,b)=>a.index-b.index);setRowsSafe(prev=>{const next=[...prev];items.forEach(({row,index})=>next.splice(Math.min(index,next.length),0,row));return next});setUndo(null)};

  const filtered=rows.filter(r=>{if(filterStatus!=="Todos"&&r.status!==filterStatus)return false;if(filterRede!=="Todos"&&r.rede!==filterRede&&r.rede!=="Todos")return false;const q=search.toLowerCase();return !q||[r.postagem,r.tema,r.hook,r.roteiro,r.responsavel,r.formato,r.rede].some(v=>v?.toLowerCase().includes(q))}).sort((a,b)=>{const da=dateInputValue(a),db=dateInputValue(b);if(!da&&!db)return 0;if(!da)return 1;if(!db)return-1;return da.localeCompare(db)});
  const selectedPost=rows.find(r=>r.id===selectedPostId)||null;
  const syncColor=syncStatus==="error"?"#f87171":syncStatus==="saving"?"#c084fc":"#6ee7b7";
  const openExternalPost=(r:Row)=>{if(r.mes!==mes)setMes(r.mes);setAppTab("conteudo");setSelectedPostId(r.id)};
  const nav:[AppTab,string,string][]=[["hoje","☀","Hoje"],["conteudo","📅","Conteúdo"],["produtividade","📈","Produtividade"],["leads","👥","Leads"],["influencers","🔗","Influencers"]];
  const selectedArray=[...selectedIds];

  return <div className="cxp-shell"><div className="cxp-wrap"><header style={{display:"flex",alignItems:"center",gap:12,paddingBottom:12,borderBottom:"1px solid #3d246f",marginBottom:14,flexWrap:"wrap"}}><img src="/icons/criandoxp.png" alt="Criando XP" style={{width:52,height:52,objectFit:"contain"}}/><div style={{flex:1,minWidth:170}}><div className="cxp-title" style={{fontSize:20,color:"#e9d5ff"}}>Criando XP</div><div className="cxp-muted" style={{font:"700 8px 'Cinzel',serif",letterSpacing:2}}>CENTRAL OPERACIONAL DE CONTEÚDO</div></div><span title={syncError||undefined} style={{fontSize:10,color:syncColor,animation:syncStatus==="saving"?"blink 1s infinite":"none"}}>{syncStatus==="saving"?"Salvando…":syncStatus==="error"?"⚠ Erro":"✓ Sync"}</span><button className="cxp-btn" onClick={()=>setCommandOpen(true)}>⌘K Buscar</button><button className="cxp-btn primary" onClick={()=>setCommandOpen(true)}>＋</button><button className="cxp-btn" onClick={onVoltar}>Sair</button></header><div className="cxp-nav" style={{marginBottom:15}}>{nav.map(([tab,icon,label])=><button key={tab} onClick={()=>setAppTab(tab)} className={`cxp-btn ${appTab===tab?"primary":""}`}>{icon} {!isMobile&&label}</button>)}</div>

  {appTab==="hoje"&&<TodayCenter rows={centralRows} leads={centralLeads} loading={centralLoading} onOpenPost={openExternalPost} onGoContent={()=>setAppTab("conteudo")} onGoLeads={()=>setAppTab("leads")}/>} 
  {appTab==="conteudo"&&<div><SectionTitle eyebrow="Planejamento editorial" right={<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button className="cxp-btn" onClick={()=>setShowTemplates(true)}>Modelos</button><button className="cxp-btn" onClick={()=>setShowRecurrence(true)}>Recorrência</button><button className="cxp-btn primary" onClick={()=>void addAndOpen()}>＋ Postagem</button><button className="cxp-btn" onClick={()=>void createExtraTikTok("")}>🎵 Extra TikTok</button></div>}>Conteúdo · {MONTHS[mes]}</SectionTitle><div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}><select className="cxp-input" style={{width:isMobile?"100%":150}} value={mes} onChange={e=>setMes(Number(e.target.value))}>{MONTHS.map((m,i)=><option value={i} key={m}>{m}</option>)}</select><input className="cxp-input" style={{flex:1,minWidth:190}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tema, hook, responsável…"/><select className="cxp-input" style={{width:160}} value={filterRede} onChange={e=>setFilterRede(e.target.value)}><option>Todos</option>{REDE_OPTIONS.filter(r=>r!=="Todos").map(r=><option key={r}>{r}</option>)}</select><select className="cxp-input" style={{width:160}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option>Todos</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select><button className="cxp-btn" onClick={()=>loadRows(mes)}>⟳</button></div><div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>{(["tabela","calendario","kanban"] as ViewMode[]).map(v=><button key={v} className={`cxp-chip ${viewMode===v?"active":""}`} onClick={()=>setViewMode(v)}>{v==="tabela"?"≡ Tabela":v==="calendario"?"🗓 Calendário":"▥ Kanban"}</button>)}{viewMode==="calendario"&&<>{(["mes","semana"] as CalendarScope[]).map(v=><button key={v} className={`cxp-chip ${calendarScope===v?"active":""}`} onClick={()=>setCalendarScope(v)}>{v==="mes"?"Mês":"Semana"}</button>)}</>}</div>{viewMode==="calendario"&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}><span className="cxp-muted" style={{fontSize:10,alignSelf:"center",marginRight:2}}>Rede rápida:</span><button className={`cxp-chip ${filterRede==="Todos"?"active":""}`} onClick={()=>setFilterRede("Todos")}>Todas</button>{REDE_OPTIONS.filter(r=>r!=="Todos").map(r=><button key={r} className={`cxp-chip ${filterRede===r?"active":""}`} onClick={()=>setFilterRede(r)}>{REDE_ICONS[r]} {r}</button>)}</div>}{selectedIds.size>0&&<BulkBar count={selectedIds.size} onStatus={s=>void patchMany(selectedArray,r=>({status:s,historico:[...r.historico,makeHistory("status",r.status,s)],...(s==="Publicado"&&r.status!=="Publicado"?{published_at:new Date().toISOString()}:{})}))} onResponsavel={v=>void patchMany(selectedArray,r=>({responsavel:v,historico:[...r.historico,makeHistory("responsavel",r.responsavel,v)]}))} onDate={iso=>void patchMany(selectedArray,r=>({data:isoToBR(iso),data_iso:iso,mes:Number(iso.slice(5,7))-1,historico:[...r.historico,makeHistory("data",r.data,isoToBR(iso))]}))} onPublish={()=>void patchMany(selectedArray,r=>({status:"Publicado",published_at:r.published_at||new Date().toISOString(),historico:[...r.historico,makeHistory("status",r.status,"Publicado")]}))} onDuplicate={async()=>{const copies=selectedArray.map(id=>rowsRef.current.find(r=>r.id===id)).filter(Boolean).map((r:any)=>makeRow(rowsRef.current.length+1,mes,"",{...r,postagem:`${r.postagem} (cópia)`,status:"Ideia",published_at:null,views:0,likes:0,shares:0,saves:0,followers_gained:0,historico:[makeHistory("duplicação",r.id,"nova cópia")]}));setRowsSafe(p=>[...p,...copies]);await dbUpsertMany(copies);setSelectedIds(new Set())}} onDelete={()=>removeRows(selectedArray)} onClear={()=>setSelectedIds(new Set())}/>} {loading?<div style={{padding:60,display:"flex",justifyContent:"center"}}><Spinner/></div>:viewMode==="tabela"?(isMobile?<MobileContentCards rows={filtered} selected={selectedIds} onSelect={id=>setSelectedIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})} onSelectAll={()=>{}} onOpen={r=>setSelectedPostId(r.id)} onUpdate={updateRow} onAdapt={setAdaptRow} onRemove={id=>removeRows([id])}/>:<ContentTable rows={filtered} selected={selectedIds} onSelect={id=>setSelectedIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})} onSelectAll={()=>setSelectedIds(p=>filtered.length&&filtered.every(r=>p.has(r.id))?new Set():new Set(filtered.map(r=>r.id)))} onOpen={r=>setSelectedPostId(r.id)} onUpdate={updateRow} onAdapt={setAdaptRow} onRemove={id=>removeRows([id])}/>):viewMode==="kanban"?<KanbanView rows={filtered} onOpen={r=>setSelectedPostId(r.id)} onStatus={(id,s)=>updateRow(id,"status",s)}/>:<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"240px 1fr",gap:10,alignItems:"start"}}>{!isMobile&&<Backlog rows={rows} onOpen={r=>setSelectedPostId(r.id)} onAdd={()=>void addAndOpen()}/>}<div className="cxp-card" style={{padding:10}}><CalendarBoard rows={filtered} mes={mes} scope={calendarScope} weekIndex={weekIndex} onWeekIndex={setWeekIndex} onMovePost={movePost} onOpen={r=>setSelectedPostId(r.id)} onCreateForDay={iso=>void addAndOpen({},iso)}/></div>{isMobile&&<Backlog rows={rows} onOpen={r=>setSelectedPostId(r.id)} onAdd={()=>void addAndOpen()}/>}</div>}</div>}
  {appTab==="produtividade"&&<><div style={{display:"flex",gap:7,marginBottom:10}}><select className="cxp-input" style={{width:160}} value={mes} onChange={e=>setMes(Number(e.target.value))}>{MONTHS.map((m,i)=><option value={i} key={m}>{m}</option>)}</select></div><ProductivityView rows={rows}/></>}
  {appTab==="leads"&&<LeadsView isMobile={isMobile} openNewNonce={leadNewNonce}/>} {appTab==="influencers"&&<InfluencersView isMobile={isMobile}/>} 
  </div>{selectedPost&&<PostDrawer row={selectedPost} onClose={()=>setSelectedPostId(null)} onUpdate={updateRow} onToggleChecklist={toggleChecklist} onAdapt={setAdaptRow} onRemove={id=>removeRows([id])}/>} {showTemplates&&<TemplateModal onClose={()=>setShowTemplates(false)} onCreate={createTemplate}/>} {showRecurrence&&<RecurrenceModal mes={mes} onClose={()=>setShowRecurrence(false)} onGenerate={generateRecurrence}/>} {adaptRow&&<AdaptModal row={adaptRow} onClose={()=>setAdaptRow(null)} onCreate={(network,format)=>void adapt(adaptRow,network,format)}/>} {undo&&<div className="cxp-toast"><span>{undo.rows.length===1?"Postagem excluída":`${undo.rows.length} postagens excluídas`}</span><button className="cxp-btn" onClick={undoDelete}>DESFAZER</button></div>} <CommandPalette open={commandOpen} onClose={()=>setCommandOpen(false)} onNewPost={()=>void addAndOpen()} onExtraTikTok={()=>void createExtraTikTok(todayISO())} onToday={()=>setAppTab("hoje")} onLeads={()=>{setAppTab("leads");setLeadNewNonce(n=>n+1)}} onInfluencers={()=>setAppTab("influencers")} onOpenPost={openExternalPost}/></div>;
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page,setPage]=useState<AppPage>("landing"),[autenticado,setAutenticado]=useState(false),[checando,setChecando]=useState(true),[senha,setSenha]=useState(""),[erro,setErro]=useState(""),[entrando,setEntrando]=useState(false);
  const EMAIL_LOGIN="giovannihilario@hotmail.com";
  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{setAutenticado(!!session);setChecando(false)});const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>setAutenticado(!!session));return()=>subscription.unsubscribe()},[]);
  const entrar=async()=>{setEntrando(true);setErro("");const{error}=await supabase.auth.signInWithPassword({email:EMAIL_LOGIN,password:senha});setEntrando(false);if(error)setErro("Email ou senha incorretos.")};
  const sair=async()=>{await supabase.auth.signOut();setPage("landing")};
  if(checando)return null;
  const login=<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0d0720,#1a0d3a)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{width:"min(360px,100%)",background:"#100722",border:"1px solid #4a2a8a",borderRadius:16,padding:28,textAlign:"center"}}><img src="/icons/criandoxp.png" alt="" style={{width:64,height:64,objectFit:"contain",marginBottom:12}}/><div style={{font:"900 17px 'Cinzel',serif",color:"#c084fc",marginBottom:6}}>Área Restrita</div><div style={{font:"12px 'Lato',sans-serif",color:"#6f5a95",marginBottom:18}}>Criando XP · Central Operacional</div><input type="password" value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrar()} placeholder="Senha" style={{...inputStyle,padding:12,fontSize:14}}/>{erro&&<div style={{color:"#fca5a5",fontSize:11,marginTop:7}}>{erro}</div>}<button onClick={entrar} disabled={entrando} style={{width:"100%",marginTop:10,background:"linear-gradient(135deg,#6d28d9,#9333ea)",color:"#fff",border:0,borderRadius:9,padding:12,font:"700 12px 'Cinzel',serif",cursor:"pointer",opacity:entrando?.6:1}}>{entrando?"Entrando…":"Entrar"}</button></div></div>;
  return <><style>{GLOBAL_CSS}</style>{page==="landing"?<LandingPage onAbrirDashboard={()=>setPage("dashboard")}/>:autenticado?<Dashboard onVoltar={sair}/>:login}</>;
}
