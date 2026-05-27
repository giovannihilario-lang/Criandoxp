import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Supabase config ───────────────────────────────────────────────────────
const SUPABASE_URL = "https://zovgkatndrgzxocwpdjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";
const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};
const TABLE = `${SUPABASE_URL}/rest/v1/postagens`;

// ─── Types ─────────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const STATUS_OPTIONS = ["Planejado","Em produção","Agendado","Publicado","Cancelado"] as const;
const FORMATO_OPTIONS = ["Post","Reels","Story","Carrossel","Live","Shorts","Thread"];
const REDE_OPTIONS = ["Instagram","TikTok","YouTube","Twitter/X","Facebook","Todos"];
type Status = typeof STATUS_OPTIONS[number];
type ViewMode = "tabela" | "calendario";
type AppTab = "calendario" | "trafego";

const REDE_ICONS: Record<string, string> = {
  "Instagram": "/icons/instagram.png",
  "TikTok":    "/icons/tiktok.png",
  "YouTube":   "/icons/youtube.png",
  "Twitter/X": "/icons/twitter.png",
  "Facebook":  "/icons/facebook.png",
  "Todos":     "/icons/todos.png",
};

const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string; rowBg: string; calBg: string }> = {
  "Planejado":    { bg: "#3d2068", text: "#c9a0f5", border: "#6b3fa0", rowBg: "rgba(61,32,104,0.18)",  calBg: "#3d2068dd" },
  "Em produção":  { bg: "#2a1a5e", text: "#93c5fd", border: "#3b5bdb", rowBg: "rgba(42,26,94,0.22)",   calBg: "#2a1a5edd" },
  "Agendado":     { bg: "#1e3a5f", text: "#6ee7b7", border: "#059669", rowBg: "rgba(30,58,95,0.22)",   calBg: "#1e3a5fdd" },
  "Publicado":    { bg: "#1a3a1a", text: "#86efac", border: "#16a34a", rowBg: "rgba(26,58,26,0.22)",   calBg: "#1a3a1add" },
  "Cancelado":    { bg: "#3a1a1a", text: "#fca5a5", border: "#dc2626", rowBg: "rgba(58,26,26,0.22)",   calBg: "#3a1a1add" },
};

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanha";
  if (diff === 2) return "em2";
  if (diff === 3) return "em3";
  return null;
}

const URGENCY_STYLES: Record<NonNullable<Urgency>, { border: string; rowBg: string; badge: string; badgeBg: string; badgeColor: string; anim: string }> = {
  hoje:   { border: "#ef4444", rowBg: "rgba(239,68,68,0.13)",  badge: "HOJE",   badgeBg: "#ef4444", badgeColor: "#fff",    anim: "pulse-red 1s ease-in-out infinite" },
  amanha: { border: "#f59e0b", rowBg: "rgba(245,158,11,0.12)", badge: "AMANHÃ", badgeBg: "#f59e0b", badgeColor: "#1a0d3a", anim: "pulse-yellow 1.5s ease-in-out infinite" },
  em2:    { border: "#fcd34d", rowBg: "rgba(252,211,77,0.08)", badge: "2 DIAS", badgeBg: "#fcd34d", badgeColor: "#1a0d3a", anim: "none" },
  em3:    { border: "#6ee7b7", rowBg: "rgba(110,231,183,0.07)", badge: "3 DIAS", badgeBg: "#059669", badgeColor: "#fff",   anim: "none" },
};

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

interface ColDef {
  key: keyof Row;
  label: string;
  width: number;
  type: "text" | "select" | "select-simple" | "select-rede";
  options?: readonly string[];
  placeholder?: string;
  wide?: boolean;
}

const COLS: ColDef[] = [
  { key: "postagem",      label: "Postagem",       width: 90,  type: "text",          placeholder: "Postagem" },
  { key: "data",          label: "📅 Data",         width: 140, type: "text",          placeholder: "dd/mm/aaaa" },
  { key: "rede",          label: "🌐 Rede",          width: 120, type: "select-rede",   options: REDE_OPTIONS },
  { key: "formato",       label: "🎞 Formato",       width: 110, type: "select-simple", options: FORMATO_OPTIONS },
  { key: "tema",          label: "✨ Tema",           width: 160, type: "text",          placeholder: "Título / tema do post", wide: true },
  { key: "briefing",      label: "📝 Briefing",      width: 240, type: "text",          placeholder: "Descrição, referências, copy...", wide: true },
  { key: "responsavel",   label: "👤 Responsável",   width: 120, type: "text",          placeholder: "Nome" },
  { key: "status",        label: "🔮 Status",        width: 130, type: "select",        options: STATUS_OPTIONS },
  { key: "observacoes",   label: "💬 Obs",           width: 180, type: "text",          placeholder: "Notas extras...", wide: true },
];

