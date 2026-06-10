import { useState, useEffect } from "react";

// ─── Supabase ──────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://zovgkatndrgzxocwpdjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";
const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  postagem: string;
  data: string;
  tema: string;
  formato: string;
  rede: string;
  status: string;
  link_arquivo: string;
  observacoes: string;
}

interface Revisao {
  postagem_id: string;
  status: "aprovado" | "rejeitado";
  comentario: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const REDE_ICONS: Record<string, string> = {
  "Instagram": "📸",
  "TikTok":    "🎵",
  "YouTube":   "▶️",
  "Twitter/X": "𝕏",
  "Facebook":  "👤",
  "Todos":     "🌐",
};

function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [d, m, y] = dateStr.split("/");
  if (!d || !m || !y) return null;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return isNaN(date.getTime()) ? null : date;
}

function driveFileId(url: string): string | null {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
  
  function drivePreviewUrl(url: string): string | null {
    const id = driveFileId(url);
    if (id) return `https://drive.google.com/file/d/${id}/preview`;
    return url.startsWith("http") ? url : null;
  }
  
  function driveThumbnailUrl(url: string): string | null {
    const id = driveFileId(url);
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : null;
  }

// ─── Supabase ops ──────────────────────────────────────────────────────────
async function loadPostsDoMes(mes: number): Promise<Post[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/postagens?select=*`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
  const all: Post[] = await res.json();
  return all.filter(r => {
    if (!r.link_arquivo) return false; // só mostra posts com arquivo
    const d = parseDateBR(r.data);
    return d ? d.getMonth() === mes : false;
  });
}

async function loadRevisoesDoMes(): Promise<Revisao[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/revisoes?select=*`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function salvarRevisao(revisao: Revisao): Promise<void> {
  // Tenta atualizar primeiro, se não existir insere
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/revisoes?postagem_id=eq.${revisao.postagem_id}`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
  );
  const existing = await checkRes.json();

  if (existing.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/revisoes?postagem_id=eq.${revisao.postagem_id}`, {
      method: "PATCH",
      headers: { ...HEADERS, "Prefer": "return=minimal" },
      body: JSON.stringify({ status: revisao.status, comentario: revisao.comentario }),
    });
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/revisoes`, {
      method: "POST",
      headers: { ...HEADERS, "Prefer": "return=minimal" },
      body: JSON.stringify(revisao),
    });
  }
}

// ─── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d0720; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0d0720; }
  ::-webkit-scrollbar-thumb { background: #4a2a8a; border-radius: 4px; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes popIn   { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

// ─── PostCard do cliente ───────────────────────────────────────────────────
function PostCardCliente({
  post,
  revisao,
  onRevisar,
  isMobile,
}: {
  post: Post;
  revisao: Revisao | null;
  onRevisar: (id: string, status: "aprovado" | "rejeitado", comentario: string) => void;
  isMobile: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [comentario, setComentario] = useState(revisao?.comentario ?? "");
  const [salvando, setSalvando] = useState(false);
  const [feedbackLocal, setFeedbackLocal] = useState<"aprovado" | "rejeitado" | null>(
    revisao?.status ?? null
  );

  const previewUrl = drivePreviewUrl(post.link_arquivo);
  const thumb = driveThumbnailUrl(post.link_arquivo);

  const handleAcao = async (status: "aprovado" | "rejeitado") => {
    setSalvando(true);
    setFeedbackLocal(status);
    await onRevisar(post.id, status, comentario);
    setSalvando(false);
  };

  const jaRevisado = feedbackLocal !== null;

  return (
    <div style={{
      background: "linear-gradient(135deg,#1a0d3a,#110828)",
      border: `1px solid ${jaRevisado ? (feedbackLocal === "aprovado" ? "#16a34a" : "#dc2626") : "#4a2a8a"}`,
      borderLeft: `4px solid ${jaRevisado ? (feedbackLocal === "aprovado" ? "#16a34a" : "#dc2626") : "#7c3aed"}`,
      borderRadius: 14,
      overflow: "hidden",
      animation: "fadeUp 0.4s ease both",
    }}>

      {/* Thumbnail clicável */}
      <div
        onClick={() => previewUrl && setPreviewOpen(true)}
        style={{
          position: "relative",
          background: "#0d0720",
          cursor: previewUrl ? "pointer" : "default",
          minHeight: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {thumb ? (
          <img
            src={thumb}
            alt="preview"
            style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📎</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: "#5a3a8a" }}>
              Clique para visualizar o arquivo
            </div>
          </div>
        )}

        {previewUrl && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
          >
            <div style={{
              background: "rgba(124,58,237,0.9)", borderRadius: 50,
              width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 22 }}>▶</span>
            </div>
          </div>
        )}

        {/* Badge de status da revisão */}
        {jaRevisado && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: feedbackLocal === "aprovado" ? "#16a34a" : "#dc2626",
            color: "#fff", borderRadius: 20, padding: "4px 12px",
            fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 700,
          }}>
            {feedbackLocal === "aprovado" ? "✓ Aprovado" : "✕ Rejeitado"}
          </div>
        )}
      </div>

      {/* Info do post */}
      <div style={{ padding: isMobile ? "14px 12px" : "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#e2d0ff", marginBottom: 4 }}>
              {post.tema || post.postagem}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {post.rede && (
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: "#7c3aed" }}>
                  {REDE_ICONS[post.rede] || ""} {post.rede}
                </span>
              )}
              {post.formato && (
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: "#5a3a8a" }}>
                  · {post.formato}
                </span>
              )}
              {post.data && (
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: "#5a3a8a" }}>
                  · 📅 {post.data}
                </span>
              )}
            </div>
          </div>
          {post.link_arquivo && (
            <a
              href={post.link_arquivo}
              target="_blank"
              rel="noreferrer"
              style={{
                flexShrink: 0,
                background: "#1a0d3a", border: "1px solid #4a2a8a",
                borderRadius: 8, color: "#c9a0f5",
                padding: "6px 10px", fontSize: 11,
                fontFamily: "'Cinzel',serif", textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Abrir ↗
            </a>
          )}
        </div>

        {post.observacoes && (
          <div style={{
            background: "#0d0720", border: "1px solid #2d1b69",
            borderRadius: 8, padding: "8px 12px", marginBottom: 12,
            fontFamily: "'Lato',sans-serif", fontSize: 12, color: "#a78bfa",
            fontStyle: "italic",
          }}>
            {post.observacoes}
          </div>
        )}

        {/* Área de comentário */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, color: "#5a3a8a", letterSpacing: 1, marginBottom: 6 }}>
            COMENTÁRIO (OPCIONAL)
          </div>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Ex: ajustar cor do texto, trocar a legenda..."
            rows={2}
            style={{
              width: "100%", background: "#0d0720",
              border: "1px solid #2d1b69", borderRadius: 8,
              color: "#e2d0ff", fontFamily: "'Lato',sans-serif", fontSize: 13,
              padding: "8px 12px", outline: "none", resize: "vertical",
            }}
          />
        </div>

        {/* Botões */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => handleAcao("aprovado")}
            disabled={salvando}
            style={{
              flex: 1,
              background: feedbackLocal === "aprovado"
                ? "linear-gradient(135deg,#16a34a,#15803d)"
                : "linear-gradient(135deg,#1a3a1a,#1f4a1f)",
              border: `1px solid ${feedbackLocal === "aprovado" ? "#16a34a" : "#2d4a2d"}`,
              color: feedbackLocal === "aprovado" ? "#fff" : "#86efac",
              borderRadius: 10, padding: "12px",
              fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700,
              cursor: salvando ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: salvando ? 0.7 : 1,
            }}
          >
            {salvando && feedbackLocal === "aprovado" ? "..." : "✓ Aprovar"}
          </button>
          <button
            onClick={() => handleAcao("rejeitado")}
            disabled={salvando}
            style={{
              flex: 1,
              background: feedbackLocal === "rejeitado"
                ? "linear-gradient(135deg,#dc2626,#b91c1c)"
                : "linear-gradient(135deg,#3a1a1a,#4a1a1a)",
              border: `1px solid ${feedbackLocal === "rejeitado" ? "#dc2626" : "#5a2a2a"}`,
              color: feedbackLocal === "rejeitado" ? "#fff" : "#fca5a5",
              borderRadius: 10, padding: "12px",
              fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700,
              cursor: salvando ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: salvando ? 0.7 : 1,
            }}
          >
            {salvando && feedbackLocal === "rejeitado" ? "..." : "✕ Pedir ajuste"}
          </button>
        </div>
      </div>

      {/* Modal de preview */}
      {previewOpen && previewUrl && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.9)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 900,
              background: "#0d0720", borderRadius: 16,
              border: "1px solid #4a2a8a", overflow: "hidden",
              animation: "popIn 0.2s ease",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", borderBottom: "1px solid #2d1b69",
            }}>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: "#c084fc" }}>
                📎 {post.tema || post.postagem}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={post.link_arquivo} target="_blank" rel="noreferrer"
                  style={{
                    background: "#1a0d3a", border: "1px solid #4a2a8a",
                    borderRadius: 6, color: "#c9a0f5", fontSize: 11,
                    padding: "5px 10px", fontFamily: "'Cinzel',serif", textDecoration: "none",
                  }}
                >
                  Abrir no Drive ↗
                </a>
                <button
                  onClick={() => setPreviewOpen(false)}
                  style={{
                    background: "none", border: "1px solid #4a2a8a",
                    borderRadius: 6, color: "#5a3a8a", cursor: "pointer",
                    padding: "5px 10px", fontFamily: "'Cinzel',serif", fontSize: 12,
                  }}
                >✕</button>
              </div>
            </div>
            <iframe
              src={previewUrl}
              style={{ width: "100%", height: "70vh", border: "none" }}
              allow="autoplay"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function RevisaoCliente() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [revisoes, setRevisoes] = useState<Record<string, Revisao>>({});
  const [mes, setMes] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    setLoading(true);
    setErro("");
    Promise.all([loadPostsDoMes(mes), loadRevisoesDoMes()])
          .then(([ps, rs]) => {
        setPosts(ps);
        const map: Record<string, Revisao> = {};
        rs.forEach(r => { map[r.postagem_id] = r; });
        setRevisoes(map);
      })
      .catch(() => setErro("Não foi possível carregar os posts."))
      .finally(() => setLoading(false));
  }, [mes]);

  const handleRevisar = async (
    id: string,
    status: "aprovado" | "rejeitado",
    comentario: string
  ) => {
    const rev: Revisao = { postagem_id: id, status, comentario };
    await salvarRevisao(rev);
    setRevisoes(prev => ({ ...prev, [id]: rev }));
  };

  const aprovados  = Object.values(revisoes).filter(r => r.status === "aprovado").length;
  const rejeitados = Object.values(revisoes).filter(r => r.status === "rejeitado").length;
  const pendentes  = posts.length - aprovados - rejeitados;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0d0720 0%,#1a0d3a 50%,#0d0720 100%)",
        color: "#e2d0ff",
        padding: isMobile ? "16px 12px" : "32px 24px",
        maxWidth: 960,
        margin: "0 auto",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#c084fc)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            animation: "float 4s ease-in-out infinite",
          }}>
            <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: 44, height: 44, objectFit: "contain" }} />
          </div>
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: isMobile ? 22 : 28, fontWeight: 900,
            background: "linear-gradient(90deg,#c084fc,#818cf8,#a855f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 2, marginBottom: 6,
          }}>
            Criando XP
          </div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: "#7c3aed", letterSpacing: 3 }}>
            REVISÃO DE CONTEÚDO
          </div>
        </div>

        {/* Seletor de mês */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            style={{
              background: "#1a0d3a", color: "#c9a0f5",
              border: "1px solid #4a2a8a", borderRadius: 10,
              padding: "10px 20px", fontFamily: "'Cinzel',serif",
              fontSize: 14, cursor: "pointer", outline: "none",
            }}
          >
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>

        {/* Stats */}
        {!loading && posts.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: 10, marginBottom: 28,
          }}>
            {[
              { label: "Pendentes",  val: pendentes,  color: "#c084fc", bg: "#3d2068", border: "#6b3fa0" },
              { label: "Aprovados",  val: aprovados,  color: "#86efac", bg: "#1a3a1a", border: "#16a34a" },
              { label: "Ajustes",    val: rejeitados, color: "#fca5a5", bg: "#3a1a1a", border: "#dc2626" },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: 12, padding: "12px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.val}</div>
                <div style={{ fontSize: 9, color: s.color, opacity: 0.8, fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 36, height: 36, border: "3px solid #4a2a8a", borderTop: "3px solid #c084fc", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div style={{
            background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 12, padding: "20px 24px", textAlign: "center",
          }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: "#fca5a5" }}>⚠ {erro}</div>
          </div>
        )}

        {/* Sem posts */}
        {!loading && !erro && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 16, color: "#5a3a8a", marginBottom: 8 }}>
              Nenhum conteúdo para revisar
            </div>
            <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: "#3d1b69" }}>
              Ainda não há posts com arquivos em {MONTHS[mes]}.
            </div>
          </div>
        )}

        {/* Grid de posts */}
        {!loading && posts.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)",
            gap: 16,
          }}>
            {posts.map(post => (
              <PostCardCliente
                key={post.id}
                post={post}
                revisao={revisoes[post.id] ?? null}
                onRevisar={handleRevisar}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}

        {/* Rodapé */}
        <div style={{
          marginTop: 40, textAlign: "center",
          fontFamily: "'Cinzel',serif", fontSize: 9,
          color: "#3d1b69", letterSpacing: 2,
        }}>
          🎲 CRIANDO XP · PORTAL DE REVISÃO
        </div>
      </div>
    </>
  );
}