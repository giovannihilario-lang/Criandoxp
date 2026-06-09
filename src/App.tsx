import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import LandingPage from "./LandingPage";
import mayoouImg from "../public/icons/mayoou.png";

// ─── Supabase ──────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://zovgkatndrgzxocwpdjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";
const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};
const TABLE = `${SUPABASE_URL}/rest/v1/postagens`;

// ─── Constantes ────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const STATUS_OPTIONS = ["Planejado","Em produção","Agendado","Publicado","Cancelado"] as const;
const FORMATO_OPTIONS = ["Post","Reels","Story","Carrossel","Live","Shorts","Thread"];
const REDE_OPTIONS = ["Instagram","TikTok","YouTube","Twitter/X","Facebook","Todos"];
type Status = typeof STATUS_OPTIONS[number];
type ViewMode = "tabela" | "calendario";
type AppTab = "calendario" | "trafego" | "leads";
type AppPage = "landing" | "dashboard";

const REDE_ICONS: Record<string, string> = {
  "Instagram": "📸",
  "TikTok":    "🎵",
  "YouTube":   "▶️",
  "Twitter/X": "𝕏",
  "Facebook":  "👤",
  "Todos":     "🌐",
};

const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string; rowBg: string; calBg: string }> = {
  "Planejado":    { bg: "#3d2068", text: "#c9a0f5", border: "#6b3fa0", rowBg: "rgba(61,32,104,0.18)",  calBg: "#3d2068dd" },
  "Em produção":  { bg: "#2a1a5e", text: "#93c5fd", border: "#3b5bdb", rowBg: "rgba(42,26,94,0.22)",   calBg: "#2a1a5edd" },
  "Agendado":     { bg: "#1e3a5f", text: "#6ee7b7", border: "#059669", rowBg: "rgba(30,58,95,0.22)",   calBg: "#1e3a5fdd" },
  "Publicado":    { bg: "#1a3a1a", text: "#86efac", border: "#16a34a", rowBg: "rgba(26,58,26,0.22)",   calBg: "#1a3a1add" },
  "Cancelado":    { bg: "#3a1a1a", text: "#fca5a5", border: "#dc2626", rowBg: "rgba(58,26,26,0.22)",   calBg: "#3a1a1add" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [d, m, y] = dateStr.split("/");
  if (!d || !m || !y) return null;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return isNaN(date.getTime()) ? null : date;
}

type Urgency = "hoje" | "amanha" | "em2" | "em3" | null;

function getUrgency(dateStr: string, status: Status): Urgency {
  if (status === "Publicado" || status === "Cancelado") return null;
  const date = parseDateBR(dateStr);
  if (!date) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanha";
  if (diff === 2) return "em2";
  if (diff === 3) return "em3";
  return null;
}

const URGENCY_STYLES: Record<NonNullable<Urgency>, { border: string; rowBg: string; badge: string; badgeBg: string; badgeColor: string; anim: string }> = {
  hoje:   { border: "#ef4444", rowBg: "rgba(239,68,68,0.13)",   badge: "HOJE",   badgeBg: "#ef4444", badgeColor: "#fff",    anim: "pulse-red 1s ease-in-out infinite" },
  amanha: { border: "#f59e0b", rowBg: "rgba(245,158,11,0.12)",  badge: "AMANHÃ", badgeBg: "#f59e0b", badgeColor: "#1a0d3a", anim: "pulse-yellow 1.5s ease-in-out infinite" },
  em2:    { border: "#fcd34d", rowBg: "rgba(252,211,77,0.08)",  badge: "2 DIAS", badgeBg: "#fcd34d", badgeColor: "#1a0d3a", anim: "none" },
  em3:    { border: "#6ee7b7", rowBg: "rgba(110,231,183,0.07)", badge: "3 DIAS", badgeBg: "#059669", badgeColor: "#fff",    anim: "none" },
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface Row {
  id: string;
  postagem: string;
  data: string;
  tema: string;
  briefing: string;
  formato: string;
  rede: string;
  responsavel: string;
  status: Status;
  observacoes: string;
  mes: number;
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
}

interface ColDef {
  key: keyof Row;
  label: string;
  width: number;
  type: "text" | "select" | "select-simple";
  options?: readonly string[];
  placeholder?: string;
  wide?: boolean;
}

const COLS: ColDef[] = [
  { key: "postagem",    label: "Postagem",     width: 90,  type: "text",          placeholder: "Postagem" },
  { key: "data",        label: "📅 Data",       width: 110, type: "text",          placeholder: "dd/mm/aaaa" },
  { key: "rede",        label: "🌐 Rede",        width: 110, type: "select-simple", options: REDE_OPTIONS },
  { key: "formato",     label: "🎞 Formato",     width: 110, type: "select-simple", options: FORMATO_OPTIONS },
  { key: "tema",        label: "✨ Tema",         width: 160, type: "text",          placeholder: "Título / tema", wide: true },
  { key: "responsavel", label: "👤 Responsável", width: 120, type: "text",          placeholder: "Nome" },
  { key: "status",      label: "🔮 Status",      width: 130, type: "select",        options: STATUS_OPTIONS },
];

const makeRow = (n: number, mes: number): Row => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  postagem: `Postagem ${n}`, data: "", tema: "", briefing: "",
  formato: "", rede: "", responsavel: "", status: "Planejado",
  observacoes: "", mes,
});

