import { useState, useEffect, useCallback, useRef } from "react";

// ─── Supabase config ───────────────────────────────────────────────────────
const SUPABASE_URL = "https://zovgkatndrgzxocwpdjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";
const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "resolution=merge-duplicates,return=representation",
};
const TABLE = `${SUPABASE_URL}/rest/v1/postagens`;

// ─── Types ─────────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STATUS_OPTIONS = ["Planejado","Em produção","Agendado","Publicado","Cancelado"] as const;
const FORMATO_OPTIONS = ["Post","Reels","Story","Carrossel","Live","Shorts","Thread"];
const REDE_OPTIONS = ["Instagram","TikTok","YouTube","Twitter/X","Facebook","Todos"];
type Status = typeof STATUS_OPTIONS[number];

const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string }> = {
  "Planejado":    { bg: "#3d2068", text: "#c9a0f5", border: "#6b3fa0" },
  "Em produção":  { bg: "#2a1a5e", text: "#93c5fd", border: "#3b5bdb" },
  "Agendado":     { bg: "#1e3a5f", text: "#6ee7b7", border: "#059669" },
  "Publicado":    { bg: "#1a3a1a", text: "#86efac", border: "#16a34a" },
  "Cancelado":    { bg: "#3a1a1a", text: "#fca5a5", border: "#dc2626" },
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
  type: "text" | "select" | "select-simple";
  options?: readonly string[];
  placeholder?: string;
  wide?: boolean;
}

const COLS: ColDef[] = [
  { key: "postagem",      label: "Postagem",       width: 90,  type: "text",          placeholder: "Postagem" },
  { key: "data",        label: "📅 Data",       width: 110, type: "text",          placeholder: "dd/mm/aaaa" },
  { key: "rede",        label: "🌐 Rede",        width: 110, type: "select-simple", options: REDE_OPTIONS },
  { key: "formato",     label: "🎞 Formato",     width: 110, type: "select-simple", options: FORMATO_OPTIONS },
  { key: "tema",        label: "✨ Tema",         width: 160, type: "text",          placeholder: "Título / tema do post", wide: true },
  { key: "briefing",    label: "📝 Briefing",    width: 240, type: "text",          placeholder: "Descrição, referências, copy...", wide: true },
  { key: "responsavel", label: "👤 Responsável", width: 120, type: "text",          placeholder: "Nome" },
  { key: "status",      label: "🔮 Status",      width: 130, type: "select",        options: STATUS_OPTIONS },
  { key: "observacoes", label: "💬 Obs",         width: 180, type: "text",          placeholder: "Notas extras...", wide: true },
];

const makeRow = (n: number, mes: number): Row => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  postagem: `Postagem ${n}`, data: "", tema: "", briefing: "",
  formato: "", rede: "", responsavel: "", status: "Planejado",
  observacoes: "", mes,
});