const makeRow = (n: number, mes: number): Row => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  postagem: `Postagem ${n}`, data: "", tema: "", briefing: "",
  formato: "", rede: "", responsavel: "", status: "Planejado",
  observacoes: "", mes,
});

async function dbLoad(mes: number): Promise<Row[]> {
  const res = await fetch(`${TABLE}?mes=eq.${mes}&select=*`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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

// ─── EditableCell ──────────────────────────────────────────────────────────
interface EditableCellProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  type?: "text" | "select" | "select-simple" | "select-rede";
  options?: readonly string[];
  placeholder?: string;
  wide?: boolean;
  urgency?: Urgency;
}

function EditableCell({ value, onChange, onFocus, onBlur, type = "text", options, placeholder, wide, urgency }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const handleFocus = () => { setEditing(true); onFocus?.(); };
  const handleBlur  = () => { setEditing(false); onBlur?.(); };

  if (type === "select") {
    const c = STATUS_COLORS[value as Status] ?? { bg: "#2d1b69", text: "#c9a0f5", border: "#6b3fa0" };
    return (
      <select value={value} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, fontFamily: "'Cinzel', serif", fontWeight: 700, cursor: "pointer", width: "100%", outline: "none" }}>
        {options!.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === "select-rede") {
    const icon = REDE_ICONS[value] ?? REDE_ICONS["Todos"];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <img src={icon} alt={value || "rede"} style={{ width: 18, height: 18, objectFit: "contain", borderRadius: 3 }} />
        <select value={value} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
          style={{ background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a", borderRadius: 6, padding: "4px 6px", fontSize: 12, fontFamily: "'Cinzel', serif", cursor: "pointer", flex: 1, outline: "none" }}>
          <option value="">--</option>
          {options!.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (type === "select-simple") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        style={{ background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a", borderRadius: 6, padding: "4px 6px", fontSize: 12, fontFamily: "'Cinzel', serif", cursor: "pointer", width: "100%", outline: "none" }}>
        <option value="">--</option>
        {options!.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  const us = urgency ? URGENCY_STYLES[urgency] : null;
  return editing ? (
    <textarea autoFocus value={value} onChange={e => onChange(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} placeholder={placeholder}
      style={{ width: "100%", minHeight: wide ? 60 : 32, background: "#1a0d3a", color: "#e2d0ff", border: "1px solid #7c3aed", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontFamily: "'Lato', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
  ) : (
    <div onClick={handleFocus} title="Clique para editar"
      style={{ minHeight: 28, padding: "4px 6px", color: value ? "#e2d0ff" : "#5a3a8a", fontSize: 12, fontFamily: "'Lato', sans-serif", cursor: "text", borderRadius: 4, transition: "background 0.15s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#2d1b69")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {value || <span style={{ fontStyle: "italic", opacity: 0.4 }}>{placeholder ?? "—"}</span>}
      {us && (
        <span style={{ display: "inline-block", marginLeft: 6, background: us.badgeBg, color: us.badgeColor, fontSize: 9, fontWeight: 700, fontFamily: "'Cinzel', serif", borderRadius: 4, padding: "1px 5px", letterSpacing: 1, animation: us.anim, verticalAlign: "middle" }}>{us.badge}</span>
      )}
    </div>
  );
}

// ─── CalendarView ──────────────────────────────────────────────────────────
function CalendarView({ rows, mes, onSelectDay }: { rows: Row[]; mes: number; onSelectDay: (rows: Row[], day: number) => void }) {
  const year = new Date().getFullYear();
  const firstDay = new Date(year, mes, 1).getDay();
  const daysInMonth = new Date(year, mes + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === mes && today.getFullYear() === year;
  const todayDay = isCurrentMonth ? today.getDate() : -1;

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

  return (
    <div style={{ padding: "0 0 8px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", padding: "6px 0", fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7c3aed", fontWeight: 700, letterSpacing: 1 }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} style={{ minHeight: 80 }} />;
          const dayRows = byDay[day] ?? [];
          const isToday = day === todayDay;
          const hasUrgent = dayRows.some(r => { const u = getUrgency(r.data, r.status); return u === "hoje" || u === "amanha"; });
          return (
            <div key={day} onClick={() => dayRows.length > 0 && onSelectDay(dayRows, day)}
              style={{ minHeight: 80, background: isToday ? "linear-gradient(135deg, #3d1b8a55, #7c3aed33)" : "#110828", border: isToday ? "2px solid #7c3aed" : hasUrgent ? "1px solid #ef4444" : "1px solid #2d1b69", borderRadius: 8, padding: "6px 6px 4px", cursor: dayRows.length > 0 ? "pointer" : "default", transition: "all 0.15s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { if (dayRows.length > 0) { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "#1e0f45"; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isToday ? "#7c3aed" : hasUrgent ? "#ef4444" : "#2d1b69"; e.currentTarget.style.background = isToday ? "linear-gradient(135deg, #3d1b8a55, #7c3aed33)" : "#110828"; }}
            >
              {hasUrgent && <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse-red 1s ease-in-out infinite", display: "block" }} />}
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: isToday ? 13 : 11, fontWeight: isToday ? 900 : 400, color: isToday ? "#c084fc" : "#5a3a8a", marginBottom: 4 }}>{day}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dayRows.slice(0, 3).map(r => {
                  const sc = STATUS_COLORS[r.status];
                  const icon = REDE_ICONS[r.rede];
                  return (
                    <div key={r.id} style={{ background: sc.calBg, border: `1px solid ${sc.border}`, borderRadius: 4, padding: "2px 4px", display: "flex", alignItems: "center", gap: 3 }}>
                      {icon && <img src={icon} alt={r.rede} style={{ width: 10, height: 10, objectFit: "contain", borderRadius: 2, flexShrink: 0 }} />}
                      <span style={{ fontSize: 9, color: sc.text, fontFamily: "'Lato', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{r.tema || r.postagem}</span>
                    </div>
                  );
                })}
                {dayRows.length > 3 && <div style={{ fontSize: 9, color: "#7c3aed", fontFamily: "'Cinzel', serif", textAlign: "center" }}>+{dayRows.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DayPanel ──────────────────────────────────────────────────────────────
function DayPanel({ day, mes, rows, onClose }: { day: number; mes: number; rows: Row[]; onClose: () => void }) {
  return (
    <div style={{ marginTop: 16, background: "linear-gradient(135deg, #1a0d3a, #2d1b69)", border: "1px solid #4a2a8a", borderRadius: 14, padding: "18px 20px", animation: "glow 4s ease-in-out infinite" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: "#c084fc", letterSpacing: 2 }}>
          📅 {day} de {MONTHS[mes]} — {rows.length} postagem{rows.length !== 1 ? "s" : ""}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "1px solid #4a2a8a", borderRadius: 6, color: "#5a3a8a", cursor: "pointer", padding: "4px 10px", fontFamily: "'Cinzel', serif", fontSize: 11, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#4a2a8a"; e.currentTarget.style.color = "#5a3a8a"; }}
        >✕ Fechar</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(r => {
          const sc = STATUS_COLORS[r.status];
          const urgency = getUrgency(r.data, r.status);
          const us = urgency ? URGENCY_STYLES[urgency] : null;
          const icon = REDE_ICONS[r.rede];
          return (
            <div key={r.id} style={{ background: sc.rowBg, border: `1px solid ${us ? us.border : sc.border}`, borderLeft: `4px solid ${us ? us.border : sc.border}`, borderRadius: 8, padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px" }}>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>POSTAGEM</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.postagem}</div></div>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>TEMA</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.tema || "—"}</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>REDE</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {icon && <img src={icon} alt={r.rede} style={{ width: 14, height: 14, objectFit: "contain" }} />}
                    <span style={{ fontSize: 12, color: "#e2d0ff" }}>{r.rede || "—"}</span>
                  </div>
                </div>
              </div>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>FORMATO</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.formato || "—"}</div></div>
              <div><div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>RESPONSÁVEL</div><div style={{ fontSize: 12, color: "#e2d0ff" }}>{r.responsavel || "—"}</div></div>
              <div>
                <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>STATUS</div>
                <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 5, padding: "2px 7px", fontSize: 10, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>{r.status}</span>
                {us && <span style={{ marginLeft: 6, background: us.badgeBg, color: us.badgeColor, fontSize: 9, fontWeight: 700, fontFamily: "'Cinzel', serif", borderRadius: 4, padding: "1px 5px", letterSpacing: 1, animation: us.anim }}>{us.badge}</span>}
              </div>
              {r.briefing && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", marginBottom: 2 }}>BRIEFING</div>
                  <div style={{ fontSize: 12, color: "#c9a0f5", lineHeight: 1.5 }}>{r.briefing}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tráfego Pago Data ────────────────────────────────────────────────────
const CAMPAIGNS = [
  { id: 1, nome: "Tráfego — Anunciantes do Instagram", periodo: "11 abr → 15 abr 2026", vizTotal: 26259, vizUnicos: 24385, resultado: 307, tipoResultado: "cliques no link", investimento: null, best: false },
  { id: 2, nome: "Post Mayou — 3ª rodada",             periodo: "9 mai → 13 mai 2026",   vizTotal: 17846, vizUnicos: 14477, resultado: 556, tipoResultado: "visitas à página", investimento: null, best: true  },
  { id: 3, nome: "Post Gio 2 — 2ª rodada",             periodo: "14 mai → 17 mai 2026",  vizTotal: 13935, vizUnicos: 11389, resultado: 191, tipoResultado: "visitas à página", investimento: null, best: false },
  { id: 4, nome: "Post Mayou — 1ª rodada",             periodo: "5 abr → 9 abr 2026",    vizTotal: 10537, vizUnicos: 8002,  resultado: 182, tipoResultado: "visitas à página", investimento: null, best: false },
  { id: 5, nome: "Post Gio 3 — 3ª rodada",             periodo: "20 mai → 23 mai 2026",  vizTotal: 9341,  vizUnicos: 7902,  resultado: 134, tipoResultado: "visitas à página", investimento: null, best: false },
  { id: 6, nome: "Post Gio 1 — 1ª rodada",             periodo: "21 abr → 24 abr 2026",  vizTotal: 7784,  vizUnicos: 6557,  resultado: 96,  tipoResultado: "visitas à página", investimento: null, best: false },
  { id: 7, nome: "Post Mayou — 2ª rodada",             periodo: "26 abr → 30 abr 2026",  vizTotal: 1049,  vizUnicos: 951,   resultado: 9,   tipoResultado: "visitas à página", investimento: null, best: false },
];

const AUDIENCE_DATA = [
  { faixa: "18–24", homens: 20, mulheres: 2,  total: 22 },
  { faixa: "25–34", homens: 40, mulheres: 5,  total: 45 },
  { faixa: "35–44", homens: 22, mulheres: 2,  total: 24 },
  { faixa: "45–54", homens: 7,  mulheres: 1,  total: 8  },
  { faixa: "55–64", homens: 1,  mulheres: 0.5,total: 1  },
  { faixa: "65+",   homens: 1,  mulheres: 0,  total: 1  },
];

const CHART_DATA = CAMPAIGNS.map(c => ({
  name: c.nome.length > 18 ? c.nome.slice(0, 18) + "…" : c.nome,
  vizTotal: c.vizTotal,
  vizUnicos: c.vizUnicos,
  resultado: c.resultado,
}));

const fmtNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);

// ─── TrafegoView ──────────────────────────────────────────────────────────
function TrafegoView() {
  const totalViz    = CAMPAIGNS.reduce((s, c) => s + c.vizTotal, 0);
  const totalUnicos = CAMPAIGNS.reduce((s, c) => s + c.vizUnicos, 0);
  const totalInter  = 14300;
  const totalVisitas= 1832;

  const mysticCard = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{
      background: "linear-gradient(135deg, #1a0d3a 0%, #110828 100%)",
      border: "1px solid #4a2a8a",
      borderRadius: 14,
      padding: "20px 22px",
      animation: "glow 4s ease-in-out infinite",
      ...extra,
    }}>{children}</div>
  );

  const sectionLabel = (text: string) => (
    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#5a3a8a", marginBottom: 16 }}>{text}</div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#1a0d3a", border: "1px solid #4a2a8a", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7c3aed", marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ fontSize: 11, color: p.color, fontFamily: "'Lato', sans-serif" }}>
            {p.name}: <b>{p.value.toLocaleString("pt-BR")}</b>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{ marginBottom: 28 }}>
        {sectionLabel("✦ Visão Geral — 90 dias · 7 campanhas")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {[
            { label: "Visualizações", val: fmtNum(totalViz),    sub: "impressões totais",   color: "#c084fc" },
            { label: "Alcance",       val: fmtNum(totalUnicos), sub: "pessoas únicas",       color: "#a78bfa" },
            { label: "Interações",    val: fmtNum(totalInter),  sub: "curtidas, comentários", color: "#e879f9" },
            { label: "Visitas",       val: fmtNum(totalVisitas),sub: "acessos gerados",      color: "#6ee7b7" },
          ].map(k => (
            <div key={k.label} style={{
              background: "linear-gradient(135deg, #1a0d3a, #110828)",
              border: `1px solid #4a2a8a`,
              borderTop: `2px solid ${k.color}`,
              borderRadius: 12, padding: "18px 20px",
              animation: "glow 3s ease-in-out infinite",
            }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#5a3a8a", marginBottom: 8, letterSpacing: 1 }}>{k.label}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: k.color, fontFamily: "'Cinzel', serif", letterSpacing: -1 }}>{k.val}</div>
              <div style={{ fontSize: 10, color: "#5a3a8a", marginTop: 4, fontFamily: "'Lato', sans-serif" }}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 28 }}>
        {/* Bar chart */}
        {mysticCard(
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#c084fc", marginBottom: 16, letterSpacing: 1 }}>✦ Visualizações por Campanha</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 40, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "#5a3a8a", fontSize: 9, fontFamily: "'Lato', sans-serif" }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "#5a3a8a", fontSize: 9, fontFamily: "'Lato', sans-serif" }} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="vizTotal" name="Visualizações" radius={[4,4,0,0]}>
                    {CHART_DATA.map((_, i) => <Cell key={i} fill={`rgba(162,89,255,${0.85 - i*0.08})`} />)}
                  </Bar>
                  <Bar dataKey="vizUnicos" name="Visualizadores" radius={[4,4,0,0]}>
                    {CHART_DATA.map((_, i) => <Cell key={i} fill={`rgba(192,132,252,${0.5 - i*0.04})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Audience */}
        {mysticCard(
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#c084fc", marginBottom: 4, letterSpacing: 1 }}>✦ Público — 30 dias</div>
            <div style={{ fontSize: 10, color: "#5a3a8a", fontFamily: "'Lato', sans-serif", marginBottom: 16 }}>8,1 mil interações</div>
            {AUDIENCE_DATA.map(a => (
              <div key={a.faixa} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#5a3a8a", width: 38, flexShrink: 0 }}>{a.faixa}</div>
                <div style={{ flex: 1, height: 18, background: "#0d0720", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${a.homens}%`, background: "rgba(162,89,255,0.8)", height: "100%", borderRadius: "4px 0 0 4px" }} />
                  <div style={{ width: `${a.mulheres}%`, background: "rgba(240,171,252,0.65)", height: "100%" }} />
                </div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: "#5a3a8a", width: 28, textAlign: "right" }}>{a.total}%</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
              {[["rgba(162,89,255,0.8)","Homens"],["rgba(240,171,252,0.65)","Mulheres"]].map(([bg, label]) => (
                <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: bg as string }} />
                  <span style={{ fontSize: 10, color: "#5a3a8a", fontFamily: "'Lato', sans-serif" }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Campaigns */}
      <div>
        {sectionLabel("✦ Campanhas Individuais")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {CAMPAIGNS.map((c, idx) => (
            <div key={c.id} style={{
              background: "linear-gradient(135deg, #1a0d3a, #110828)",
              border: c.best ? "1px solid rgba(162,89,255,0.5)" : "1px solid #2d1b69",
              borderRadius: 12, padding: "18px 20px",
              position: "relative",
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#4a2a8a")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = c.best ? "rgba(162,89,255,0.5)" : "#2d1b69")}
            >
              {c.best && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(162,89,255,0.15)", border: "1px solid rgba(162,89,255,0.4)",
                  color: "#c084fc", fontFamily: "'Cinzel', serif", fontSize: 8,
                  letterSpacing: 1, textTransform: "uppercase", padding: "3px 9px", borderRadius: 20,
                }}>✦ Mais visitas</div>
              )}
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#5a3a8a", marginBottom: 6, letterSpacing: 1 }}>Campanha {String(idx + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2d0ff", marginBottom: 3, lineHeight: 1.3, paddingRight: c.best ? 70 : 0, fontFamily: "'Cinzel', serif" }}>{c.nome}</div>
              <div style={{ fontSize: 10, color: "#5a3a8a", marginBottom: 14, fontFamily: "'Lato', sans-serif" }}>{c.periodo}</div>
              <div style={{ borderTop: "1px solid #2d1b69", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", letterSpacing: 1, marginBottom: 3 }}>VISUALIZAÇÕES</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#e2d0ff" }}>{c.vizTotal.toLocaleString("pt-BR")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", letterSpacing: 1, marginBottom: 3 }}>VISUALIZADORES</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#e2d0ff" }}>{c.vizUnicos.toLocaleString("pt-BR")}</div>
                </div>
                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #2d1b69", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", letterSpacing: 1, marginBottom: 3 }}>RESULTADO</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#c084fc", fontFamily: "'Cinzel', serif" }}>{c.resultado}</div>
                    <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Lato', sans-serif" }}>{c.tipoResultado}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Cinzel', serif", letterSpacing: 1, marginBottom: 3 }}>TAXA</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", fontFamily: "'Cinzel', serif" }}>
                      {((c.resultado / c.vizTotal) * 100).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 9, color: "#5a3a8a", fontFamily: "'Lato', sans-serif" }}>conversão</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center", color: "#3d1b69", fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>
        Gerado em 24/05/2026 · Meta Ads Manager · 7 Campanhas
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [rows, setRows]             = useState<Row[]>([]);
  const [mes, setMes]               = useState(new Date().getMonth());
  const [filter, setFilter]         = useState("Todos");
  const [filterRede, setFilterRede] = useState("Todos");
  const [loading, setLoading]       = useState(true);
  const [syncStatus, setSyncStatus] = useState<"ok" | "saving" | "error">("ok");
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
        const merged = data.map(serverRow => {
          if (pending.has(serverRow.id)) { const local = prev.find(r => r.id === serverRow.id); return local ?? serverRow; }
          return serverRow;
        });
        const serverIds = new Set(data.map(r => r.id));
        const localOnly = prev.filter(r => !serverIds.has(r.id));
        const result = [...merged, ...localOnly];
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
      const next = prev.map(r => r.id === id ? { ...r, [key]: val } : r);
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
    setRowsSafe(prev => { const idx = prev.findIndex(r => r.id === source.id); const next = [...prev]; next.splice(idx + 1, 0, row); return next; });
    try { await dbUpsert(row); } catch { setSyncStatus("error"); }
  };

  const removeRow = async (id: string) => {
    const pending = pendingUpserts.current.get(id);
    if (pending) { clearTimeout(pending); pendingUpserts.current.delete(id); }
    setRowsSafe(prev => prev.filter(r => r.id !== id));
    try { await dbDelete(id); } catch { setSyncStatus("error"); }
  };

  const filtered = rows.filter(r =>
    (filter === "Todos" || r.status === filter) &&
    (filterRede === "Todos" || r.rede === filterRede || r.rede === "Todos")
  );

  const urgentCount = rows.filter(r => getUrgency(r.data, r.status) !== null).length;
  const syncLabel = syncStatus === "saving" ? "Salvando..." : syncStatus === "error" ? "⚠ Erro de conexão" : "✓ Sincronizado";
  const syncColor = syncStatus === "saving" ? "#c084fc" : syncStatus === "error" ? "#f87171" : "#6ee7b7";

  const selectStyle: React.CSSProperties = {
    background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a",
    borderRadius: 8, padding: "7px 12px", fontFamily: "'Cinzel', serif",
    fontSize: 12, cursor: "pointer", outline: "none",
  };

  const handleSelectDay = (dayRows: Row[], day: number) => {
    setSelectedDay(prev => prev?.day === day ? null : { day, rows: dayRows });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0720 0%, #1a0d3a 40%, #0d0720 100%)", fontFamily: "'Lato', sans-serif", color: "#e2d0ff", padding: "24px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0d0720; }
        ::-webkit-scrollbar-thumb { background: #4a2a8a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
        @keyframes float        { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes glow         { 0%,100%{box-shadow:0 0 20px #7c3aed44} 50%{box-shadow:0 0 40px #7c3aed88} }
        @keyframes blink        { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes pulse-red    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 4px rgba(239,68,68,0)} }
        @keyframes pulse-yellow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)} 50%{box-shadow:0 0 0 4px rgba(245,158,11,0)} }
        tr.status-row { transition: background 0.15s; }
        tr.status-row:hover td { filter: brightness(1.15); }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22, borderBottom: "2px solid #4a2a8a", paddingBottom: 18, flexWrap: "wrap" }}>
        <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: 80, height: 80, objectFit: "contain", animation: "float 4s ease-in-out infinite" }} />
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 900, background: "linear-gradient(90deg, #c084fc, #818cf8, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>Criando XP</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7c3aed", letterSpacing: 4, textTransform: "uppercase" }}>
            {appTab === "calendario" ? "Calendário de Postagem" : "Tráfego Pago · Meta Ads"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {appTab === "calendario" && urgentCount > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontFamily: "'Cinzel', serif", fontWeight: 700, animation: "pulse-red 1s ease-in-out infinite", letterSpacing: 1 }}>
              ⚡ {urgentCount} post{urgentCount > 1 ? "s" : ""} urgente{urgentCount > 1 ? "s" : ""}
            </span>
          )}
          {appTab === "calendario" && (
            <>
              <span style={{ fontSize: 11, color: syncColor, animation: syncStatus === "saving" ? "blink 1s infinite" : "none" }}>{syncLabel}</span>
              <span style={{ fontSize: 10, color: "#3d1b69" }}>• atualiza a cada 15s</span>
            </>
          )}

          {/* APP TAB TOGGLE */}
          <div style={{ display: "flex", background: "#0d0720", border: "1px solid #4a2a8a", borderRadius: 10, overflow: "hidden" }}>
            {([["calendario","📅 Calendário"],["trafego","📊 Tráfego Pago"]] as [AppTab, string][]).map(([tab, label]) => (
              <button key={tab} onClick={() => setAppTab(tab)}
                style={{
                  background: appTab === tab ? "linear-gradient(135deg, #4a2a8a, #7c3aed)" : "transparent",
                  color: appTab === tab ? "#fff" : "#5a3a8a",
                  border: "none", padding: "8px 18px",
                  fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", letterSpacing: 1, transition: "all 0.2s",
                }}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CALENDÁRIO TAB ── */}
      {appTab === "calendario" && (
        <>
          {/* FILTERS */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
            <select value={mes} onChange={e => setMes(Number(e.target.value))} style={selectStyle}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={filterRede} onChange={e => setFilterRede(e.target.value)} style={selectStyle}>
              <option value="Todos">Todas as Redes</option>
              {REDE_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={selectStyle}>
              <option value="Todos">Todos os Status</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => loadRows(mes)} style={{ background: "#1a0d3a", color: "#c084fc", border: "1px solid #4a2a8a", borderRadius: 8, padding: "7px 14px", fontFamily: "'Cinzel', serif", fontSize: 11, cursor: "pointer" }}>⟳ Atualizar</button>
            <div style={{ marginLeft: "auto", display: "flex", background: "#0d0720", border: "1px solid #4a2a8a", borderRadius: 10, overflow: "hidden" }}>
              {(["tabela", "calendario"] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => { setViewMode(mode); setSelectedDay(null); }}
                  style={{ background: viewMode === mode ? "linear-gradient(135deg, #4a2a8a, #7c3aed)" : "transparent", color: viewMode === mode ? "#fff" : "#5a3a8a", border: "none", padding: "7px 16px", fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
                  {mode === "tabela" ? "≡ Tabela" : "🗓 Calendário"}
                </button>
              ))}
            </div>
          </div>

          {/* STATS */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map(s => {
              const c = STATUS_COLORS[s];
              return (
                <div key={s} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, animation: "glow 3s ease-in-out infinite" }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: c.text, fontFamily: "'Cinzel', serif" }}>{rows.filter(r => r.status === s).length}</span>
                  <span style={{ fontSize: 10, color: c.text, opacity: 0.8 }}>{s}</span>
                </div>
              );
            })}
            <div style={{ background: "#1a0d3a", border: "1px solid #4a2a8a", borderRadius: 10, padding: "8px 16px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#c084fc", fontFamily: "'Cinzel', serif" }}>{rows.length}</span>
              <span style={{ fontSize: 10, color: "#c084fc", opacity: 0.8 }}>Total</span>
            </div>
          </div>

          {/* CALENDAR VIEW */}
          {viewMode === "calendario" && (
            <div>
              <div style={{ borderRadius: 16, border: "1px solid #4a2a8a", animation: "glow 4s ease-in-out infinite", padding: "16px", background: "#0d072088", position: "relative" }}>
                {loading && (
                  <div style={{ position: "absolute", inset: 0, background: "#0d072099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 16 }}>
                    <div style={{ width: 32, height: 32, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
                <CalendarView rows={filtered} mes={mes} onSelectDay={handleSelectDay} />
              </div>
              {selectedDay && <DayPanel day={selectedDay.day} mes={mes} rows={selectedDay.rows} onClose={() => setSelectedDay(null)} />}
              <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}>
                <button onClick={addRow} style={{ background: "linear-gradient(135deg, #4a2a8a, #7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.2s", boxShadow: "0 4px 15px #7c3aed44" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px #7c3aed66"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px #7c3aed44"; }}
                >+ Adicionar Postagem</button>
                <span style={{ color: "#5a3a8a", fontSize: 11 }}>Clique em um dia com posts para ver detalhes · ponto vermelho = urgente</span>
              </div>
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === "tabela" && (
            <>
              <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #4a2a8a", animation: "glow 4s ease-in-out infinite", position: "relative" }}>
                {loading && (
                  <div style={{ position: "absolute", inset: 0, background: "#0d072099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 16 }}>
                    <div style={{ width: 32, height: 32, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(90deg, #2d1b69, #3d1b8a, #2d1b69)" }}>
                      <th style={{ width: 50, padding: "12px 8px", borderRight: "1px solid #4a2a8a" }} />
                      {COLS.map(col => (
                        <th key={col.key} style={{ width: col.width, padding: "12px 10px", textAlign: "left", fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: "#c084fc", letterSpacing: 1, textTransform: "uppercase", borderRight: "1px solid #4a2a8a", whiteSpace: "nowrap" }}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={COLS.length + 1} style={{ padding: 48, textAlign: "center", color: "#5a3a8a", fontFamily: "'Cinzel', serif", fontSize: 13 }}>
                        {rows.length === 0 ? "Nenhuma postagem ainda. Clique em + Adicionar." : "Nenhuma postagem com esse filtro."}
                      </td></tr>
                    )}
                    {filtered.map((row, idx) => {
                      const urgency = getUrgency(row.data, row.status);
                      const us = urgency ? URGENCY_STYLES[urgency] : null;
                      const sc = STATUS_COLORS[row.status];
                      const baseBg = us ? us.rowBg : (sc ? sc.rowBg : (idx % 2 === 0 ? "#110828" : "#0d0720"));
                      const baseBorder = us ? us.border : (sc ? sc.border : "transparent");
                      return (
                        <tr key={row.id} className="status-row"
                          style={{ background: baseBg, borderLeft: `3px solid ${baseBorder}`, transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#1e0f45")}
                          onMouseLeave={e => (e.currentTarget.style.background = baseBg)}
                        >
                          <td style={{ padding: "6px 4px", textAlign: "center", borderRight: "1px solid #2d1b69", borderBottom: "1px solid #1e0f45", fontSize: 10, color: "#5a3a8a" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <span style={{ color: "#5a3a8a" }}>{idx + 1}</span>
                              <button onClick={() => duplicateRow(row)} title="Duplicar" style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 12, padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = "#c084fc")} onMouseLeave={e => (e.currentTarget.style.color = "#5a3a8a")}>📋</button>
                              <button onClick={() => removeRow(row.id)} title="Deletar" style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 12, padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#5a3a8a")}>✕</button>
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
              <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}>
                <button onClick={addRow} style={{ background: "linear-gradient(135deg, #4a2a8a, #7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.2s", boxShadow: "0 4px 15px #7c3aed44" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px #7c3aed66"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px #7c3aed44"; }}
                >+ Adicionar Postagem</button>
                <span style={{ color: "#5a3a8a", fontSize: 11 }}>Clique em qualquer célula para editar · 📋 duplicar · ✕ deletar · salvo automaticamente</span>
              </div>
            </>
          )}
        </>
      )}

      {/* ── TRÁFEGO TAB ── */}
      {appTab === "trafego" && <TrafegoView />}

      <div style={{ marginTop: 36, textAlign: "center", color: "#3d1b69", fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>
        <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: 16, height: 16, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} />
        CRIANDO XP · {appTab === "calendario" ? `CALENDÁRIO DE CONTEÚDO · ${MONTHS[mes].toUpperCase()}` : "TRÁFEGO PAGO · META ADS"}
      </div>
    </div>
  );
}