// ─── Supabase ops ──────────────────────────────────────────────────────────
async function dbLoad(mes: number): Promise<Row[]> {
  const res = await fetch(`${TABLE}?select=*`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
  const all: Row[] = await res.json();
  return all.filter(r => {
    const d = parseDateBR(r.data);
    return d ? d.getMonth() === mes : r.mes === mes;
  });
}

async function dbUpsert(row: Row): Promise<void> {
  const res = await fetch(`${TABLE}?on_conflict=id`, {
    method: "POST",
    headers: { ...HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function dbDelete(id: string): Promise<void> {
  await fetch(`${TABLE}?id=eq.${id}`, {
    method: "DELETE",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
  });
}

async function dbLoadLeads(): Promise<Lead[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/clientes?select=*&order=created_at.desc`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbUpdateLeadStatus(id: string, status: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ status }),
  });
}

// ─── Hook responsivo ───────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

// ─── CSS global ───────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0d0720; }
  ::-webkit-scrollbar-thumb { background: #4a2a8a; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
  @keyframes float        { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes glow         { 0%,100%{box-shadow:0 0 20px #7c3aed44} 50%{box-shadow:0 0 40px #7c3aed88} }
  @keyframes blink        { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin         { to{transform:rotate(360deg)} }
  @keyframes pulse-red    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 4px rgba(239,68,68,0)} }
  @keyframes pulse-yellow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)} 50%{box-shadow:0 0 0 4px rgba(245,158,11,0)} }
  @keyframes shimmer      { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes fadeUp       { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gridPulse    { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
  @keyframes popIn        { 0%{transform:scale(0.85);opacity:0} 100%{transform:scale(1);opacity:1} }
  input::placeholder { color: #5a3a8a; }
  select, button, input { -webkit-tap-highlight-color: transparent; }
`;

// ─── EditableCell ──────────────────────────────────────────────────────────
function EditableCell({ value, onChange, type = "text", options, placeholder, wide, urgency }: {
  value: string; onChange: (v: string) => void;
  type?: "text" | "select" | "select-simple";
  options?: readonly string[]; placeholder?: string; wide?: boolean; urgency?: Urgency;
}) {
  const [editing, setEditing] = useState(false);

  if (type === "select") {
    const c = STATUS_COLORS[value as Status] ?? { bg: "#2d1b69", text: "#c9a0f5", border: "#6b3fa0" };
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 13, fontFamily: "'Cinzel', serif", fontWeight: 700, cursor: "pointer", width: "100%", outline: "none" }}>
        {options!.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === "select-simple") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a", borderRadius: 6, padding: "6px", fontSize: 13, fontFamily: "'Cinzel', serif", cursor: "pointer", width: "100%", outline: "none" }}>
        <option value="">--</option>
        {options!.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  const us = urgency ? URGENCY_STYLES[urgency] : null;
  return editing ? (
    <textarea autoFocus value={value} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)} placeholder={placeholder}
      style={{ width: "100%", minHeight: wide ? 60 : 36, background: "#1a0d3a", color: "#e2d0ff", border: "1px solid #7c3aed", borderRadius: 6, padding: "6px 8px", fontSize: 13, fontFamily: "'Lato', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
  ) : (
    <div onClick={() => setEditing(true)}
    style={{ minHeight: 32, padding: "6px", color: value ? "#e2d0ff" : "#5a3a8a", fontSize: 13, fontFamily: "'Lato', sans-serif", cursor: "text", borderRadius: 4, whiteSpace: "normal", overflow: "hidden", wordBreak: "break-word" }}      onMouseEnter={e => (e.currentTarget.style.background = "#2d1b69")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {value || <span style={{ fontStyle: "italic", opacity: 0.4 }}>{placeholder ?? "—"}</span>}
      {us && <span style={{ display: "inline-block", marginLeft: 6, background: us.badgeBg, color: us.badgeColor, fontSize: 9, fontWeight: 700, fontFamily: "'Cinzel', serif", borderRadius: 4, padding: "1px 5px", letterSpacing: 1, animation: us.anim, verticalAlign: "middle" }}>{us.badge}</span>}
    </div>
  );
}

// ─── CalendarView ──────────────────────────────────────────────────────────
function CalendarView({ rows, mes, onSelectDay, isMobile, onMovePost }: {
  rows: Row[];
  mes: number;
  onSelectDay: (rows: Row[], day: number) => void;
  isMobile: boolean;
  onMovePost: (rowId: string, newDateStr: string) => void;
}) {
  const year = new Date().getFullYear();
  const firstDay = new Date(year, mes, 1).getDay();
  const daysInMonth = new Date(year, mes + 1, 0).getDate();
  const today = new Date();
  const todayDay = (today.getMonth() === mes && today.getFullYear() === year) ? today.getDate() : -1;

  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const byDay: Record<number, Row[]> = {};
  rows.forEach(r => {
    const d = parseDateBR(r.data);
    if (d && d.getMonth() === mes && d.getFullYear() === year) {
      const day = d.getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(r);
    }
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 2 : 4, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", padding: "6px 0", fontFamily: "'Cinzel', serif", fontSize: isMobile ? 8 : 10, color: "#7c3aed", fontWeight: 700 }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 2 : 4 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} style={{ minHeight: isMobile ? 54 : 80 }} />;
          const dayRows = byDay[day] ?? [];
          const isToday = day === todayDay;
          const isDragOver = dragOverDay === day;
          const hasUrgent = dayRows.some(r => { const u = getUrgency(r.data, r.status); return u === "hoje" || u === "amanha"; });

          return (
            <div
              key={day}
              onDragOver={e => { e.preventDefault(); setDragOverDay(day); }}
              onDragLeave={() => setDragOverDay(null)}
              onDrop={e => {
                e.preventDefault();
                const id = e.dataTransfer.getData("rowId");
                if (id) {
                  const newDate = `${pad(day)}/${pad(mes + 1)}/${year}`;
                  onMovePost(id, newDate);
                }
                setDragOverDay(null);
              }}
              onClick={() => dayRows.length > 0 && onSelectDay(dayRows, day)}
              style={{
                minHeight: isMobile ? 54 : 80,
                background: isDragOver
                  ? "linear-gradient(135deg,#4a2a8a55,#7c3aed44)"
                  : isToday
                    ? "linear-gradient(135deg,#3d1b8a55,#7c3aed33)"
                    : "#110828",
                border: isDragOver
                  ? "2px dashed #c084fc"
                  : isToday
                    ? "2px solid #7c3aed"
                    : hasUrgent
                      ? "1px solid #ef4444"
                      : "1px solid #2d1b69",
                borderRadius: isMobile ? 5 : 8,
                padding: isMobile ? "4px 3px" : "6px",
                cursor: dayRows.length > 0 ? "pointer" : "default",
                position: "relative",
                overflow: "hidden",
                transition: "border 0.15s, background 0.15s",
              }}
            >
              {hasUrgent && (
                <span style={{ position: "absolute", top: 3, right: 3, width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse-red 1s ease-in-out infinite", display: "block" }} />
              )}
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: isToday ? (isMobile ? 12 : 13) : (isMobile ? 10 : 11), fontWeight: isToday ? 900 : 400, color: isToday ? "#c084fc" : "#5a3a8a", marginBottom: 2 }}>{day}</div>

              {!isMobile && dayRows.slice(0, 3).map(r => {
                const sc = STATUS_COLORS[r.status];
                return (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData("rowId", r.id);
                      e.stopPropagation();
                      setDraggingId(r.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    style={{
                      background: sc.calBg,
                      border: `1px solid ${sc.border}`,
                      borderRadius: 4,
                      padding: "2px 4px",
                      marginBottom: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      cursor: "grab",
                      opacity: draggingId === r.id ? 0.4 : 1,
                      transition: "opacity 0.15s",
                      userSelect: "none",
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <span style={{ fontSize: 8 }}>{REDE_ICONS[r.rede] || "📄"}</span>
                    <span style={{ fontSize: 9, color: sc.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.tema || r.postagem}</span>
                  </div>
                );
              })}

              {!isMobile && dayRows.length > 3 && (
                <div style={{ fontSize: 9, color: "#7c3aed", textAlign: "center" }}>+{dayRows.length - 3}</div>
              )}

              {isMobile && dayRows.length > 0 && (
                <div style={{ display: "flex", gap: 1, flexWrap: "wrap", marginTop: 2 }}>
                  {dayRows.slice(0, 3).map(r => (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData("rowId", r.id); setDraggingId(r.id); }}
                      onDragEnd={() => setDraggingId(null)}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[r.status].border, cursor: "grab", opacity: draggingId === r.id ? 0.4 : 1 }}
                    />
                  ))}
                  {dayRows.length > 3 && <span style={{ fontSize: 7, color: "#7c3aed" }}>+{dayRows.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DayPanel ──────────────────────────────────────────────────────────────
function DayPanel({ day, mes, rows, onClose, isMobile }: { day: number; mes: number; rows: Row[]; onClose: () => void; isMobile: boolean }) {
  return (
    <div style={{ marginTop: 16, background: "linear-gradient(135deg,#1a0d3a,#2d1b69)", border: "1px solid #4a2a8a", borderRadius: 14, padding: isMobile ? "14px 12px" : "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 12 : 14, fontWeight: 700, color: "#c084fc" }}>
          📅 {day} de {MONTHS[mes]} — {rows.length} postagem{rows.length !== 1 ? "s" : ""}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "1px solid #4a2a8a", borderRadius: 6, color: "#5a3a8a", cursor: "pointer", padding: "6px 12px", fontFamily: "'Cinzel', serif", fontSize: 12 }}>✕</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(r => {
          const sc = STATUS_COLORS[r.status];
          const urgency = getUrgency(r.data, r.status);
          const us = urgency ? URGENCY_STYLES[urgency] : null;
          return (
            <div key={r.id} style={{ background: sc.rowBg, border: `1px solid ${us ? us.border : sc.border}`, borderLeft: `4px solid ${us ? us.border : sc.border}`, borderRadius: 8, padding: "10px 14px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: "8px 16px" }}>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>POSTAGEM</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.postagem}</div></div>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>TEMA</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.tema || "—"}</div></div>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>REDE</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{REDE_ICONS[r.rede] || ""} {r.rede || "—"}</div></div>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>FORMATO</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.formato || "—"}</div></div>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>RESPONSÁVEL</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.responsavel || "—"}</div></div>
              <div>
                <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>STATUS</div>
                <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 5, padding: "2px 7px", fontSize: 10, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>{r.status}</span>
                {us && <span style={{ marginLeft: 6, background: us.badgeBg, color: us.badgeColor, fontSize: 9, fontWeight: 700, fontFamily: "'Cinzel', serif", borderRadius: 4, padding: "1px 5px", animation: us.anim }}>{us.badge}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tráfego ───────────────────────────────────────────────────────────────

function TrafegoView({ isMobile }: { isMobile: boolean }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [audience, setAudience] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const META_TOKEN = import.meta.env.VITE_META_TOKEN;
  const AD_ACCOUNT = import.meta.env.VITE_META_AD_ACCOUNT_ID;

  const getDateRange = () => {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const until = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    return { since, until };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const { since, until } = getDateRange();
        const timeRange = encodeURIComponent(JSON.stringify({ since, until }));

        // Buscar campanhas com métricas
        const campsRes = await fetch(
          `https://graph.facebook.com/v25.0/${AD_ACCOUNT}/campaigns?fields=name,status,start_time,stop_time,insights.time_range({"since":"${since}","until":"${until}"}){impressions,reach,clicks,ctr,frequency}&access_token=${META_TOKEN}`
        );
        const campsData = await campsRes.json();

        if (campsData.error) throw new Error(campsData.error.message);

        const parsed = (campsData.data ?? []).map((c: any) => ({
          id: c.id,
          nome: c.name,
          status: c.status,
          inicio: c.start_time ? new Date(c.start_time).toLocaleDateString("pt-BR") : "—",
          fim: c.stop_time ? new Date(c.stop_time).toLocaleDateString("pt-BR") : "—",
          impressions: Number(c.insights?.data?.[0]?.impressions ?? 0),
          reach: Number(c.insights?.data?.[0]?.reach ?? 0),
          clicks: Number(c.insights?.data?.[0]?.clicks ?? 0),
          ctr: Number(c.insights?.data?.[0]?.ctr ?? 0).toFixed(2),
          frequency: Number(c.insights?.data?.[0]?.frequency ?? 0).toFixed(2),
        }));

        setCampaigns(parsed);

        // Buscar público por idade e gênero
        const audRes = await fetch(
          `https://graph.facebook.com/v25.0/${AD_ACCOUNT}/insights?fields=reach,impressions&breakdowns=age,gender&time_range=${timeRange}&level=account&access_token=${META_TOKEN}`
        );
        const audData = await audRes.json();

        if (!audData.error && audData.data) {
          const grouped: Record<string, { homens: number; mulheres: number }> = {};
          audData.data.forEach((d: any) => {
            if (!grouped[d.age]) grouped[d.age] = { homens: 0, mulheres: 0 };
            if (d.gender === "male") grouped[d.age].homens += Number(d.reach);
            if (d.gender === "female") grouped[d.age].mulheres += Number(d.reach);
          });
          const total = Object.values(grouped).reduce((s, v) => s + v.homens + v.mulheres, 0);
          const audienceParsed = Object.entries(grouped).map(([faixa, v]) => ({
            faixa,
            homens: Math.round((v.homens / total) * 100),
            mulheres: Math.round((v.mulheres / total) * 100),
            total: Math.round(((v.homens + v.mulheres) / total) * 100),
          }));
          setAudience(audienceParsed);
        }

      } catch (e: any) {
        setError(e.message ?? "Erro ao buscar dados do Meta.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalViz    = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalUnicos = campaigns.reduce((s, c) => s + c.reach, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const avgCtr      = campaigns.length ? (campaigns.reduce((s, c) => s + Number(c.ctr), 0) / campaigns.length).toFixed(2) : "0";

  const chartData = campaigns.map(c => ({
    name: c.nome.slice(0, 14) + "…",
    Visualizações: c.impressions,
    Alcance: c.reach,
  }));

  const STATUS_CAMP: Record<string, { color: string; label: string }> = {
    ACTIVE:   { color: "#86efac", label: "Ativa" },
    PAUSED:   { color: "#fcd34d", label: "Pausada" },
    ARCHIVED: { color: "#fca5a5", label: "Encerrada" },
    DELETED:  { color: "#fca5a5", label: "Deletada" },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#1a0d3a", border: "1px solid #4a2a8a", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7c3aed", marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ fontSize: 11, color: p.color, fontFamily: "'Lato', sans-serif" }}>{p.name}: <b>{p.value.toLocaleString("pt-BR")}</b></div>)}
      </div>
    );
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (error) return (
    <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: "#fca5a5", marginBottom: 8 }}>⚠ Erro ao carregar dados</div>
      <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: "#fca5a5" }}>{error}</div>
    </div>
  );

  const now = new Date();
  const mesAtual = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3, color: "#5a3a8a", marginBottom: 16 }}>
        ✦ {mesAtual.toUpperCase()} · {campaigns.length} CAMPANHA{campaigns.length !== 1 ? "S" : ""}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Visualizações", val: totalViz.toLocaleString("pt-BR"),    color: "#c084fc" },
          { label: "Alcance",       val: totalUnicos.toLocaleString("pt-BR"), color: "#a78bfa" },
          { label: "Cliques",       val: totalClicks.toLocaleString("pt-BR"), color: "#e879f9" },
          { label: "CTR Médio",     val: `${avgCtr}%`,                        color: "#6ee7b7" },
        ].map(k => (
          <div key={k.label} style={{ background: "linear-gradient(135deg,#1a0d3a,#110828)", border: "1px solid #4a2a8a", borderTop: `2px solid ${k.color}`, borderRadius: 12, padding: isMobile ? "14px 12px" : "18px 20px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#a78bfa", marginBottom: 6, letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 900, color: k.color, fontFamily: "'Cinzel', serif" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Gráfico + Público */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(135deg,#1a0d3a,#110828)", border: "1px solid #4a2a8a", borderRadius: 14, padding: "20px 16px" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#c084fc", marginBottom: 16 }}>✦ Visualizações por Campanha</div>
          <div style={{ height: isMobile ? 180 : 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 50, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#5a3a8a", fontSize: 8 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#5a3a8a", fontSize: 9 }} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v} width={32} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Visualizações" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={`rgba(162,89,255,${0.85-i*0.08})`} />)}
                </Bar>
                <Bar dataKey="Alcance" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={`rgba(192,132,252,${0.5-i*0.04})`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg,#1a0d3a,#110828)", border: "1px solid #4a2a8a", borderRadius: 14, padding: "20px 16px" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#c084fc", marginBottom: 16 }}>✦ Público — mês atual</div>
          {audience.length === 0
            ? <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: "#5a3a8a", textAlign: "center", paddingTop: 20 }}>Sem dados de público disponíveis.</div>
            : audience.map(a => (
              <div key={a.faixa} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#5a3a8a", width: 38 }}>{a.faixa}</div>
                <div style={{ flex: 1, height: 18, background: "#0d0720", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${a.homens}%`, background: "rgba(162,89,255,0.8)", height: "100%" }} />
                  <div style={{ width: `${a.mulheres}%`, background: "rgba(240,171,252,0.65)", height: "100%" }} />
                </div>
                <div style={{ fontSize: 10, color: "#5a3a8a", width: 28, textAlign: "right" }}>{a.total}%</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Cards de campanhas */}
      {campaigns.length === 0
        ? <div style={{ textAlign: "center", padding: 40, color: "#5a3a8a", fontFamily: "'Cinzel', serif", fontSize: 13 }}>Nenhuma campanha encontrada para o mês atual.</div>
        : <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
            {campaigns.map((c, idx) => {
              const st = STATUS_CAMP[c.status] ?? { color: "#c9a0f5", label: c.status };
              return (
                <div key={c.id} style={{ background: "linear-gradient(135deg,#1a0d3a,#110828)", border: "1px solid #2d1b69", borderRadius: 12, padding: "16px 18px", position: "relative" }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#5a3a8a", marginBottom: 4 }}>Campanha {String(idx+1).padStart(2,"0")}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2d0ff", marginBottom: 4, fontFamily: "'Cinzel', serif" }}>{c.nome}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: st.color, border: `1px solid ${st.color}`, borderRadius: 20, padding: "2px 8px" }}>{st.label}</span>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: "#5a3a8a" }}>{c.inicio} → {c.fim}</span>
                  </div>
                  <div style={{ borderTop: "1px solid #2d1b69", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 3 }}>VISUALIZAÇÕES</div><div style={{ fontSize: 18, fontWeight: 700, color: "#e2d0ff" }}>{c.impressions.toLocaleString("pt-BR")}</div></div>
                    <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 3 }}>ALCANCE</div><div style={{ fontSize: 18, fontWeight: 700, color: "#e2d0ff" }}>{c.reach.toLocaleString("pt-BR")}</div></div>
                    <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 3 }}>CLIQUES</div><div style={{ fontSize: 22, fontWeight: 900, color: "#c084fc", fontFamily: "'Cinzel', serif" }}>{c.clicks.toLocaleString("pt-BR")}</div></div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 3 }}>CTR</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", fontFamily: "'Cinzel', serif" }}>{c.ctr}%</div>
                      <div style={{ fontSize: 9, color: "#5a3a8a" }}>freq. {c.frequency}x</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

// ─── LeadsView ─────────────────────────────────────────────────────────────
const LEAD_STATUS_OPTIONS = ["Novo lead","Em contato","Mesa alocada","Desistiu","Lista de espera","Não respondeu"];
const LEAD_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Novo lead":      { bg: "#3d2068", text: "#c9a0f5", border: "#6b3fa0" },
  "Em contato":     { bg: "#2a1a5e", text: "#93c5fd", border: "#3b5bdb" },
  "Mesa alocada":   { bg: "#1a3a1a", text: "#86efac", border: "#16a34a" },
  "Desistiu":       { bg: "#3a1a1a", text: "#fca5a5", border: "#dc2626" },
  "Lista de espera":{ bg: "#1e3a5f", text: "#6ee7b7", border: "#059669" },
  "Não respondeu":  { bg: "#2a2a2a", text: "#9ca3af", border: "#4b5563" },
};

function LeadsView({ isMobile }: { isMobile: boolean }) {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    dbLoadLeads().then(setLeads).catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await dbUpdateLeadStatus(id, status).catch(console.error);
  };

  const filtered = leads.filter(l => {
    if (filterStatus !== "Todos" && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.nome?.toLowerCase().includes(q) || l.whatsapp_discord?.toLowerCase().includes(q) || l.sistemas_desejados?.toLowerCase().includes(q);
    }
    return true;
  });

  const byStatus = LEAD_STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const selectStyle: React.CSSProperties = { background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a", borderRadius: 8, padding: "8px 10px", fontFamily: "'Cinzel', serif", fontSize: 12, cursor: "pointer", outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>

{/* Cards de status */}
<div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 8 }}>
  {LEAD_STATUS_OPTIONS.map(s => {
    const c = LEAD_STATUS_COLORS[s];
    return (
      <div key={s} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", cursor: "pointer" }} onClick={() => setFilterStatus(filterStatus === s ? "Todos" : s)}>
        <div style={{ fontSize: 20, fontWeight: 900, color: c.text, fontFamily: "'Cinzel', serif" }}>{byStatus[s] ?? 0}</div>
        <div style={{ fontSize: 8, color: c.text, opacity: 0.8, fontFamily: "'Cinzel', serif", letterSpacing: 0.5 }}>{s}</div>
      </div>
    );
  })}
</div>

{/* Cards de origem */}
<div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(3,1fr)", gap: 8 }}>
  {[
    { label: "Meta Ads", icon: "/icons/facebook.png", chaves: ["meta", "facebook"] },
    { label: "Instagram", icon: "/icons/instagram.png", chaves: ["instagram"] },
    { label: "TikTok", icon: "/icons/tiktok.png", chaves: ["tiktok"] },
    { label: "Mayoou", icon: mayoouImg, chaves: ["mayoou"] },
    ].map(canal => {
    const count = leads.filter(l => {
      const origem = (l.notas ?? "").toLowerCase();
      return canal.chaves.some(k => origem.includes(k));
    }).length;
    return (
      <div key={canal.label} style={{ background: "#110828", border: "1px solid #2d1b69", borderRadius: 10, padding: "10px 8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <img src={canal.icon} alt={canal.label} style={{ width: 40, height: 40, objectFit: "contain" }} />
        <div style={{ fontSize: 20, fontWeight: 900, color: "#e2d0ff", fontFamily: "'Cinzel', serif" }}>{count}</div>
        <div style={{ fontSize: 8, color: "#5a3a8a", fontFamily: "'Cinzel', serif", letterSpacing: 0.5 }}>{canal.label}</div>
      </div>
    );
  })}
</div>

</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar por nome, contato ou sistema..."
          style={{ ...selectStyle, flex: 1, minWidth: 200 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="Todos">Todos os status</option>
          {LEAD_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => { setLoading(true); dbLoadLeads().then(setLeads).finally(() => setLoading(false)); }}
          style={{ background: "#1a0d3a", color: "#c084fc", border: "1px solid #4a2a8a", borderRadius: 8, padding: "8px 14px", fontFamily: "'Cinzel', serif", fontSize: 12, cursor: "pointer" }}>⟳</button>
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 32, height: 32, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#5a3a8a", fontFamily: "'Cinzel', serif", fontSize: 13 }}>Nenhum lead encontrado.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(lead => {
          const sc = LEAD_STATUS_COLORS[lead.status] ?? LEAD_STATUS_COLORS["Novo lead"];
          const isOpen = expanded === lead.id;
          const date = lead.created_at ? new Date(lead.created_at).toLocaleDateString("pt-BR") : "—";
          const origem = lead.notas?.replace("Origem: ", "") ?? "—";
          return (
            <div key={lead.id} style={{ background: "linear-gradient(135deg,#1a0d3a,#110828)", border: `1px solid ${sc.border}`, borderLeft: `4px solid ${sc.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : lead.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: "#e2d0ff", marginBottom: 2 }}>{lead.nome || "—"}</div>
                  <div style={{  display: "flex", alignItems: "center", gap: 8 }}>
  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#7c3aed" }}>{lead.whatsapp_discord || "—"} · {date}</span>
  {lead.whatsapp_discord && (
    <>
      <button
        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(lead.whatsapp_discord); }}
        title="Copiar número"
        style={{ background: "none", border: "1px solid #4a2a8a", borderRadius: 6, color: "#7c3aed", cursor: "pointer", fontSize: 11, padding: "2px 7px" }}>
        📋
      </button>
      
      <a href={`https://wa.me/55${lead.whatsapp_discord.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ background: "none", border: "1px solid #16a34a", borderRadius: 6, color: "#86efac", cursor: "pointer", fontSize: 11, padding: "2px 7px", textDecoration: "none" }}>💬</a>
    </>
  )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <select value={lead.status} onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, fontFamily: "'Cinzel', serif", fontWeight: 700, cursor: "pointer", outline: "none" }}>
                    {LEAD_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span style={{ color: "#5a3a8a", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid #2d1b69", paddingTop: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: "10px 20px" }}>
                    {[
                      { label: "Idade",            val: lead.idade },
                      { label: "Tempo de RPG",     val: lead.tempo_rpg },
                      { label: "Melhor período",   val: lead.melhor_periodo },
                      { label: "Melhor dia",       val: lead.melhor_dia },
                      { label: "Sistemas jogados", val: lead.sistemas_jogados },
                      { label: "Sistemas desejados", val: lead.sistemas_desejados },
                      { label: "Pronto pra ingressar", val: lead.pronto_ingressar },
                      { label: "Código de desconto",   val: lead.codigo_desconto || "—" },
                      { label: "Origem",               val: origem },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div style={{ fontSize: 9, color: "#a78bfa", fontFamily: "'Cinzel', serif", letterSpacing: 1, marginBottom: 2 }}>{label.toUpperCase()}</div>
                        <div style={{ fontSize: 12, color: "#e2d0ff", fontFamily: "'Lato', sans-serif" }}>{val || "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24, textAlign: "center", fontSize: 10, color: "#3d1b69", fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>
        {leads.length} lead{leads.length !== 1 ? "s" : ""} no total
      </div>
    </div>
  );
}
function PostagemCard({ row, idx, onUpdate, onDuplicate, onRemove }: {
  row: Row; idx: number;
  onUpdate: (id: string, key: keyof Row, val: string) => void;
  onDuplicate: (r: Row) => void;
  onRemove: (id: string) => void;
}) {
  const urgency = getUrgency(row.data, row.status);
  const us = urgency ? URGENCY_STYLES[urgency] : null;
  const sc = STATUS_COLORS[row.status];
  return (
    <div style={{ background: us ? us.rowBg : sc.rowBg, border: `1px solid ${us ? us.border : sc.border}`, borderLeft: `4px solid ${us ? us.border : sc.border}`, borderRadius: 12, padding: "14px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#5a3a8a", fontFamily: "'Cinzel',serif" }}>#{idx + 1}</span>
          <span style={{ fontSize: 13 }}>{REDE_ICONS[row.rede] || "📄"}</span>
          <span style={{ fontSize: 12, color: "#c9a0f5", fontFamily: "'Cinzel',serif" }}>{row.rede || "—"}</span>
          {us && <span style={{ background: us.badgeBg, color: us.badgeColor, fontSize: 9, fontWeight: 700, fontFamily: "'Cinzel',serif", borderRadius: 4, padding: "2px 6px", animation: us.anim }}>{us.badge}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDuplicate(row)} style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 18, padding: "4px", minWidth: 36, minHeight: 36 }} onMouseEnter={e => (e.currentTarget.style.color = "#c084fc")} onMouseLeave={e => (e.currentTarget.style.color = "#5a3a8a")}>📋</button>
          <button onClick={() => onRemove(row.id)} style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 18, padding: "4px", minWidth: 36, minHeight: 36 }} onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#5a3a8a")}>✕</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel',serif", marginBottom: 2, letterSpacing: 1 }}>POSTAGEM</div>
          <EditableCell value={row.postagem} onChange={v => onUpdate(row.id, "postagem", v)} placeholder="Postagem" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel',serif", marginBottom: 2, letterSpacing: 1 }}>✨ TEMA</div>
          <EditableCell value={row.tema} onChange={v => onUpdate(row.id, "tema", v)} placeholder="Título / tema" wide />
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel',serif", marginBottom: 2, letterSpacing: 1 }}>📅 DATA</div>
          <EditableCell value={row.data} onChange={v => onUpdate(row.id, "data", v)} placeholder="dd/mm/aaaa" urgency={urgency} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel',serif", marginBottom: 2, letterSpacing: 1 }}>🎞 FORMATO</div>
          <select value={row.formato} onChange={e => onUpdate(row.id, "formato", e.target.value)} style={{ background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a", borderRadius: 6, padding: "6px", fontSize: 13, fontFamily: "'Cinzel',serif", cursor: "pointer", width: "100%", outline: "none" }}>
            <option value="">--</option>{FORMATO_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel',serif", marginBottom: 2, letterSpacing: 1 }}>🌐 REDE</div>
          <select value={row.rede} onChange={e => onUpdate(row.id, "rede", e.target.value)} style={{ background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a", borderRadius: 6, padding: "6px", fontSize: 13, fontFamily: "'Cinzel',serif", cursor: "pointer", width: "100%", outline: "none" }}>
            <option value="">--</option>{REDE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel',serif", marginBottom: 2, letterSpacing: 1 }}>👤 RESPONSÁVEL</div>
          <EditableCell value={row.responsavel} onChange={v => onUpdate(row.id, "responsavel", v)} placeholder="Nome" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel',serif", marginBottom: 4, letterSpacing: 1 }}>🔮 STATUS</div>
          <select value={row.status} onChange={e => onUpdate(row.id, "status", e.target.value)} style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 6, padding: "8px", fontSize: 13, fontFamily: "'Cinzel',serif", fontWeight: 700, cursor: "pointer", width: "100%", outline: "none" }}>
            {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
// ─── TableWithDrag ─────────────────────────────────────────────────────────
function TableWithDrag({ filtered, loading, rows, updateRow, duplicateRow, removeRow, onReorder }: {
  filtered: Row[];
  loading: boolean;
  rows: Row[];
  updateRow: (id: string, key: keyof Row, val: string) => void;
  duplicateRow: (r: Row) => void;
  removeRow: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #4a2a8a", position: "relative" }}>
      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "#0d072099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 16 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 800 }}>
        <thead>
          <tr style={{ background: "linear-gradient(90deg,#2d1b69,#3d1b8a,#2d1b69)" }}>
            <th style={{ width: 50, padding: "12px 8px", borderRight: "1px solid #4a2a8a" }} />
            {COLS.map(col => (
              <th key={col.key} style={{ width: col.width, padding: "12px 10px", textAlign: "left", fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700, color: "#c084fc", letterSpacing: 1, textTransform: "uppercase", borderRight: "1px solid #4a2a8a", whiteSpace: "nowrap" }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={COLS.length + 1} style={{ padding: 48, textAlign: "center", color: "#5a3a8a", fontFamily: "'Cinzel',serif", fontSize: 13 }}>{rows.length === 0 ? "Nenhuma postagem ainda." : "Nenhuma com esse filtro."}</td></tr>
          )}
          {filtered.map((row, idx) => {
            const urgency  = getUrgency(row.data, row.status);
            const us       = urgency ? URGENCY_STYLES[urgency] : null;
            const sc       = STATUS_COLORS[row.status];
            const isDragOver = dragOverId === row.id && draggingId !== row.id;
            const isDragging = draggingId === row.id;

            const baseBg     = us ? us.rowBg : sc.rowBg;
            const baseBorder = us ? us.border : sc.border;

            return (
              <tr
                key={row.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData("rowId", row.id);
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingId(row.id);
                }}
                onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                onDragOver={e => { e.preventDefault(); if (draggingId !== row.id) setDragOverId(row.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={e => {
                  e.preventDefault();
                  const fromId = e.dataTransfer.getData("rowId");
                  if (fromId && fromId !== row.id) onReorder(fromId, row.id);
                  setDragOverId(null);
                  setDraggingId(null);
                }}
                style={{
                  background: isDragOver ? "#2d1b69" : baseBg,
                  borderLeft: `3px solid ${baseBorder}`,
                  opacity: isDragging ? 0.4 : 1,
                  transition: "background 0.15s, opacity 0.15s",
                  outline: isDragOver ? "2px dashed #c084fc" : "none",
                  cursor: "grab",
                }}
                onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = "#1e0f45"; }}
                onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = isDragOver ? "#2d1b69" : baseBg; }}
              >
                <td style={{ padding: "6px 4px", textAlign: "center", borderRight: "1px solid #2d1b69", borderBottom: "1px solid #1e0f45", fontSize: 10, color: "#5a3a8a" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: 14, color: "#3d1b69", cursor: "grab", lineHeight: 1 }}>⠿</span>
                    <span style={{ fontSize: 10, color: "#5a3a8a" }}>{idx + 1}</span>
                    <button onClick={() => duplicateRow(row)} style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 12 }} onMouseEnter={e => (e.currentTarget.style.color = "#c084fc")} onMouseLeave={e => (e.currentTarget.style.color = "#5a3a8a")}>📋</button>
                    <button onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 12 }} onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#5a3a8a")}>✕</button>
                  </div>
                </td>
                {COLS.map(col => (
                  <td key={col.key} style={{ padding: "4px 6px", borderRight: "1px solid #1e0f45", borderBottom: "1px solid #1e0f45", verticalAlign: "top" }}>
                    <EditableCell value={String(row[col.key] ?? "")} onChange={val => updateRow(row.id, col.key, val)} type={col.type} options={col.options} placeholder={col.placeholder} wide={col.wide} urgency={col.key === "data" ? urgency : undefined} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
// ─── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard({ onVoltar }: { onVoltar: () => void }) {
  const isMobile = useIsMobile();
  const [rows, setRows]             = useState<Row[]>([]);
  const [mes, setMes]               = useState(new Date().getMonth());
  const [filter, setFilter]         = useState("Todos");
  const [filterRede, setFilterRede] = useState("Todos");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim]       = useState("");
  const [loading, setLoading]       = useState(true);
  const [syncStatus, setSyncStatus] = useState<"ok"|"saving"|"error">("ok");
  const [viewMode, setViewMode]     = useState<ViewMode>("tabela");
  const [selectedDay, setSelectedDay] = useState<{ day: number; rows: Row[] } | null>(null);
  const [appTab, setAppTab]         = useState<AppTab>("calendario");

  const pendingUpserts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const rowsRef = useRef<Row[]>([]);

  const setRowsSafe = (updater: (prev: Row[]) => Row[]) => {
    setRows(prev => { const next = updater(prev); rowsRef.current = next; return next; });
  };

  const loadRows = useCallback(async (m: number, force = false) => {
    if (!force) setLoading(true);
    try {
      const data = await dbLoad(m);
      setRows(prev => {
        const pending = pendingUpserts.current;
        const merged = data.map(sr => pending.has(sr.id) ? (prev.find(r => r.id === sr.id) ?? sr) : sr);
        const serverIds = new Set(data.map(r => r.id));
        const result = [...merged, ...prev.filter(r => !serverIds.has(r.id))];
        rowsRef.current = result;
        return result;
      });
    } catch { setSyncStatus("error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setSelectedDay(null); loadRows(mes); }, [mes, loadRows]);
  useEffect(() => {
    const interval = setInterval(() => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      loadRows(mes, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [mes, loadRows]);

  const scheduleUpsert = useCallback((row: Row) => {
    setSyncStatus("saving");
    const existing = pendingUpserts.current.get(row.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      try { await dbUpsert(row); setSyncStatus("ok"); }
      catch { setSyncStatus("error"); }
      finally { pendingUpserts.current.delete(row.id); }
    }, 1000);
    pendingUpserts.current.set(row.id, t);
  }, []);

  const updateRow = (id: string, key: keyof Row, val: string) => {
    setRowsSafe(prev => {
      const next = prev.map(r => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: val };
        if (key === "data") {
          const d = parseDateBR(val);
          if (d) updated.mes = d.getMonth();
        }
        return updated;
      });
      const updated = next.find(r => r.id === id);
      if (updated) scheduleUpsert(updated);
      return next;
    });
  };

  const addRow = async () => {
    const row = makeRow(rowsRef.current.length + 1, mes);
    setRowsSafe(prev => [...prev, row]);
    try { await dbUpsert(row); } catch { setSyncStatus("error"); }
  };

  const duplicateRow = async (source: Row) => {
    const row: Row = { ...source, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, postagem: `${source.postagem} (cópia)`, status: "Planejado" };
    setRowsSafe(prev => { const idx = prev.findIndex(r => r.id === source.id); const next = [...prev]; next.splice(idx+1, 0, row); return next; });
    try { await dbUpsert(row); } catch { setSyncStatus("error"); }
  };

  const removeRow = async (id: string) => {
    const pending = pendingUpserts.current.get(id);
    if (pending) { clearTimeout(pending); pendingUpserts.current.delete(id); }
    setRowsSafe(prev => prev.filter(r => r.id !== id));
    try { await dbDelete(id); } catch { setSyncStatus("error"); }

    const movePost = (rowId: string, newDateStr: string) => {
      setRowsSafe(prev => {
        const next = prev.map(r => {
          if (r.id !== rowId) return r;
          const d = parseDateBR(newDateStr);
          const updated = { ...r, data: newDateStr, mes: d ? d.getMonth() : r.mes };
          scheduleUpsert(updated);
          return updated;
        });
        return next;
      });
    };
  };

  const dInicio = parseDateBR(filterDataInicio);
  const dFim    = parseDateBR(filterDataFim);
  const filtered = rows
    .filter(r => {
      if (filter !== "Todos" && r.status !== filter) return false;
      if (filterRede !== "Todos" && r.rede !== filterRede && r.rede !== "Todos") return false;
      const d = parseDateBR(r.data);
      if (dInicio && (!d || d < dInicio)) return false;
      if (dFim    && (!d || d > dFim))   return false;
      return true;
    })
    .sort((a, b) => { const da = parseDateBR(a.data); const db = parseDateBR(b.data); if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da.getTime() - db.getTime(); });

  const urgentCount = rows.filter(r => getUrgency(r.data, r.status) !== null).length;
  const syncColor   = syncStatus === "saving" ? "#c084fc" : syncStatus === "error" ? "#f87171" : "#6ee7b7";
  const syncLabel   = syncStatus === "saving" ? "Salvando..." : syncStatus === "error" ? "⚠ Erro" : "✓ Sync";
  const selectStyle: React.CSSProperties = { background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a", borderRadius: 8, padding: "9px 10px", fontFamily: "'Cinzel', serif", fontSize: 13, cursor: "pointer", outline: "none", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0d0720 0%,#1a0d3a 40%,#0d0720 100%)", color: "#e2d0ff", padding: isMobile ? "14px 10px" : "24px 16px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 20, marginBottom: 18, borderBottom: "2px solid #4a2a8a", paddingBottom: 14, flexWrap: "wrap" }}>
        <div style={{ width: isMobile ? 48 : 80, height: isMobile ? 48 : 80, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", animation: "float 4s ease-in-out infinite", flexShrink: 0 }}>
  <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: isMobile ? 32 : 52, height: isMobile ? 32 : 52, objectFit: "contain" }} />
</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 18 : 24, fontWeight: 900, background: "linear-gradient(90deg,#c084fc,#818cf8,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>Criando XP</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#7c3aed", letterSpacing: 3, textTransform: "uppercase" }}>
            {appTab === "calendario" ? "Calendário de Postagem" : appTab === "trafego" ? "Tráfego Pago · Meta Ads" : "Leads & Clientes"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-end" : "center", gap: 8, width: isMobile ? "100%" : "auto" }}>
          {appTab === "calendario" && urgentCount > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontFamily: "'Cinzel', serif", animation: "pulse-red 1s ease-in-out infinite" }}>⚡ {urgentCount} urgente{urgentCount > 1 ? "s" : ""}</span>
          )}
          {appTab === "calendario" && <span style={{ fontSize: 10, color: syncColor, animation: syncStatus === "saving" ? "blink 1s infinite" : "none" }}>{syncLabel}</span>}
          <button onClick={onVoltar} style={{ background: "transparent", border: "1px solid #4a2a8a", color: "#7c3aed", borderRadius: 8, padding: "6px 14px", fontFamily: "'Cinzel', serif", fontSize: 11, cursor: "pointer", letterSpacing: 1 }}>← Voltar</button>
          <div style={{ display: "flex", background: "#0d0720", border: "1px solid #4a2a8a", borderRadius: 10, overflow: "hidden", width: isMobile ? "100%" : "auto" }}>
            {([["calendario","📅"], ["trafego","📊"], ["leads","👥"]] as [AppTab,string][]).map(([tab, icon]) => (
              <button key={tab} onClick={() => setAppTab(tab)}
                style={{ flex: isMobile ? 1 : undefined, background: appTab === tab ? "linear-gradient(135deg,#4a2a8a,#7c3aed)" : "transparent", color: appTab === tab ? "#fff" : "#5a3a8a", border: "none", padding: isMobile ? "10px 0" : "8px 14px", fontFamily: "'Cinzel', serif", fontSize: isMobile ? 12 : 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CALENDÁRIO */}
      {appTab === "calendario" && (
        <>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <select value={mes} onChange={e => setMes(Number(e.target.value))} style={selectStyle}>{MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}</select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
              <select value={filterRede} onChange={e => setFilterRede(e.target.value)} style={selectStyle}><option value="Todos">Todas as Redes</option>{REDE_OPTIONS.map(r => <option key={r}>{r}</option>)}</select>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={selectStyle}><option value="Todos">Todos os Status</option>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => loadRows(mes)} style={{ background: "#1a0d3a", color: "#c084fc", border: "1px solid #4a2a8a", borderRadius: 8, padding: "9px 14px", fontFamily: "'Cinzel', serif", fontSize: 12, cursor: "pointer" }}>⟳</button>
              <div style={{ display: "flex", background: "#0d0720", border: "1px solid #4a2a8a", borderRadius: 10, overflow: "hidden" }}>
                {(["tabela","calendario"] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => { setViewMode(mode); setSelectedDay(null); }}
                    style={{ background: viewMode === mode ? "linear-gradient(135deg,#4a2a8a,#7c3aed)" : "transparent", color: viewMode === mode ? "#fff" : "#5a3a8a", border: "none", padding: "9px 14px", fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {mode === "tabela" ? "≡ Tabela" : "🗓 Cal"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtro data */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0d0720", border: "1px solid #4a2a8a", borderRadius: 10, padding: "6px 10px", marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#5a3a8a" }}>📅 De</span>
            <input type="text" value={filterDataInicio} onChange={e => setFilterDataInicio(e.target.value)} placeholder="dd/mm/aaaa" style={{ background: "transparent", border: "none", color: "#c9a0f5", fontFamily: "'Cinzel', serif", fontSize: 12, outline: "none", width: 100 }} />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#5a3a8a" }}>até</span>
            <input type="text" value={filterDataFim} onChange={e => setFilterDataFim(e.target.value)} placeholder="dd/mm/aaaa" style={{ background: "transparent", border: "none", color: "#c9a0f5", fontFamily: "'Cinzel', serif", fontSize: 12, outline: "none", width: 100 }} />
            {(filterDataInicio || filterDataFim) && <button onClick={() => { setFilterDataInicio(""); setFilterDataFim(""); }} style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 16 }}>✕</button>}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 8, marginBottom: 18 }}>
            {STATUS_OPTIONS.map(s => {
              const c = STATUS_COLORS[s];
              return <div key={s} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: isMobile ? "8px 6px" : "8px 16px", textAlign: "center" }}>
                <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: c.text, fontFamily: "'Cinzel', serif" }}>{rows.filter(r => r.status === s).length}</div>
                <div style={{ fontSize: isMobile ? 8 : 10, color: c.text, opacity: 0.8 }}>{s}</div>
              </div>;
            })}
            <div style={{ background: "#1a0d3a", border: "1px solid #4a2a8a", borderRadius: 10, padding: isMobile ? "8px 6px" : "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: "#c084fc", fontFamily: "'Cinzel', serif" }}>{rows.length}</div>
              <div style={{ fontSize: isMobile ? 8 : 10, color: "#c084fc", opacity: 0.8 }}>Total</div>
            </div>
          </div>

          {/* Calendário */}
          {viewMode === "calendario" && (
            <div>
              <div style={{ borderRadius: 16, border: "1px solid #4a2a8a", padding: isMobile ? "10px 8px" : "16px", background: "#0d072088", position: "relative" }}>
                {loading && <div style={{ position: "absolute", inset: 0, background: "#0d072099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 16 }}><div style={{ width: 32, height: 32, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}
                <CalendarView rows={filtered} mes={mes} onSelectDay={(r, d) => setSelectedDay(prev => prev?.day === d ? null : { day: d, rows: r })} isMobile={isMobile} onMovePost={movePost} />
              </div>
              {selectedDay && <DayPanel day={selectedDay.day} mes={mes} rows={selectedDay.rows} onClose={() => setSelectedDay(null)} isMobile={isMobile} />}
              <button onClick={addRow} style={{ marginTop: 14, background: "linear-gradient(135deg,#4a2a8a,#7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>+ Adicionar Postagem</button>
            </div>
          )}



{/* Tabela */}
{viewMode === "tabela" && (
  <>
    {isMobile ? (
      <div style={{ position: "relative" }}>
        {loading && <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 32, height: 32, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}
        {!loading && filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#5a3a8a", fontFamily: "'Cinzel',serif", fontSize: 13 }}>{rows.length === 0 ? "Nenhuma postagem ainda." : "Nenhuma com esse filtro."}</div>}
        {filtered.map((row, idx) => <PostagemCard key={row.id} row={row} idx={idx} onUpdate={updateRow} onDuplicate={duplicateRow} onRemove={removeRow} />)}
      </div>
    ) : (
      <TableWithDrag
        filtered={filtered}
        loading={loading}
        rows={rows}
        updateRow={updateRow}
        duplicateRow={duplicateRow}
        removeRow={removeRow}
        onReorder={(fromId, toId) => {
          setRowsSafe(prev => {
            const next = [...prev];
            const fromIdx = next.findIndex(r => r.id === fromId);
            const toIdx   = next.findIndex(r => r.id === toId);
            if (fromIdx < 0 || toIdx < 0) return prev;
            const [moved] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
        }}
      />
    )}
    <button onClick={addRow} style={{ marginTop: 14, background: "linear-gradient(135deg,#4a2a8a,#7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>+ Adicionar Postagem</button>
  </>
)}
        </>
      )}

      {appTab === "trafego" && <TrafegoView isMobile={isMobile} />}
      {appTab === "leads"   && <LeadsView   isMobile={isMobile} />}

      <div style={{ marginTop: 36, textAlign: "center", color: "#3d1b69", fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>
        🎲 CRIANDO XP · DASHBOARD INTERNO
      </div>
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<AppPage>("landing");
  const [autenticado, setAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState("");
  const [erroSenha, setErroSenha] = useState(false);

  const SENHA = atob("Y3JpdGljYWw3");

  const tentarEntrar = () => {
    if (senhaInput === SENHA) {
      setAutenticado(true);
      setErroSenha(false);
    } else {
      setErroSenha(true);
    }
  };

  const telaSenha = (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0d0720,#1a0d3a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#110828", border: "1px solid #4a2a8a", borderRadius: 16, padding: "40px 32px", textAlign: "center", width: "100%", maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 900, color: "#c084fc", marginBottom: 8 }}>Área Restrita</div>
        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: "#5a3a8a", marginBottom: 24 }}>Criando XP · Dashboard Interno</div>
        <input
          type="password"
          value={senhaInput}
          onChange={e => { setSenhaInput(e.target.value); setErroSenha(false); }}
          onKeyDown={e => e.key === "Enter" && tentarEntrar()}
          placeholder="Senha"
          style={{ width: "100%", background: "#0d0720", border: `1px solid ${erroSenha ? "#ef4444" : "#4a2a8a"}`, borderRadius: 10, color: "#e2d0ff", fontFamily: "'Lato', sans-serif", fontSize: 15, padding: "12px 16px", outline: "none", marginBottom: 8, boxSizing: "border-box" as const }}
        />
        {erroSenha && <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: "#fca5a5", marginBottom: 12 }}>Senha incorreta.</div>}
        <button onClick={tentarEntrar} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
          Entrar
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {page === "landing"
        ? <LandingPage onAbrirDashboard={() => setPage("dashboard")} />
        : autenticado
          ? <Dashboard onVoltar={() => { setPage("landing"); setAutenticado(false); setSenhaInput(""); }} />
          : telaSenha
      }
    </>
  );
}