// ─── Supabase helpers ──────────────────────────────────────────────────────
async function dbLoad(mes: number): Promise<Row[]> {
  const res = await fetch(`${TABLE}?mes=eq.${mes}&select=*&order=created_at.asc`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbUpsert(row: Row): Promise<void> {
  await fetch(`${TABLE}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  });
}

async function dbDelete(id: string): Promise<void> {
  await fetch(`${TABLE}?id=eq.${id}`, { method: "DELETE", headers: { ...HEADERS, "Prefer": "return=minimal" } });
}

// ─── EditableCell ──────────────────────────────────────────────────────────
interface EditableCellProps {
  value: string;
  onChange: (val: string) => void;
  type?: "text" | "select" | "select-simple";
  options?: readonly string[];
  placeholder?: string;
  wide?: boolean;
}

function EditableCell({ value, onChange, type = "text", options, placeholder, wide }: EditableCellProps) {
  const [editing, setEditing] = useState(false);

  if (type === "select") {
    const c = STATUS_COLORS[value as Status] ?? { bg: "#2d1b69", text: "#c9a0f5", border: "#6b3fa0" };
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        borderRadius: 6, padding: "4px 8px", fontSize: 12,
        fontFamily: "'Cinzel', serif", fontWeight: 700,
        cursor: "pointer", width: "100%", outline: "none",
      }}>
        {options!.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (type === "select-simple") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a",
        borderRadius: 6, padding: "4px 6px", fontSize: 12,
        fontFamily: "'Cinzel', serif", cursor: "pointer", width: "100%", outline: "none",
      }}>
        <option value="">--</option>
        {options!.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return editing ? (
    <textarea autoFocus value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      placeholder={placeholder}
      style={{
        width: "100%", minHeight: wide ? 60 : 32,
        background: "#1a0d3a", color: "#e2d0ff",
        border: "1px solid #7c3aed", borderRadius: 6,
        padding: "4px 8px", fontSize: 12,
        fontFamily: "'Lato', sans-serif", resize: "vertical",
        outline: "none", boxSizing: "border-box",
      }}
    />
  ) : (
    <div onClick={() => setEditing(true)} title="Clique para editar"
      style={{
        minHeight: 28, padding: "4px 6px",
        color: value ? "#e2d0ff" : "#5a3a8a", fontSize: 12,
        fontFamily: "'Lato', sans-serif", cursor: "text",
        borderRadius: 4, transition: "background 0.15s",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#2d1b69")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {value || <span style={{ fontStyle: "italic", opacity: 0.4 }}>{placeholder ?? "—"}</span>}
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [rows, setRows]               = useState<Row[]>([]);
  const [mes, setMes]                 = useState(new Date().getMonth());
  const [filter, setFilter]           = useState("Todos");
  const [filterRede, setFilterRede]   = useState("Todos");
  const [loading, setLoading]         = useState(true);
  const [syncStatus, setSyncStatus]   = useState<"ok" | "saving" | "error">("ok");
  const pendingUpserts                = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load rows for the selected month
  const loadRows = useCallback(async (m: number) => {
    setLoading(true);
    try {
      const data = await dbLoad(m);
      setRows(data);
    } catch { setSyncStatus("error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRows(mes); }, [mes, loadRows]);

  // Poll every 12s for changes made by other users
  useEffect(() => {
    const interval = setInterval(() => loadRows(mes), 12000);
    return () => clearInterval(interval);
  }, [mes, loadRows]);

  // Debounced upsert on any row change
  const scheduleUpsert = useCallback((row: Row) => {
    setSyncStatus("saving");
    const existing = pendingUpserts.current.get(row.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      try {
        await dbUpsert(row);
        setSyncStatus("ok");
      } catch { setSyncStatus("error"); }
      pendingUpserts.current.delete(row.id);
    }, 900);
    pendingUpserts.current.set(row.id, t);
  }, []);

  const updateRow = (id: string, key: keyof Row, val: string) => {
    setRows(prev => {
      const next = prev.map(r => r.id === id ? { ...r, [key]: val } : r);
      const updated = next.find(r => r.id === id);
      if (updated) scheduleUpsert(updated);
      return next;
    });
  };

  const addRow = async () => {
    const row = makeRow(rows.length + 1, mes);
    setRows(prev => [...prev, row]);
    try { await dbUpsert(row); } catch { setSyncStatus("error"); }
  };

  const removeRow = async (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
    try { await dbDelete(id); } catch { setSyncStatus("error"); }
  };

  const filtered = rows.filter(r =>
    (filter === "Todos" || r.status === filter) &&
    (filterRede === "Todos" || r.rede === filterRede || r.rede === "Todos")
  );

  const selectStyle: React.CSSProperties = {
    background: "#1a0d3a", color: "#c9a0f5", border: "1px solid #4a2a8a",
    borderRadius: 8, padding: "7px 12px", fontFamily: "'Cinzel', serif",
    fontSize: 12, cursor: "pointer", outline: "none",
  };

  const syncLabel = syncStatus === "saving" ? "Salvando..." : syncStatus === "error" ? "⚠ Erro de conexão" : "✓ Sincronizado";
  const syncColor = syncStatus === "saving" ? "#c084fc" : syncStatus === "error" ? "#f87171" : "#6ee7b7";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0720 0%, #1a0d3a 40%, #0d0720 100%)",
      fontFamily: "'Lato', sans-serif", color: "#e2d0ff", padding: "24px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0d0720; }
        ::-webkit-scrollbar-thumb { background: #4a2a8a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes glow  { 0%,100%{box-shadow:0 0 20px #7c3aed44} 50%{box-shadow:0 0 40px #7c3aed88} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>

      {/* HEADER */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20, marginBottom: 22,
        borderBottom: "2px solid #4a2a8a", paddingBottom: 18, flexWrap: "wrap",
      }}>
        <div style={{ animation: "float 4s ease-in-out infinite", fontSize: 48 }}>🎲</div>
        <div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 900,
            background: "linear-gradient(90deg, #c084fc, #818cf8, #a855f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2,
          }}>Criando XP</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7c3aed", letterSpacing: 4, textTransform: "uppercase" }}>
            Calendário de Postagem
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, color: syncColor,
            animation: syncStatus === "saving" ? "blink 1s infinite" : "none",
          }}>
            {syncLabel}
          </span>
          <span style={{ fontSize: 10, color: "#3d1b69" }}>• atualiza a cada 12s</span>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
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
        <button onClick={() => loadRows(mes)} style={{
          background: "#1a0d3a", color: "#c084fc", border: "1px solid #4a2a8a",
          borderRadius: 8, padding: "7px 14px", fontFamily: "'Cinzel', serif",
          fontSize: 11, cursor: "pointer",
        }}>⟳ Atualizar</button>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        {STATUS_OPTIONS.map(s => {
          const c = STATUS_COLORS[s];
          return (
            <div key={s} style={{
              background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
              padding: "8px 16px", display: "flex", flexDirection: "column", alignItems: "center",
              minWidth: 80, animation: "glow 3s ease-in-out infinite",
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: c.text, fontFamily: "'Cinzel', serif" }}>
                {rows.filter(r => r.status === s).length}
              </span>
              <span style={{ fontSize: 10, color: c.text, opacity: 0.8 }}>{s}</span>
            </div>
          );
        })}
        <div style={{
          background: "#1a0d3a", border: "1px solid #4a2a8a", borderRadius: 10,
          padding: "8px 16px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80,
        }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#c084fc", fontFamily: "'Cinzel', serif" }}>{rows.length}</span>
          <span style={{ fontSize: 10, color: "#c084fc", opacity: 0.8 }}>Total</span>
        </div>
      </div>

      {/* TABLE */}
      <div style={{
        overflowX: "auto", borderRadius: 16, border: "1px solid #4a2a8a",
        animation: "glow 4s ease-in-out infinite", position: "relative",
      }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0, background: "#0d072099",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10, borderRadius: 16,
          }}>
            <div style={{
              width: 32, height: 32, border: "3px solid #4a2a8a",
              borderTop: "3px solid #c084fc", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        )}
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "linear-gradient(90deg, #2d1b69, #3d1b8a, #2d1b69)" }}>
              <th style={{ width: 36, padding: "12px 8px", borderRight: "1px solid #4a2a8a" }} />
              {COLS.map(col => (
                <th key={col.key} style={{
                  width: col.width, padding: "12px 10px", textAlign: "left",
                  fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
                  color: "#c084fc", letterSpacing: 1, textTransform: "uppercase",
                  borderRight: "1px solid #4a2a8a", whiteSpace: "nowrap",
                }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 1} style={{
                  padding: 48, textAlign: "center", color: "#5a3a8a",
                  fontFamily: "'Cinzel', serif", fontSize: 13,
                }}>
                  {rows.length === 0 ? "Nenhuma postagem ainda. Clique em + Adicionar." : "Nenhuma postagem com esse filtro."}
                </td>
              </tr>
            )}
            {filtered.map((row, idx) => (
              <tr key={row.id}
                style={{ background: idx % 2 === 0 ? "#110828" : "#0d0720", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1e0f45")}
                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#110828" : "#0d0720")}
              >
                <td style={{
                  padding: "6px 4px", textAlign: "center",
                  borderRight: "1px solid #2d1b69", borderBottom: "1px solid #1e0f45",
                  fontSize: 10, color: "#5a3a8a",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span>{idx + 1}</span>
                    <button onClick={() => removeRow(row.id)}
                      style={{ background: "none", border: "none", color: "#5a3a8a", cursor: "pointer", fontSize: 12, padding: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#5a3a8a")}
                    >✕</button>
                  </div>
                </td>
                {COLS.map(col => (
                  <td key={col.key} style={{
                    padding: "4px 6px", borderRight: "1px solid #1e0f45",
                    borderBottom: "1px solid #1e0f45", verticalAlign: "top",
                  }}>
                    <EditableCell
                      value={String(row[col.key] ?? "")}
                      onChange={val => updateRow(row.id, col.key, val)}
                      type={col.type} options={col.options}
                      placeholder={col.placeholder} wide={col.wide}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD ROW */}
      <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={addRow} style={{
          background: "linear-gradient(135deg, #4a2a8a, #7c3aed)", color: "#fff",
          border: "none", borderRadius: 10, padding: "10px 24px",
          fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
          cursor: "pointer", letterSpacing: 1, transition: "all 0.2s",
          boxShadow: "0 4px 15px #7c3aed44",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px #7c3aed66"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px #7c3aed44"; }}
        >+ Adicionar Postagem</button>
        <span style={{ color: "#5a3a8a", fontSize: 11 }}>
          Clique em qualquer célula para editar · salvo automaticamente no banco
        </span>
      </div>

      <div style={{
        marginTop: 36, textAlign: "center", color: "#3d1b69",
        fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: 2,
      }}>
        🎲 CRIANDO XP · CALENDÁRIO DE CONTEÚDO · {MONTHS[mes].toUpperCase()}
      </div>
    </div>
  );
}