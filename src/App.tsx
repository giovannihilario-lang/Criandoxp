import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://zovgkatndrgzxocwpdjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";
const H = { "Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}` };
const TABLE    = `${SUPABASE_URL}/rest/v1/postagens`;
const LEADS_TB = `${SUPABASE_URL}/rest/v1/clientes`;
const DASHBOARD_PWD = btoa("CriandoXP2025"); // elevandonivel120

// ─── Routing ───────────────────────────────────────────────────────────────
function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const h = () => setHash(window.location.hash);
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return hash;
}

// ─── Global styles ─────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&family=Black+Ops+One&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #080010; }
  ::-webkit-scrollbar-thumb { background: #4a2a8a; border-radius: 4px; }
  input::placeholder, textarea::placeholder { color: #5a3a8a; }
  select, button, input, textarea { -webkit-tap-highlight-color: transparent; }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes glow      { 0%,100%{box-shadow:0 0 20px #7c3aed44} 50%{box-shadow:0 0 50px #7c3aed88,0 0 80px #e879f922} }
  @keyframes glow-pink { 0%,100%{box-shadow:0 0 20px #e879f944} 50%{box-shadow:0 0 50px #e879f988} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse-red    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
  @keyframes pulse-yellow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)} 50%{box-shadow:0 0 0 6px rgba(245,158,11,0)} }
  @keyframes slide-up  { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fade-in   { from{opacity:0} to{opacity:1} }
  @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
`;

// ─── Landing helpers ────────────────────────────────────────────────────────
const GRID_BG: React.CSSProperties = {
  background: "#080010",
  backgroundImage: `
    linear-gradient(rgba(124,58,237,0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,58,237,0.12) 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
};

const GRAD_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #c084fc 0%, #e879f9 50%, #f0abfc 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const SISTEMAS = ["D&D","Pathfinder","Tormenta20","Vampire","Ordem Paranormal","Call of Cthulhu","Outro"];
const DIAS     = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const TEMPO_RPG_OPTS = ["Nunca joguei","Menos de 1 ano","De 1 a 4 anos","Mais de 5 anos"];
const PERIODO_OPTS   = ["Manhã","Tarde","Noite"];
const SIM_NAO_OPTS   = ["Sim","Não","Tenho dúvidas"];

interface LeadForm {
  nome: string; idade: string; whatsapp_discord: string;
  tempo_rpg: string; sistemas_jogados: string[]; sistemas_desejados: string[];
  melhor_dia: string[]; melhor_periodo: string;
  ciente_valores: string; ciente_compromisso: string; ciente_contrato: string;
  ciente_taxa: string; ciente_tolerancia: string; ciente_consentimento: string;
  pronto_ingressar: string; codigo_desconto: string;
}

const EMPTY_FORM: LeadForm = {
  nome:"", idade:"", whatsapp_discord:"",
  tempo_rpg:"", sistemas_jogados:[], sistemas_desejados:[],
  melhor_dia:[], melhor_periodo:"",
  ciente_valores:"", ciente_compromisso:"", ciente_contrato:"",
  ciente_taxa:"", ciente_tolerancia:"", ciente_consentimento:"",
  pronto_ingressar:"", codigo_desconto:"",
};

function CheckGroup({ label, options, value, onChange }: {
  label: string; options: string[];
  value: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt]);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: "#c084fc", fontFamily: "'Cinzel',serif", marginBottom: 10, letterSpacing: 1 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(opt => {
          const checked = value.includes(opt);
          return (
            <button key={opt} onClick={() => toggle(opt)} type="button" style={{
              background: checked ? "linear-gradient(135deg,#4a2a8a,#7c3aed)" : "#0d0720",
              color: checked ? "#fff" : "#7a5aa0",
              border: checked ? "1px solid #7c3aed" : "1px solid #3d1b69",
              borderRadius: 20, padding: "7px 14px", fontSize: 12,
              fontFamily: "'Lato',sans-serif", cursor: "pointer",
              transition: "all 0.2s",
            }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange, sub }: {
  label: string; options: string[]; value: string;
  onChange: (v: string) => void; sub?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: "#c084fc", fontFamily: "'Cinzel',serif", marginBottom: sub ? 4 : 10, letterSpacing: 1 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#5a3a8a", fontFamily: "'Lato',sans-serif", marginBottom: 10, lineHeight: 1.5 }}>{sub}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(opt => {
          const sel = value === opt;
          return (
            <button key={opt} onClick={() => onChange(opt)} type="button" style={{
              background: sel ? "linear-gradient(135deg,#4a2a8a,#7c3aed)" : "#0d0720",
              color: sel ? "#fff" : "#7a5aa0",
              border: sel ? "1px solid #7c3aed" : "1px solid #3d1b69",
              borderRadius: 20, padding: "7px 18px", fontSize: 12,
              fontFamily: "'Lato',sans-serif", cursor: "pointer", transition: "all 0.2s",
            }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type="text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: "#c084fc", fontFamily: "'Cinzel',serif", marginBottom: 8, letterSpacing: 1 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", background: "#0d0720", color: "#e2d0ff",
          border: "1px solid #3d1b69", borderRadius: 10, padding: "12px 14px",
          fontSize: 14, fontFamily: "'Lato',sans-serif", outline: "none", transition: "border 0.2s",
        }}
        onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
        onBlur={e => (e.currentTarget.style.borderColor = "#3d1b69")}
      />
    </div>
  );
}

// ─── LANDING PAGE ──────────────────────────────────────────────────────────
function LandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof LeadForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const validateStep1 = () => {
    if (!form.nome.trim()) return "Preencha seu nome.";
    if (!form.idade.trim()) return "Preencha sua idade.";
    if (!form.whatsapp_discord.trim()) return "Preencha WhatsApp e Discord.";
    if (!form.tempo_rpg) return "Selecione sua experiência com RPG.";
    if (form.melhor_dia.length === 0) return "Selecione pelo menos um dia.";
    if (!form.melhor_periodo) return "Selecione um período.";
    return "";
  };

  const validateStep2 = () => {
    const fields: (keyof LeadForm)[] = ["ciente_valores","ciente_compromisso","ciente_contrato","ciente_taxa","ciente_tolerancia","ciente_consentimento"];
    for (const f of fields) if (!form[f]) return "Responda todas as perguntas de ciência.";
    return "";
  };

  const validateStep3 = () => {
    if (!form.pronto_ingressar) return "Indique se está pronto para ingressar.";
    return "";
  };

  const next = () => {
    setError("");
    if (step === 1) { const e = validateStep1(); if (e) { setError(e); return; } }
    if (step === 2) { const e = validateStep2(); if (e) { setError(e); return; } }
    setStep(s => s + 1);
  };

  const submit = async () => {
    const e = validateStep3();
    if (e) { setError(e); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        sistemas_jogados:  form.sistemas_jogados.join(", "),
        sistemas_desejados: form.sistemas_desejados.join(", "),
        melhor_dia:        form.melhor_dia.join(", "),
        status: "Novo lead",
      };
      const res = await fetch(LEADS_TB, {
        method: "POST",
        headers: { ...H, "Prefer": "return=minimal" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (err: any) {
      setError("Erro ao enviar. Tente novamente ou entre em contato pelo Instagram.");
    } finally {
      setSubmitting(false);
    }
  };

  const BENEFITS = [
    { icon: "📜", title: "Mesas com Contrato", desc: "Nunca mais veja sua campanha ser abandonada" },
    { icon: "🎟", title: "Sessão Zero Gratuita", desc: "Inicie sua aventura de graça" },
    { icon: "🛡", title: "Espaço Seguro", desc: "100% inclusivo — PcD, LGBTQIA+ e mulheres" },
    { icon: "🗓", title: "Eventos Semanais", desc: "Na comunidade, toda semana" },
    { icon: "🌱", title: "Apoiamos Iniciantes", desc: "Nunca jogou? Comece aqui" },
    { icon: "🎨", title: "Arte Profissional", desc: "Ilustrações de alta qualidade" },
    { icon: "🧠", title: "Apoio Psicológico", desc: "Suporte com profissionais da saúde" },
    { icon: "💰", title: "Combos & Descontos", desc: "Pague menos em mais mesas" },
  ];

  const SISTEMAS_DISPLAY = [
    { name: "D&D", icon: "⚔️" },
    { name: "Vampire", icon: "🧛" },
    { name: "Ordem Paranormal", icon: "👁" },
    { name: "Call of Cthulhu", icon: "🐙" },
    { name: "Tormenta20", icon: "⚡" },
    { name: "Pathfinder", icon: "🗺" },
  ];

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #1a0030 0%, #0d0020 100%)",
    border: "1px solid rgba(124,58,237,0.35)",
    borderRadius: 16,
    padding: "24px 20px",
    animation: "glow 4s ease-in-out infinite",
  };

  return (
    <div style={{ ...GRID_BG, minHeight: "100vh", color: "#fff", fontFamily: "'Lato',sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,0,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(124,58,237,0.2)",
        padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 16, ...GRAD_TEXT }}>Criando XP</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="https://instagram.com/CriandoXP" target="_blank" rel="noreferrer"
            style={{ color: "#7c3aed", fontSize: 12, fontFamily: "'Cinzel',serif", textDecoration: "none", letterSpacing: 1 }}>
            @CriandoXP
          </a>
          <button onClick={scrollToForm} style={{
            background: "linear-gradient(135deg,#7c3aed,#e879f9)",
            color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px",
            fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
          }}>Inscrever-se</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "80px 20px 60px", animation: "slide-up 0.8s ease both" }}>
        <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: 100, height: 100, objectFit: "contain", animation: "float 4s ease-in-out infinite", marginBottom: 24 }} />
        <div style={{ fontFamily: "'Black Ops One',sans-serif", fontSize: "clamp(36px,7vw,80px)", lineHeight: 1.1, marginBottom: 16, ...GRAD_TEXT }}>
          MESAS DE RPG
        </div>
        <div style={{ fontFamily: "'Black Ops One',sans-serif", fontSize: "clamp(28px,5vw,64px)", lineHeight: 1.1, color: "#fff", marginBottom: 24 }}>
          PROFISSIONAL
        </div>
        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(232,121,249,0.3))",
          border: "1px solid rgba(232,121,249,0.5)", borderRadius: 30,
          padding: "10px 28px", fontSize: 18, color: "#f0abfc",
          fontFamily: "'Cinzel',serif", marginBottom: 40, letterSpacing: 1,
        }}>
          🎲 A partir de R$ 20,00 a sessão
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={scrollToForm} style={{
            background: "linear-gradient(135deg,#7c3aed,#e879f9)",
            color: "#fff", border: "none", borderRadius: 30, padding: "16px 40px",
            fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 700, cursor: "pointer",
            letterSpacing: 2, boxShadow: "0 0 40px rgba(232,121,249,0.4)",
            transition: "transform 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >⚔️ INSCREVER-SE AGORA</button>
          <button onClick={() => window.location.hash = "#/dashboard"} style={{
            background: "transparent", color: "#5a3a8a",
            border: "1px solid #3d1b69", borderRadius: 30, padding: "16px 40px",
            fontFamily: "'Cinzel',serif", fontSize: 14, cursor: "pointer", letterSpacing: 1,
          }}>Dashboard →</button>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Black Ops One',sans-serif", fontSize: "clamp(22px,4vw,42px)", ...GRAD_TEXT, marginBottom: 8 }}>
            QUAIS SÃO OS BENEFÍCIOS?
          </div>
          <div style={{ color: "#5a3a8a", fontSize: 14 }}>Tudo que você ganha ao fazer parte da Criando XP</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {BENEFITS.map(b => (
            <div key={b.title} style={{ ...cardStyle, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{b.icon}</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 13, color: "#c084fc", marginBottom: 6, letterSpacing: 1 }}>{b.title}</div>
              <div style={{ fontSize: 12, color: "#7a5aa0", lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SISTEMAS */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: 4, color: "#7c3aed", marginBottom: 8, textTransform: "uppercase" }}>Nossos sistemas</div>
          <div style={{ fontFamily: "'Black Ops One',sans-serif", fontSize: "clamp(18px,3vw,32px)", color: "#fff" }}>VOCÊ ESCOLHE A AVENTURA</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {SISTEMAS_DISPLAY.map(s => (
            <div key={s.name} style={{
              background: "linear-gradient(135deg,#1a0030,#0d0020)",
              border: "1px solid rgba(124,58,237,0.4)", borderRadius: 12,
              padding: "14px 22px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: "#c084fc", fontWeight: 700 }}>{s.name}</span>
            </div>
          ))}
          <div style={{
            background: "linear-gradient(135deg,#1a0030,#0d0020)",
            border: "1px solid rgba(124,58,237,0.4)", borderRadius: 12,
            padding: "14px 22px", fontFamily: "'Cinzel',serif", fontSize: 13, color: "#7c3aed", fontWeight: 700,
          }}>✦ Muito mais!</div>
        </div>
      </section>

      {/* SOBRE */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={cardStyle}>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 16, ...GRAD_TEXT, marginBottom: 16, letterSpacing: 1 }}>🎲 A Criando XP</div>
            <p style={{ color: "#a08ab0", lineHeight: 1.8, fontSize: 14 }}>
              A Criando XP é uma empresa de mesas de RPG comissionadas, que busca <strong style={{ color: "#c084fc" }}>profissionalizar mestres</strong> e criar um ambiente seguro, respeitoso, acolhedor e responsável para seus jogadores.
              <br /><br />
              Além de sempre prezar pela diversão de todos, também preza pelo <strong style={{ color: "#c084fc" }}>compromisso, responsabilidade e pontualidade</strong>, tanto com mestres quanto com jogadores.
            </p>
          </div>
          <div style={cardStyle}>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 16, ...GRAD_TEXT, marginBottom: 16, letterSpacing: 1 }}>💰 Valores & Cobranças</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Por sessão", val: "R$ 20 a R$ 25" },
                { label: "Média mensal", val: "R$ 80 a R$ 125" },
                { label: "Vencimento", val: "Todo dia 10" },
                { label: "Taxa de entrada", val: "4 sessões (abatida no final)" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a0030", paddingBottom: 8 }}>
                  <span style={{ color: "#7a5aa0", fontSize: 13 }}>{item.label}</span>
                  <span style={{ color: "#c084fc", fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 13 }}>{item.val}</span>
                </div>
              ))}
              <p style={{ color: "#5a3a8a", fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
                Não pode pagar a taxa? Entre sem ela e pague apenas se precisar sair da mesa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REGRAS */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 60px" }}>
        <div style={cardStyle}>
          <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 16, ...GRAD_TEXT, marginBottom: 20, letterSpacing: 1 }}>📜 Contrato & Regras</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {[
              { icon: "⚖️", title: "Integridade", desc: "Proibida qualquer forma de discriminação ou desrespeito. Comportamento antissocial pode resultar em expulsão." },
              { icon: "🤝", title: "Compromisso", desc: "Campanhas de 6 meses a 1 ano e meio. Sessões semanais de 3h em calendário fixo." },
              { icon: "📅", title: "Faltas", desc: "Faltas injustificadas são cobradas normalmente. Imprevistos fora do controle do jogador não são cobrados." },
              { icon: "💬", title: "Consentimento", desc: "Você recebe uma lista de consentimento para indicar gatilhos e temas que não quer na mesa." },
            ].map(r => (
              <div key={r.title} style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: "#c084fc", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "#7a5aa0", lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 12, color: "#fca5a5" }}>
            🔞 Idade mínima: 18 anos
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section ref={formRef} style={{ maxWidth: 700, margin: "0 auto", padding: "20px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Black Ops One',sans-serif", fontSize: "clamp(22px,4vw,40px)", ...GRAD_TEXT, marginBottom: 8 }}>
            PRONTO PARA A AVENTURA?
          </div>
          <div style={{ color: "#5a3a8a", fontSize: 14 }}>Preencha o formulário e entraremos em contato</div>
        </div>

        {done ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: "60px 30px", animation: "slide-up 0.5s ease both" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎲</div>
            <div style={{ fontFamily: "'Black Ops One',sans-serif", fontSize: 28, ...GRAD_TEXT, marginBottom: 12 }}>
              AVENTURA INICIADA!
            </div>
            <p style={{ color: "#a08ab0", fontSize: 14, lineHeight: 1.8, maxWidth: 400, margin: "0 auto 24px" }}>
              Recebemos sua inscrição! Em breve entraremos em contato pelo WhatsApp ou Discord para os próximos passos.
            </p>
            <p style={{ color: "#5a3a8a", fontSize: 12 }}>Siga <strong style={{ color: "#c084fc" }}>@CriandoXP</strong> para ficar por dentro das novidades!</p>
          </div>
        ) : (
          <div style={cardStyle}>
            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{
                  flex: 1, height: 4, borderRadius: 4,
                  background: s <= step ? "linear-gradient(90deg,#7c3aed,#e879f9)" : "#1a0030",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: "#5a3a8a", letterSpacing: 2, marginBottom: 24, textTransform: "uppercase" }}>
              Etapa {step} de 3
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <div style={{ animation: "slide-up 0.3s ease both" }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 900, ...GRAD_TEXT, marginBottom: 24 }}>📋 Seus Dados</div>
                <Input label="Seu nome completo *" value={form.nome} onChange={v => set("nome",v)} placeholder="Como devemos te chamar?" />
                <Input label="Sua idade *" value={form.idade} onChange={v => set("idade",v)} placeholder="Ex: 23" />
                <Input label="WhatsApp e @ do Discord *" value={form.whatsapp_discord} onChange={v => set("whatsapp_discord",v)} placeholder="(11) 99999-9999 / usuario#0000" />
                <RadioGroup label="Há quanto tempo você joga RPG de mesa? *" options={TEMPO_RPG_OPTS} value={form.tempo_rpg} onChange={v => set("tempo_rpg",v)} />
                <CheckGroup label="Quais sistemas você já jogou?" options={["Nunca joguei",...SISTEMAS]} value={form.sistemas_jogados} onChange={v => set("sistemas_jogados",v)} />
                <CheckGroup label="Quais sistemas gostaria de jogar conosco? *" options={SISTEMAS} value={form.sistemas_desejados} onChange={v => set("sistemas_desejados",v)} />
                <CheckGroup label="Qual é o seu melhor dia para jogar? *" options={DIAS} value={form.melhor_dia} onChange={v => set("melhor_dia",v)} />
                <RadioGroup label="Qual é o seu melhor período? *" options={PERIODO_OPTS} value={form.melhor_periodo} onChange={v => set("melhor_periodo",v)} />
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div style={{ animation: "slide-up 0.3s ease both" }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 900, ...GRAD_TEXT, marginBottom: 24 }}>📜 Termos & Ciência</div>
                <RadioGroup label="Você está ciente dos valores? *" options={SIM_NAO_OPTS} value={form.ciente_valores} onChange={v => set("ciente_valores",v)} sub="R$20–25 por sessão, pagamento mensal com vencimento todo dia 10." />
                <RadioGroup label="Você está disposto a assumir o compromisso? *" options={SIM_NAO_OPTS} value={form.ciente_compromisso} onChange={v => set("ciente_compromisso",v)} sub="Campanhas de 6 meses a 1 ano e meio, sessões semanais de 2h30 a 3h em calendário fixo." />
                <RadioGroup label="Você está ciente do contrato de responsabilidade? *" options={SIM_NAO_OPTS} value={form.ciente_contrato} onChange={v => set("ciente_contrato",v)} />
                <RadioGroup label="Você está ciente da taxa de entrada? *" options={SIM_NAO_OPTS} value={form.ciente_taxa} onChange={v => set("ciente_taxa",v)} sub="Equivalente a 4 sessões, abatida no último mês da campanha." />
                <RadioGroup label="Você está ciente da política de tolerância zero? *" options={["Sim","Não"]} value={form.ciente_tolerancia} onChange={v => set("ciente_tolerancia",v)} sub="Comportamentos antissociais, discriminação ou desrespeito resultam em encerramento da participação." />
                <RadioGroup label="Você está ciente da lista de consentimento? *" options={SIM_NAO_OPTS} value={form.ciente_consentimento} onChange={v => set("ciente_consentimento",v)} sub="Você poderá indicar gatilhos, tópicos sensíveis ou temas que não deseja abordar." />
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div style={{ animation: "slide-up 0.3s ease both" }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 900, ...GRAD_TEXT, marginBottom: 24 }}>⚔️ Ingresso</div>
                <RadioGroup label="Após revisar todos os termos, está preparado para ingressar na Criando XP? *" options={SIM_NAO_OPTS} value={form.pronto_ingressar} onChange={v => set("pronto_ingressar",v)} />
                <Input label="Código de desconto (opcional)" value={form.codigo_desconto} onChange={v => set("codigo_desconto",v)} placeholder="Válido apenas para o primeiro mês" />
                <div style={{ fontSize: 11, color: "#5a3a8a", lineHeight: 1.6, marginTop: -8, marginBottom: 20 }}>
                  * Códigos de desconto são válidos somente para o primeiro mês e não acumulativos com demais promoções.
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#fca5a5", marginBottom: 16 }}>
                ⚠ {error}
              </div>
            )}

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between", marginTop: 8 }}>
              {step > 1 ? (
                <button onClick={() => { setStep(s => s-1); setError(""); }} style={{
                  background: "transparent", color: "#7c3aed", border: "1px solid #3d1b69",
                  borderRadius: 10, padding: "12px 24px", fontFamily: "'Cinzel',serif",
                  fontSize: 13, cursor: "pointer", flex: 1,
                }}>← Voltar</button>
              ) : <div style={{ flex: 1 }} />}

              {step < 3 ? (
                <button onClick={next} style={{
                  background: "linear-gradient(135deg,#7c3aed,#e879f9)",
                  color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px",
                  fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", flex: 2, letterSpacing: 1,
                }}>Próximo →</button>
              ) : (
                <button onClick={submit} disabled={submitting} style={{
                  background: submitting ? "#2d1b69" : "linear-gradient(135deg,#7c3aed,#e879f9)",
                  color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px",
                  fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer", flex: 2, letterSpacing: 1,
                }}>
                  {submitting ? "Enviando..." : "⚔️ INGRESSAR NA CRIANDO XP"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(124,58,237,0.2)", padding: "30px 20px", textAlign: "center" }}>
        <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: 40, height: 40, objectFit: "contain", marginBottom: 8 }} />
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: "#3d1b69", letterSpacing: 3 }}>
          CRIANDO XP · MESAS DE RPG PROFISSIONAL
        </div>
        <div style={{ fontSize: 11, color: "#3d1b69", marginTop: 4 }}>
          <a href="https://instagram.com/CriandoXP" target="_blank" rel="noreferrer" style={{ color: "#5a3a8a", textDecoration: "none" }}>@CriandoXP</a>
        </div>
      </footer>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
// (Keeping all existing types, helpers and components below)

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const STATUS_OPTIONS = ["Planejado","Em produção","Agendado","Publicado","Cancelado"] as const;
const FORMATO_OPTIONS = ["Post","Reels","Story","Carrossel","Live","Shorts","Thread"];
const REDE_OPTIONS = ["Instagram","TikTok","YouTube","Twitter/X","Facebook","Todos"];
type Status = typeof STATUS_OPTIONS[number];
type ViewMode = "tabela" | "calendario";
type AppTab = "calendario" | "trafego" | "leads";

const REDE_ICONS: Record<string, string> = {
  "Instagram":"/icons/instagram.png","TikTok":"/icons/tiktok.png",
  "YouTube":"/icons/youtube.png","Twitter/X":"/icons/twitter.png",
  "Facebook":"/icons/facebook.png","Todos":"/icons/todos.png",
};

const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string; rowBg: string; calBg: string }> = {
  "Planejado":   { bg:"#3d2068",text:"#c9a0f5",border:"#6b3fa0",rowBg:"rgba(61,32,104,0.18)",calBg:"#3d2068dd" },
  "Em produção": { bg:"#2a1a5e",text:"#93c5fd",border:"#3b5bdb",rowBg:"rgba(42,26,94,0.22)",calBg:"#2a1a5edd" },
  "Agendado":    { bg:"#1e3a5f",text:"#6ee7b7",border:"#059669",rowBg:"rgba(30,58,95,0.22)",calBg:"#1e3a5fdd" },
  "Publicado":   { bg:"#1a3a1a",text:"#86efac",border:"#16a34a",rowBg:"rgba(26,58,26,0.22)",calBg:"#1a3a1add" },
  "Cancelado":   { bg:"#3a1a1a",text:"#fca5a5",border:"#dc2626",rowBg:"rgba(58,26,26,0.22)",calBg:"#3a1a1add" },
};

const LEAD_STATUS_OPTIONS = ["Novo lead","Contatado","Em negociação","Em mesa","Cancelado"];
const LEAD_STATUS_COLORS: Record<string,{bg:string;text:string;border:string}> = {
  "Novo lead":      { bg:"#3d2068",text:"#c9a0f5",border:"#6b3fa0" },
  "Contatado":      { bg:"#1e3a5f",text:"#6ee7b7",border:"#059669" },
  "Em negociação":  { bg:"#2a1a5e",text:"#93c5fd",border:"#3b5bdb" },
  "Em mesa":        { bg:"#1a3a1a",text:"#86efac",border:"#16a34a" },
  "Cancelado":      { bg:"#3a1a1a",text:"#fca5a5",border:"#dc2626" },
};

function parseDateBR(s: string): Date | null {
  if (!s) return null;
  const [d,m,y] = s.split("/");
  if (!d||!m||!y) return null;
  const dt = new Date(Number(y),Number(m)-1,Number(d));
  return isNaN(dt.getTime()) ? null : dt;
}

type Urgency = "hoje"|"amanha"|"em2"|"em3"|null;

function getUrgency(dateStr: string, status: Status): Urgency {
  if (status==="Publicado"||status==="Cancelado") return null;
  const date = parseDateBR(dateStr);
  if (!date) return null;
  const today = new Date(); today.setHours(0,0,0,0); date.setHours(0,0,0,0);
  const diff = Math.round((date.getTime()-today.getTime())/(1000*60*60*24));
  if (diff===0) return "hoje"; if (diff===1) return "amanha";
  if (diff===2) return "em2"; if (diff===3) return "em3"; return null;
}

const URGENCY_STYLES: Record<NonNullable<Urgency>,{border:string;rowBg:string;badge:string;badgeBg:string;badgeColor:string;anim:string}> = {
  hoje:   {border:"#ef4444",rowBg:"rgba(239,68,68,0.13)",badge:"HOJE",  badgeBg:"#ef4444",badgeColor:"#fff",   anim:"pulse-red 1s ease-in-out infinite"},
  amanha: {border:"#f59e0b",rowBg:"rgba(245,158,11,0.12)",badge:"AMANHÃ",badgeBg:"#f59e0b",badgeColor:"#1a0d3a",anim:"pulse-yellow 1.5s ease-in-out infinite"},
  em2:    {border:"#fcd34d",rowBg:"rgba(252,211,77,0.08)",badge:"2 DIAS",badgeBg:"#fcd34d",badgeColor:"#1a0d3a",anim:"none"},
  em3:    {border:"#6ee7b7",rowBg:"rgba(110,231,183,0.07)",badge:"3 DIAS",badgeBg:"#059669",badgeColor:"#fff",  anim:"none"},
};

interface Row {
  id:string; postagem:string; data:string; tema:string; briefing:string;
  formato:string; rede:string; responsavel:string; status:Status;
  observacoes:string; mes:number;
}

interface ColDef {
  key:keyof Row; label:string; width:number;
  type:"text"|"select"|"select-simple"|"select-rede";
  options?: readonly string[]; placeholder?:string; wide?:boolean;
}

const COLS: ColDef[] = [
  {key:"postagem",   label:"Postagem",    width:90,  type:"text",         placeholder:"Postagem"},
  {key:"data",       label:"📅 Data",     width:110, type:"text",         placeholder:"dd/mm/aaaa"},
  {key:"rede",       label:"🌐 Rede",      width:110, type:"select-simple",options:REDE_OPTIONS},
  {key:"formato",    label:"🎞 Formato",   width:110, type:"select-simple",options:FORMATO_OPTIONS},
  {key:"tema",       label:"✨ Tema",       width:160, type:"text",         placeholder:"Título / tema do post",wide:true},
  {key:"responsavel",label:"👤 Responsável",width:120,type:"text",         placeholder:"Nome"},
  {key:"status",     label:"🔮 Status",    width:130, type:"select",       options:STATUS_OPTIONS},
];

const makeRow = (n:number,mes:number):Row => ({
  id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
  postagem:`Postagem ${n}`,data:"",tema:"",briefing:"",
  formato:"",rede:"",responsavel:"",status:"Planejado",observacoes:"",mes,
});

async function dbLoad(mes:number):Promise<Row[]> {
  const res = await fetch(`${TABLE}?mes=eq.${mes}&select=*`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function dbUpsert(row:Row):Promise<void> {
  const res = await fetch(`${TABLE}?on_conflict=id`,{method:"POST",headers:{...H,"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(row)});
  if (!res.ok) throw new Error(await res.text());
}
async function dbDelete(id:string):Promise<void> {
  await fetch(`${TABLE}?id=eq.${id}`,{method:"DELETE",headers:{...H,"Prefer":"return=minimal"}});
}
async function leadsLoad():Promise<any[]> {
  const res = await fetch(`${LEADS_TB}?select=*&order=created_at.desc`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
  if (!res.ok) return [];
  return res.json();
}
async function leadUpdateStatus(id:string,status:string):Promise<void> {
  await fetch(`${LEADS_TB}?id=eq.${id}`,{method:"PATCH",headers:{...H,"Prefer":"return=minimal"},body:JSON.stringify({status})});
}

function useIsMobile() {
  const [m,setM] = useState(window.innerWidth<768);
  useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return m;
}

interface EditableCellProps {
  value:string; onChange:(v:string)=>void;
  onFocus?:()=>void; onBlur?:()=>void;
  type?:"text"|"select"|"select-simple"|"select-rede";
  options?:readonly string[]; placeholder?:string; wide?:boolean; urgency?:Urgency;
}

function EditableCell({value,onChange,onFocus,onBlur,type="text",options,placeholder,wide,urgency}:EditableCellProps) {
  const [editing,setEditing] = useState(false);
  const hf=()=>{setEditing(true);onFocus?.()};
  const hb=()=>{setEditing(false);onBlur?.()};
  if (type==="select") {
    const c=STATUS_COLORS[value as Status]??{bg:"#2d1b69",text:"#c9a0f5",border:"#6b3fa0"};
    return <select value={value} onChange={e=>onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
      style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"'Cinzel',serif",fontWeight:700,cursor:"pointer",width:"100%",outline:"none"}}>
      {options!.map(o=><option key={o} value={o}>{o}</option>)}
    </select>;
  }
  if (type==="select-rede") {
    const icon=REDE_ICONS[value];
    return <div style={{display:"flex",alignItems:"center",gap:5}}>
      {icon&&<img src={icon} alt={value} style={{width:18,height:18,objectFit:"contain",borderRadius:3}}/>}
      <select value={value} onChange={e=>onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        style={{background:"#1a0d3a",color:"#c9a0f5",border:"1px solid #4a2a8a",borderRadius:6,padding:"6px 6px",fontSize:12,fontFamily:"'Cinzel',serif",cursor:"pointer",flex:1,outline:"none"}}>
        <option value="">--</option>
        {options!.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>;
  }
  if (type==="select-simple") {
    return <select value={value} onChange={e=>onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
      style={{background:"#1a0d3a",color:"#c9a0f5",border:"1px solid #4a2a8a",borderRadius:6,padding:"6px 6px",fontSize:12,fontFamily:"'Cinzel',serif",cursor:"pointer",width:"100%",outline:"none"}}>
      <option value="">--</option>
      {options!.map(o=><option key={o} value={o}>{o}</option>)}
    </select>;
  }
  const us=urgency?URGENCY_STYLES[urgency]:null;
  return editing
    ? <textarea autoFocus value={value} onChange={e=>onChange(e.target.value)} onFocus={hf} onBlur={hb} placeholder={placeholder}
        style={{width:"100%",minHeight:wide?60:36,background:"#1a0d3a",color:"#e2d0ff",border:"1px solid #7c3aed",borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"'Lato',sans-serif",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
    : <div onClick={hf} title="Clique para editar"
        style={{minHeight:32,padding:"6px 6px",color:value?"#e2d0ff":"#5a3a8a",fontSize:12,fontFamily:"'Lato',sans-serif",cursor:"text",borderRadius:4,transition:"background 0.15s",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}
        onMouseEnter={e=>(e.currentTarget.style.background="#2d1b69")}
        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
        {value||<span style={{fontStyle:"italic",opacity:0.4}}>{placeholder??"—"}</span>}
        {us&&<span style={{display:"inline-block",marginLeft:6,background:us.badgeBg,color:us.badgeColor,fontSize:9,fontWeight:700,fontFamily:"'Cinzel',serif",borderRadius:4,padding:"1px 5px",letterSpacing:1,animation:us.anim,verticalAlign:"middle"}}>{us.badge}</span>}
      </div>;
}

function PostagemCard({row,idx,onUpdate,onDuplicate,onRemove}:{row:Row;idx:number;onUpdate:(id:string,key:keyof Row,val:string)=>void;onDuplicate:(r:Row)=>void;onRemove:(id:string)=>void}) {
  const urgency=getUrgency(row.data,row.status);
  const us=urgency?URGENCY_STYLES[urgency]:null;
  const sc=STATUS_COLORS[row.status];
  const icon=REDE_ICONS[row.rede];
  return (
    <div style={{background:us?us.rowBg:sc.rowBg,border:`1px solid ${us?us.border:sc.border}`,borderLeft:`4px solid ${us?us.border:sc.border}`,borderRadius:12,padding:"14px 14px 10px",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:"#5a3a8a",fontFamily:"'Cinzel',serif"}}>#{idx+1}</span>
          {icon&&<img src={icon} alt={row.rede} style={{width:18,height:18,objectFit:"contain"}}/>}
          <span style={{fontSize:11,color:"#c9a0f5",fontFamily:"'Cinzel',serif"}}>{row.rede||"—"}</span>
          {us&&<span style={{background:us.badgeBg,color:us.badgeColor,fontSize:9,fontWeight:700,fontFamily:"'Cinzel',serif",borderRadius:4,padding:"2px 6px",letterSpacing:1,animation:us.anim}}>{us.badge}</span>}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onDuplicate(row)} style={{background:"none",border:"none",color:"#5a3a8a",cursor:"pointer",fontSize:16,padding:"4px"}} onMouseEnter={e=>(e.currentTarget.style.color="#c084fc")} onMouseLeave={e=>(e.currentTarget.style.color="#5a3a8a")}>📋</button>
          <button onClick={()=>onRemove(row.id)} style={{background:"none",border:"none",color:"#5a3a8a",cursor:"pointer",fontSize:16,padding:"4px"}} onMouseEnter={e=>(e.currentTarget.style.color="#ef4444")} onMouseLeave={e=>(e.currentTarget.style.color="#5a3a8a")}>✕</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 12px"}}>
        <div style={{gridColumn:"1 / -1"}}><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2,letterSpacing:1}}>POSTAGEM</div><EditableCell value={row.postagem} onChange={v=>onUpdate(row.id,"postagem",v)} placeholder="Postagem"/></div>
        <div style={{gridColumn:"1 / -1"}}><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2,letterSpacing:1}}>✨ TEMA</div><EditableCell value={row.tema} onChange={v=>onUpdate(row.id,"tema",v)} placeholder="Título / tema do post" wide/></div>
        <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2,letterSpacing:1}}>📅 DATA</div><EditableCell value={row.data} onChange={v=>onUpdate(row.id,"data",v)} placeholder="dd/mm/aaaa" urgency={urgency}/></div>
        <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2,letterSpacing:1}}>🎞 FORMATO</div>
          <select value={row.formato} onChange={e=>onUpdate(row.id,"formato",e.target.value)} style={{background:"#1a0d3a",color:"#c9a0f5",border:"1px solid #4a2a8a",borderRadius:6,padding:"6px",fontSize:12,fontFamily:"'Cinzel',serif",cursor:"pointer",width:"100%",outline:"none"}}>
            <option value="">--</option>{FORMATO_OPTIONS.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2,letterSpacing:1}}>🌐 REDE</div>
          <select value={row.rede} onChange={e=>onUpdate(row.id,"rede",e.target.value)} style={{background:"#1a0d3a",color:"#c9a0f5",border:"1px solid #4a2a8a",borderRadius:6,padding:"6px",fontSize:12,fontFamily:"'Cinzel',serif",cursor:"pointer",width:"100%",outline:"none"}}>
            <option value="">--</option>{REDE_OPTIONS.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2,letterSpacing:1}}>👤 RESPONSÁVEL</div><EditableCell value={row.responsavel} onChange={v=>onUpdate(row.id,"responsavel",v)} placeholder="Nome"/></div>
        <div style={{gridColumn:"1 / -1"}}><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:4,letterSpacing:1}}>🔮 STATUS</div>
          <select value={row.status} onChange={e=>onUpdate(row.id,"status",e.target.value)} style={{background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"'Cinzel',serif",fontWeight:700,cursor:"pointer",width:"100%",outline:"none"}}>
            {STATUS_OPTIONS.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function CalendarView({rows,mes,onSelectDay,isMobile}:{rows:Row[];mes:number;onSelectDay:(rows:Row[],day:number)=>void;isMobile:boolean}) {
  const year=new Date().getFullYear();
  const firstDay=new Date(year,mes,1).getDay();
  const dim=new Date(year,mes+1,0).getDate();
  const today=new Date(); const icm=today.getMonth()===mes&&today.getFullYear()===year; const td=icm?today.getDate():-1;
  const byDay:Record<number,Row[]>={};
  rows.forEach(r=>{const d=parseDateBR(r.data);if(d&&d.getMonth()===mes&&d.getFullYear()===year){const day=d.getDate();if(!byDay[day])byDay[day]=[];byDay[day].push(r);}});
  const cells:(number|null)[]=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=dim;d++)cells.push(d);
  return (
    <div style={{padding:"0 0 8px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:isMobile?2:4,marginBottom:4}}>
        {WEEKDAYS.map(w=><div key={w} style={{textAlign:"center",padding:"6px 0",fontFamily:"'Cinzel',serif",fontSize:isMobile?8:10,color:"#7c3aed",fontWeight:700,letterSpacing:1}}>{w}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:isMobile?2:4}}>
        {cells.map((day,idx)=>{
          if(day===null) return <div key={`e${idx}`} style={{minHeight:isMobile?54:80}}/>;
          const dr=byDay[day]??[]; const iT=day===td;
          const hu=dr.some(r=>{const u=getUrgency(r.data,r.status);return u==="hoje"||u==="amanha";});
          return <div key={day} onClick={()=>dr.length>0&&onSelectDay(dr,day)}
            style={{minHeight:isMobile?54:80,background:iT?"linear-gradient(135deg,#3d1b8a55,#7c3aed33)":"#110828",border:iT?"2px solid #7c3aed":hu?"1px solid #ef4444":"1px solid #2d1b69",borderRadius:isMobile?5:8,padding:isMobile?"4px 3px":"6px 6px 4px",cursor:dr.length>0?"pointer":"default",transition:"all 0.15s",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>{if(dr.length>0){e.currentTarget.style.borderColor="#7c3aed";e.currentTarget.style.background="#1e0f45";}}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=iT?"#7c3aed":hu?"#ef4444":"#2d1b69";e.currentTarget.style.background=iT?"linear-gradient(135deg,#3d1b8a55,#7c3aed33)":"#110828";}}>
            {hu&&<span style={{position:"absolute",top:3,right:3,width:6,height:6,borderRadius:"50%",background:"#ef4444",animation:"pulse-red 1s ease-in-out infinite",display:"block"}}/>}
            <div style={{fontFamily:"'Cinzel',serif",fontSize:iT?12:10,fontWeight:iT?900:400,color:iT?"#c084fc":"#5a3a8a",marginBottom:2}}>{day}</div>
            {!isMobile&&<div style={{display:"flex",flexDirection:"column",gap:2}}>
              {dr.slice(0,3).map(r=>{const sc=STATUS_COLORS[r.status];const ic=REDE_ICONS[r.rede];return(
                <div key={r.id} style={{background:sc.calBg,border:`1px solid ${sc.border}`,borderRadius:4,padding:"2px 4px",display:"flex",alignItems:"center",gap:3}}>
                  {ic&&<img src={ic} alt={r.rede} style={{width:10,height:10,objectFit:"contain",borderRadius:2,flexShrink:0}}/>}
                  <span style={{fontSize:9,color:sc.text,fontFamily:"'Lato',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{r.tema||r.postagem}</span>
                </div>);
              })}
              {dr.length>3&&<div style={{fontSize:9,color:"#7c3aed",fontFamily:"'Cinzel',serif",textAlign:"center"}}>+{dr.length-3}</div>}
            </div>}
            {isMobile&&dr.length>0&&<div style={{display:"flex",gap:1,flexWrap:"wrap",marginTop:2}}>
              {dr.slice(0,3).map(r=>{const sc=STATUS_COLORS[r.status];return<div key={r.id} style={{width:6,height:6,borderRadius:"50%",background:sc.border,flexShrink:0}}/>;} )}
              {dr.length>3&&<span style={{fontSize:7,color:"#7c3aed"}}>+{dr.length-3}</span>}
            </div>}
          </div>;
        })}
      </div>
    </div>
  );
}

function DayPanel({day,mes,rows,onClose,isMobile}:{day:number;mes:number;rows:Row[];onClose:()=>void;isMobile:boolean}) {
  return (
    <div style={{marginTop:16,background:"linear-gradient(135deg,#1a0d3a,#2d1b69)",border:"1px solid #4a2a8a",borderRadius:14,padding:isMobile?"14px 12px":"18px 20px",animation:"glow 4s ease-in-out infinite"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:isMobile?12:14,fontWeight:700,color:"#c084fc",letterSpacing:2}}>📅 {day} de {MONTHS[mes]} — {rows.length} postagem{rows.length!==1?"s":""}</div>
        <button onClick={onClose} style={{background:"none",border:"1px solid #4a2a8a",borderRadius:6,color:"#5a3a8a",cursor:"pointer",padding:"6px 12px",fontFamily:"'Cinzel',serif",fontSize:12}}>✕</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {rows.map(r=>{const sc=STATUS_COLORS[r.status];const urgency=getUrgency(r.data,r.status);const us=urgency?URGENCY_STYLES[urgency]:null;const icon=REDE_ICONS[r.rede];return(
          <div key={r.id} style={{background:sc.rowBg,border:`1px solid ${us?us.border:sc.border}`,borderLeft:`4px solid ${us?us.border:sc.border}`,borderRadius:8,padding:"10px 14px",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:"8px 16px"}}>
            <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2}}>POSTAGEM</div><div style={{fontSize:12,color:"#e2d0ff"}}>{r.postagem}</div></div>
            <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2}}>TEMA</div><div style={{fontSize:12,color:"#e2d0ff"}}>{r.tema||"—"}</div></div>
            <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2}}>REDE</div><div style={{display:"flex",alignItems:"center",gap:4}}>{icon&&<img src={icon} alt={r.rede} style={{width:14,height:14,objectFit:"contain"}}/>}<span style={{fontSize:12,color:"#e2d0ff"}}>{r.rede||"—"}</span></div></div>
            <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2}}>FORMATO</div><div style={{fontSize:12,color:"#e2d0ff"}}>{r.formato||"—"}</div></div>
            <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2}}>RESPONSÁVEL</div><div style={{fontSize:12,color:"#e2d0ff"}}>{r.responsavel||"—"}</div></div>
            <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",marginBottom:2}}>STATUS</div>
              <span style={{background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`,borderRadius:5,padding:"2px 7px",fontSize:10,fontFamily:"'Cinzel',serif",fontWeight:700}}>{r.status}</span>
              {us&&<span style={{marginLeft:6,background:us.badgeBg,color:us.badgeColor,fontSize:9,fontWeight:700,fontFamily:"'Cinzel',serif",borderRadius:4,padding:"1px 5px",letterSpacing:1,animation:us.anim}}>{us.badge}</span>}
            </div>
          </div>);
        })}
      </div>
    </div>
  );
}

// ─── LEADS VIEW ────────────────────────────────────────────────────────────
function LeadsView({isMobile}:{isMobile:boolean}) {
  const [leads,setLeads] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const [filterStatus,setFilterStatus] = useState("Todos");
  const [expanded,setExpanded] = useState<string|null>(null);

  useEffect(()=>{ leadsLoad().then(d=>{setLeads(d);setLoading(false);}); },[]);

  const updateStatus = async (id:string, status:string) => {
    await leadUpdateStatus(id,status);
    setLeads(prev=>prev.map(l=>l.id===id?{...l,status}:l));
  };

  const filtered = leads.filter(l=>{
    if (filterStatus!=="Todos"&&l.status!==filterStatus) return false;
    if (search&&!l.nome?.toLowerCase().includes(search.toLowerCase())&&!l.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = LEAD_STATUS_OPTIONS.reduce((acc,s)=>({...acc,[s]:leads.filter(l=>l.status===s).length}),{} as Record<string,number>);

  const fmtDate = (s:string) => s ? new Date(s).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}) : "—";

  return (
    <div>
      {/* Stats */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {LEAD_STATUS_OPTIONS.map(s=>{
          const c=LEAD_STATUS_COLORS[s];
          return <div key={s} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"8px 16px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:80,animation:"glow 3s ease-in-out infinite"}}>
            <span style={{fontSize:20,fontWeight:900,color:c.text,fontFamily:"'Cinzel',serif"}}>{counts[s]??0}</span>
            <span style={{fontSize:9,color:c.text,opacity:0.8,textAlign:"center"}}>{s}</span>
          </div>;
        })}
        <div style={{background:"#1a0d3a",border:"1px solid #4a2a8a",borderRadius:10,padding:"8px 16px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:80}}>
          <span style={{fontSize:20,fontWeight:900,color:"#c084fc",fontFamily:"'Cinzel',serif"}}>{leads.length}</span>
          <span style={{fontSize:9,color:"#c084fc",opacity:0.8}}>Total</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por nome..."
          style={{background:"#1a0d3a",color:"#c9a0f5",border:"1px solid #4a2a8a",borderRadius:8,padding:"8px 12px",fontFamily:"'Lato',sans-serif",fontSize:13,outline:"none",flex:1,minWidth:180}}/>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{background:"#1a0d3a",color:"#c9a0f5",border:"1px solid #4a2a8a",borderRadius:8,padding:"8px 12px",fontFamily:"'Cinzel',serif",fontSize:12,outline:"none",cursor:"pointer"}}>
          <option value="Todos">Todos os Status</option>
          {LEAD_STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={()=>{setLoading(true);leadsLoad().then(d=>{setLeads(d);setLoading(false);});}}
          style={{background:"#1a0d3a",color:"#c084fc",border:"1px solid #4a2a8a",borderRadius:8,padding:"8px 14px",fontFamily:"'Cinzel',serif",fontSize:11,cursor:"pointer"}}>⟳ Atualizar</button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:40}}>
          <div style={{width:32,height:32,border:"3px solid #4a2a8a",borderTop:"3px solid #c084fc",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        </div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:"center",padding:48,color:"#5a3a8a",fontFamily:"'Cinzel',serif",fontSize:13}}>
          {leads.length===0?"Nenhuma inscrição ainda.":"Nenhum lead com esse filtro."}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(lead=>{
            const sc=LEAD_STATUS_COLORS[lead.status]??LEAD_STATUS_COLORS["Novo lead"];
            const isExp=expanded===lead.id;
            return (
              <div key={lead.id} style={{background:"#110828",border:`1px solid ${sc.border}`,borderLeft:`4px solid ${sc.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.2s"}}>
                {/* Header row */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",flexWrap:"wrap"}}
                  onClick={()=>setExpanded(isExp?null:lead.id)}>
                  <div style={{fontSize:18}}>🎲</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,color:"#e2d0ff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.nome||"—"}</div>
                    <div style={{fontSize:11,color:"#5a3a8a",fontFamily:"'Lato',sans-serif"}}>{lead.whatsapp_discord||"—"} · {fmtDate(lead.created_at)}</div>
                  </div>
                  <select value={lead.status} onChange={e=>{e.stopPropagation();updateStatus(lead.id,e.target.value);}}
                    onClick={e=>e.stopPropagation()}
                    style={{background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`,borderRadius:6,padding:"5px 8px",fontSize:11,fontFamily:"'Cinzel',serif",fontWeight:700,cursor:"pointer",outline:"none"}}>
                    {LEAD_STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                  <span style={{color:"#5a3a8a",fontSize:16,transform:isExp?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                </div>

                {/* Expanded details */}
                {isExp&&(
                  <div style={{padding:"0 16px 16px",display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px 24px",borderTop:"1px solid #1e0f45"}}>
                    {[
                      ["Idade",lead.idade],
                      ["WhatsApp / Discord",lead.whatsapp_discord],
                      ["Experiência",lead.tempo_rpg],
                      ["Sistemas jogados",lead.sistemas_jogados],
                      ["Quer jogar",lead.sistemas_desejados],
                      ["Melhor dia",lead.melhor_dia],
                      ["Período",lead.melhor_periodo],
                      ["Ciente dos valores",lead.ciente_valores],
                      ["Ciente compromisso",lead.ciente_compromisso],
                      ["Ciente contrato",lead.ciente_contrato],
                      ["Ciente taxa",lead.ciente_taxa],
                      ["Ciente tolerância",lead.ciente_tolerancia],
                      ["Ciente consentimento",lead.ciente_consentimento],
                      ["Pronto para ingressar",lead.pronto_ingressar],
                      ["Código de desconto",lead.codigo_desconto||"—"],
                    ].map(([k,v])=>(
                      <div key={k as string} style={{paddingTop:10}}>
                        <div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",letterSpacing:1,marginBottom:3,textTransform:"uppercase"}}>{k}</div>
                        <div style={{fontSize:12,color:"#c9a0f5",fontFamily:"'Lato',sans-serif",lineHeight:1.5}}>{v||"—"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TRÁFEGO ───────────────────────────────────────────────────────────────
const CAMPAIGNS = [
  {id:1,nome:"Tráfego — Anunciantes do Instagram",periodo:"11 abr → 15 abr 2026",vizTotal:26259,vizUnicos:24385,resultado:307,tipoResultado:"cliques no link",best:false},
  {id:2,nome:"Post Mayou — 3ª rodada",            periodo:"9 mai → 13 mai 2026",  vizTotal:17846,vizUnicos:14477,resultado:556,tipoResultado:"visitas à página",best:true},
  {id:3,nome:"Post Gio 2 — 2ª rodada",            periodo:"14 mai → 17 mai 2026", vizTotal:13935,vizUnicos:11389,resultado:191,tipoResultado:"visitas à página",best:false},
  {id:4,nome:"Post Mayou — 1ª rodada",            periodo:"5 abr → 9 abr 2026",   vizTotal:10537,vizUnicos:8002, resultado:182,tipoResultado:"visitas à página",best:false},
  {id:5,nome:"Post Gio 3 — 3ª rodada",            periodo:"20 mai → 23 mai 2026", vizTotal:9341, vizUnicos:7902, resultado:134,tipoResultado:"visitas à página",best:false},
  {id:6,nome:"Post Gio 1 — 1ª rodada",            periodo:"21 abr → 24 abr 2026", vizTotal:7784, vizUnicos:6557, resultado:96, tipoResultado:"visitas à página",best:false},
  {id:7,nome:"Post Mayou — 2ª rodada",            periodo:"26 abr → 30 abr 2026", vizTotal:1049, vizUnicos:951,  resultado:9,  tipoResultado:"visitas à página",best:false},
];
const AUDIENCE_DATA=[{faixa:"18–24",homens:20,mulheres:2,total:22},{faixa:"25–34",homens:40,mulheres:5,total:45},{faixa:"35–44",homens:22,mulheres:2,total:24},{faixa:"45–54",homens:7,mulheres:1,total:8},{faixa:"55–64",homens:1,mulheres:0.5,total:1},{faixa:"65+",homens:1,mulheres:0,total:1}];
const CHART_DATA=CAMPAIGNS.map(c=>({name:c.nome.length>14?c.nome.slice(0,14)+"…":c.nome,vizTotal:c.vizTotal,vizUnicos:c.vizUnicos}));
const fmtNum=(n:number)=>n>=1000?(n/1000).toFixed(1)+"k":String(n);

function TrafegoView({isMobile}:{isMobile:boolean}) {
  const totalViz=CAMPAIGNS.reduce((s,c)=>s+c.vizTotal,0);
  const totalUnicos=CAMPAIGNS.reduce((s,c)=>s+c.vizUnicos,0);
  const CT=({active,payload,label}:any)=>{
    if(!active||!payload?.length) return null;
    return <div style={{background:"#1a0d3a",border:"1px solid #4a2a8a",borderRadius:8,padding:"10px 14px"}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#7c3aed",marginBottom:6}}>{label}</div>
      {payload.map((p:any)=><div key={p.name} style={{fontSize:11,color:p.color,fontFamily:"'Lato',sans-serif"}}>{p.name}: <b>{p.value.toLocaleString("pt-BR")}</b></div>)}
    </div>;
  };
  return (
    <div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#5a3a8a",marginBottom:16}}>✦ Visão Geral — 90 dias · 7 campanhas</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[{label:"Visualizações",val:fmtNum(totalViz),sub:"impressões totais",color:"#c084fc"},{label:"Alcance",val:fmtNum(totalUnicos),sub:"pessoas únicas",color:"#a78bfa"},{label:"Interações",val:fmtNum(14300),sub:"curtidas, comentários",color:"#e879f9"},{label:"Visitas",val:fmtNum(1832),sub:"acessos gerados",color:"#6ee7b7"}].map(k=>(
          <div key={k.label} style={{background:"linear-gradient(135deg,#1a0d3a,#110828)",border:"1px solid #4a2a8a",borderTop:`2px solid ${k.color}`,borderRadius:12,padding:isMobile?"14px 12px":"18px 20px",animation:"glow 3s ease-in-out infinite"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:"#a78bfa",marginBottom:6,letterSpacing:1}}>{k.label}</div>
            <div style={{fontSize:isMobile?22:30,fontWeight:900,color:k.color,fontFamily:"'Cinzel',serif",letterSpacing:-1}}>{k.val}</div>
            <div style={{fontSize:9,color:"#9d8bbf",marginTop:4,fontFamily:"'Lato',sans-serif"}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 320px",gap:16,marginBottom:24}}>
        <div style={{background:"linear-gradient(135deg,#1a0d3a,#110828)",border:"1px solid #4a2a8a",borderRadius:14,padding:"20px 16px",animation:"glow 4s ease-in-out infinite"}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:"#c084fc",marginBottom:16,letterSpacing:1}}>✦ Visualizações por Campanha</div>
          <div style={{height:isMobile?180:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA} margin={{top:4,right:4,bottom:isMobile?50:40,left:0}}>
                <XAxis dataKey="name" tick={{fill:"#5a3a8a",fontSize:isMobile?7:9,fontFamily:"'Lato',sans-serif"}} angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{fill:"#5a3a8a",fontSize:9,fontFamily:"'Lato',sans-serif"}} tickFormatter={v=>v>=1000?(v/1000).toFixed(0)+"k":v} width={32}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="vizTotal" name="Visualizações" radius={[4,4,0,0]}>{CHART_DATA.map((_,i)=><Cell key={i} fill={`rgba(162,89,255,${0.85-i*0.08})`}/>)}</Bar>
                <Bar dataKey="vizUnicos" name="Visualizadores" radius={[4,4,0,0]}>{CHART_DATA.map((_,i)=><Cell key={i} fill={`rgba(192,132,252,${0.5-i*0.04})`}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{background:"linear-gradient(135deg,#1a0d3a,#110828)",border:"1px solid #4a2a8a",borderRadius:14,padding:"20px 16px",animation:"glow 4s ease-in-out infinite"}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:"#c084fc",marginBottom:4,letterSpacing:1}}>✦ Público — 30 dias</div>
          <div style={{fontSize:10,color:"#5a3a8a",fontFamily:"'Lato',sans-serif",marginBottom:16}}>8,1 mil interações</div>
          {AUDIENCE_DATA.map(a=>(
            <div key={a.faixa} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#5a3a8a",width:38,flexShrink:0}}>{a.faixa}</div>
              <div style={{flex:1,height:18,background:"#0d0720",borderRadius:4,overflow:"hidden",display:"flex"}}>
                <div style={{width:`${a.homens}%`,background:"rgba(162,89,255,0.8)",height:"100%",borderRadius:"4px 0 0 4px"}}/>
                <div style={{width:`${a.mulheres}%`,background:"rgba(240,171,252,0.65)",height:"100%"}}/>
              </div>
              <div style={{fontFamily:"'Lato',sans-serif",fontSize:10,color:"#5a3a8a",width:28,textAlign:"right"}}>{a.total}%</div>
            </div>
          ))}
          <div style={{display:"flex",gap:14,marginTop:12}}>
            {[["rgba(162,89,255,0.8)","Homens"],["rgba(240,171,252,0.65)","Mulheres"]].map(([bg,label])=>(
              <div key={label as string} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:2,background:bg as string}}/>
                <span style={{fontSize:10,color:"#5a3a8a",fontFamily:"'Lato',sans-serif"}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#5a3a8a",marginBottom:16}}>✦ Campanhas Individuais</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        {CAMPAIGNS.map((c,idx)=>(
          <div key={c.id} style={{background:"linear-gradient(135deg,#1a0d3a,#110828)",border:c.best?"1px solid rgba(162,89,255,0.5)":"1px solid #2d1b69",borderRadius:12,padding:"16px 18px",position:"relative"}}>
            {c.best&&<div style={{position:"absolute",top:12,right:12,background:"rgba(162,89,255,0.15)",border:"1px solid rgba(162,89,255,0.4)",color:"#c084fc",fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:1,textTransform:"uppercase",padding:"3px 9px",borderRadius:20}}>✦ Mais visitas</div>}
            <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:"#5a3a8a",marginBottom:6,letterSpacing:1}}>Campanha {String(idx+1).padStart(2,"0")}</div>
            <div style={{fontSize:13,fontWeight:700,color:"#e2d0ff",marginBottom:3,lineHeight:1.3,paddingRight:c.best?70:0,fontFamily:"'Cinzel',serif"}}>{c.nome}</div>
            <div style={{fontSize:10,color:"#5a3a8a",marginBottom:14,fontFamily:"'Lato',sans-serif"}}>{c.periodo}</div>
            <div style={{borderTop:"1px solid #2d1b69",paddingTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",letterSpacing:1,marginBottom:3}}>VISUALIZAÇÕES</div><div style={{fontSize:18,fontWeight:700,color:"#e2d0ff"}}>{c.vizTotal.toLocaleString("pt-BR")}</div></div>
              <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",letterSpacing:1,marginBottom:3}}>VISUALIZADORES</div><div style={{fontSize:18,fontWeight:700,color:"#e2d0ff"}}>{c.vizUnicos.toLocaleString("pt-BR")}</div></div>
              <div style={{gridColumn:"1 / -1",borderTop:"1px solid #2d1b69",paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",letterSpacing:1,marginBottom:3}}>RESULTADO</div><div style={{fontSize:22,fontWeight:900,color:"#c084fc",fontFamily:"'Cinzel',serif"}}>{c.resultado}</div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Lato',sans-serif"}}>{c.tipoResultado}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Cinzel',serif",letterSpacing:1,marginBottom:3}}>TAXA</div><div style={{fontSize:14,fontWeight:700,color:"#a78bfa",fontFamily:"'Cinzel',serif"}}>{((c.resultado/c.vizTotal)*100).toFixed(2)}%</div><div style={{fontSize:9,color:"#5a3a8a",fontFamily:"'Lato',sans-serif"}}>conversão</div></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DASHBOARD APP ─────────────────────────────────────────────────────────
function Dashboard() {
  const isMobile = useIsMobile();
  const [rows,setRows]               = useState<Row[]>([]);
  const [mes,setMes]                 = useState(new Date().getMonth());
  const [filter,setFilter]           = useState("Todos");
  const [filterRede,setFilterRede]   = useState("Todos");
  const [filterDataInicio,setFilterDataInicio] = useState("");
  const [filterDataFim,setFilterDataFim]       = useState("");
  const [loading,setLoading]         = useState(true);
  const [syncStatus,setSyncStatus]   = useState<"ok"|"saving"|"error">("ok");
  const [viewMode,setViewMode]       = useState<ViewMode>("tabela");
  const [selectedDay,setSelectedDay] = useState<{day:number;rows:Row[]}|null>(null);
  const [appTab,setAppTab]           = useState<AppTab>("calendario");

  const pendingUpserts = useRef<Map<string,ReturnType<typeof setTimeout>>>(new Map());
  const rowsRef = useRef<Row[]>([]);

  const setRowsSafe=(updater:(prev:Row[])=>Row[])=>{setRows(prev=>{const next=updater(prev);rowsRef.current=next;return next;});};

  const loadRows=useCallback(async(m:number,force=false)=>{
    if(!force)setLoading(true);
    try{const data=await dbLoad(m);
      setRows(prev=>{const pending=pendingUpserts.current;const merged=data.map(sr=>{if(pending.has(sr.id)){const local=prev.find(r=>r.id===sr.id);return local??sr;}return sr;});const sids=new Set(data.map(r=>r.id));const lo=prev.filter(r=>!sids.has(r.id));const result=[...merged,...lo];rowsRef.current=result;return result;});
    }catch{setSyncStatus("error");}finally{setLoading(false);}
  },[]);

  useEffect(()=>{setSelectedDay(null);loadRows(mes);},[mes,loadRows]);
  useEffect(()=>{const t=setInterval(()=>{const tag=document.activeElement?.tagName;if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;loadRows(mes,true);},15000);return()=>clearInterval(t);},[mes,loadRows]);

  const scheduleUpsert=useCallback((row:Row)=>{setSyncStatus("saving");const ex=pendingUpserts.current.get(row.id);if(ex)clearTimeout(ex);const t=setTimeout(async()=>{try{await dbUpsert(row);setSyncStatus("ok");}catch{setSyncStatus("error");}finally{pendingUpserts.current.delete(row.id);}},1000);pendingUpserts.current.set(row.id,t);},[]);

  const updateRow=(id:string,key:keyof Row,val:string)=>{setRowsSafe(prev=>{const next=prev.map(r=>r.id===id?{...r,[key]:val}:r);const updated=next.find(r=>r.id===id);if(updated)scheduleUpsert(updated);return next;});};
  const addRow=async()=>{const row=makeRow(rowsRef.current.length+1,mes);setRowsSafe(prev=>[...prev,row]);try{await dbUpsert(row);}catch{setSyncStatus("error");}};
  const duplicateRow=async(source:Row)=>{const row:Row={...source,id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,postagem:`${source.postagem} (cópia)`,status:"Planejado"};setRowsSafe(prev=>{const idx=prev.findIndex(r=>r.id===source.id);const next=[...prev];next.splice(idx+1,0,row);return next;});try{await dbUpsert(row);}catch{setSyncStatus("error");}};
  const removeRow=async(id:string)=>{const pending=pendingUpserts.current.get(id);if(pending){clearTimeout(pending);pendingUpserts.current.delete(id);}setRowsSafe(prev=>prev.filter(r=>r.id!==id));try{await dbDelete(id);}catch{setSyncStatus("error");}};

  const dInicio=parseDateBR(filterDataInicio); const dFim=parseDateBR(filterDataFim);
  const filtered=rows.filter(r=>{
    if(filter!=="Todos"&&r.status!==filter)return false;
    if(filterRede!=="Todos"&&r.rede!==filterRede&&r.rede!=="Todos")return false;
    const d=parseDateBR(r.data);
    if(dInicio&&(!d||d<dInicio))return false;
    if(dFim&&(!d||d>dFim))return false;
    return true;
  }).sort((a,b)=>{const da=parseDateBR(a.data);const db=parseDateBR(b.data);if(!da&&!db)return 0;if(!da)return 1;if(!db)return-1;return da.getTime()-db.getTime();});

  const temFiltroData=filterDataInicio!==""||filterDataFim!=="";
  const urgentCount=rows.filter(r=>getUrgency(r.data,r.status)!==null).length;
  const syncColor=syncStatus==="saving"?"#c084fc":syncStatus==="error"?"#f87171":"#6ee7b7";
  const syncLabel=syncStatus==="saving"?"Salvando...":syncStatus==="error"?"⚠ Erro":"✓ Sync";

  const selectStyle:React.CSSProperties={background:"#1a0d3a",color:"#c9a0f5",border:"1px solid #4a2a8a",borderRadius:8,padding:"9px 10px",fontFamily:"'Cinzel',serif",fontSize:12,cursor:"pointer",outline:"none"};

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0d0720 0%,#1a0d3a 40%,#0d0720 100%)",fontFamily:"'Lato',sans-serif",color:"#e2d0ff",padding:isMobile?"14px 10px":"24px 16px"}}>
      <style>{GLOBAL_STYLES}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",gap:isMobile?10:20,marginBottom:18,borderBottom:"2px solid #4a2a8a",paddingBottom:14,flexWrap:"wrap"}}>
        <img src="/icons/criandoxp.png" alt="Criando XP" style={{width:isMobile?40:70,height:isMobile?40:70,objectFit:"contain",animation:"float 4s ease-in-out infinite"}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:isMobile?16:22,fontWeight:900,background:"linear-gradient(90deg,#c084fc,#818cf8,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:2}}>Criando XP</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:"#7c3aed",letterSpacing:3,textTransform:"uppercase"}}>Dashboard Interno</div>
        </div>
        <div style={{display:"flex",flexDirection:isMobile?"column":"row",alignItems:isMobile?"flex-end":"center",gap:8,marginLeft:isMobile?0:"auto",width:isMobile?"100%":"auto"}}>
          {appTab==="calendario"&&urgentCount>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:20,padding:"4px 10px",fontSize:11,fontFamily:"'Cinzel',serif",fontWeight:700,animation:"pulse-red 1s ease-in-out infinite",letterSpacing:1}}>⚡ {urgentCount} urgente{urgentCount>1?"s":""}</span>}
          {appTab==="calendario"&&<span style={{fontSize:10,color:syncColor,animation:syncStatus==="saving"?"blink 1s infinite":"none"}}>{syncLabel}</span>}
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>window.location.hash="/"} style={{background:"transparent",color:"#5a3a8a",border:"1px solid #3d1b69",borderRadius:8,padding:"7px 12px",fontFamily:"'Cinzel',serif",fontSize:10,cursor:"pointer"}}>← Site</button>
            <div style={{display:"flex",background:"#0d0720",border:"1px solid #4a2a8a",borderRadius:10,overflow:"hidden"}}>
              {([["calendario","📅"],["trafego","📊"],["leads","🎲"]] as [AppTab,string][]).map(([tab,icon])=>(
                <button key={tab} onClick={()=>setAppTab(tab)}
                  style={{background:appTab===tab?"linear-gradient(135deg,#4a2a8a,#7c3aed)":"transparent",color:appTab===tab?"#fff":"#5a3a8a",border:"none",padding:"8px 14px",fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
                  {icon} {!isMobile&&(tab==="calendario"?"Calendário":tab==="trafego"?"Tráfego":"Leads")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CALENDÁRIO */}
      {appTab==="calendario"&&(
        <>
          <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <select value={mes} onChange={e=>setMes(Number(e.target.value))} style={selectStyle}>
              {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
            </select>
            <select value={filterRede} onChange={e=>setFilterRede(e.target.value)} style={selectStyle}>
              <option value="Todos">Todas as Redes</option>{REDE_OPTIONS.map(r=><option key={r}>{r}</option>)}
            </select>
            <select value={filter} onChange={e=>setFilter(e.target.value)} style={selectStyle}>
              <option value="Todos">Todos os Status</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
            </select>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#0d0720",border:"1px solid #4a2a8a",borderRadius:10,padding:"6px 10px",flexWrap:"wrap"}}>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#5a3a8a",whiteSpace:"nowrap"}}>📅 De</span>
              <input type="text" value={filterDataInicio} onChange={e=>setFilterDataInicio(e.target.value)} placeholder="dd/mm/aaaa" style={{background:"transparent",border:"none",color:"#c9a0f5",fontFamily:"'Cinzel',serif",fontSize:11,outline:"none",width:90}}/>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#5a3a8a"}}>até</span>
              <input type="text" value={filterDataFim} onChange={e=>setFilterDataFim(e.target.value)} placeholder="dd/mm/aaaa" style={{background:"transparent",border:"none",color:"#c9a0f5",fontFamily:"'Cinzel',serif",fontSize:11,outline:"none",width:90}}/>
              {temFiltroData&&<button onClick={()=>{setFilterDataInicio("");setFilterDataFim("");}} style={{background:"none",border:"none",color:"#5a3a8a",cursor:"pointer",fontSize:14,padding:"0 2px"}} onMouseEnter={e=>(e.currentTarget.style.color="#ef4444")} onMouseLeave={e=>(e.currentTarget.style.color="#5a3a8a")}>✕</button>}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>loadRows(mes)} style={{background:"#1a0d3a",color:"#c084fc",border:"1px solid #4a2a8a",borderRadius:8,padding:"9px 14px",fontFamily:"'Cinzel',serif",fontSize:11,cursor:"pointer"}}>⟳</button>
              <div style={{display:"flex",background:"#0d0720",border:"1px solid #4a2a8a",borderRadius:10,overflow:"hidden"}}>
                {(["tabela","calendario"] as ViewMode[]).map(mode=>(
                  <button key={mode} onClick={()=>{setViewMode(mode);setSelectedDay(null);}}
                    style={{background:viewMode===mode?"linear-gradient(135deg,#4a2a8a,#7c3aed)":"transparent",color:viewMode===mode?"#fff":"#5a3a8a",border:"none",padding:"7px 14px",fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
                    {mode==="tabela"?"≡ Tabela":"🗓 Cal"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(auto-fit,minmax(80px,1fr))",gap:8,marginBottom:18}}>
            {STATUS_OPTIONS.map(s=>{const c=STATUS_COLORS[s];return(
              <div key={s} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:isMobile?"8px 6px":"8px 16px",display:"flex",flexDirection:"column",alignItems:"center",animation:"glow 3s ease-in-out infinite"}}>
                <span style={{fontSize:isMobile?18:20,fontWeight:900,color:c.text,fontFamily:"'Cinzel',serif"}}>{rows.filter(r=>r.status===s).length}</span>
                <span style={{fontSize:isMobile?8:10,color:c.text,opacity:0.8,textAlign:"center"}}>{s}</span>
              </div>
            );})}
            <div style={{background:"#1a0d3a",border:"1px solid #4a2a8a",borderRadius:10,padding:isMobile?"8px 6px":"8px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <span style={{fontSize:isMobile?18:20,fontWeight:900,color:"#c084fc",fontFamily:"'Cinzel',serif"}}>{rows.length}</span>
              <span style={{fontSize:isMobile?8:10,color:"#c084fc",opacity:0.8}}>Total</span>
            </div>
          </div>

          {viewMode==="calendario"&&(
            <div>
              <div style={{borderRadius:16,border:"1px solid #4a2a8a",animation:"glow 4s ease-in-out infinite",padding:isMobile?"10px 8px":"16px",background:"#0d072088",position:"relative"}}>
                {loading&&<div style={{position:"absolute",inset:0,background:"#0d072099",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,borderRadius:16}}><div style={{width:32,height:32,border:"3px solid #4a2a8a",borderTop:"3px solid #c084fc",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>}
                <CalendarView rows={filtered} mes={mes} onSelectDay={(dr,day)=>setSelectedDay(prev=>prev?.day===day?null:{day,rows:dr})} isMobile={isMobile}/>
              </div>
              {selectedDay&&<DayPanel day={selectedDay.day} mes={mes} rows={selectedDay.rows} onClose={()=>setSelectedDay(null)} isMobile={isMobile}/>}
              <div style={{marginTop:14}}><button onClick={addRow} style={{background:"linear-gradient(135deg,#4a2a8a,#7c3aed)",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1,width:isMobile?"100%":"auto",boxShadow:"0 4px 15px #7c3aed44"}}>+ Adicionar Postagem</button></div>
            </div>
          )}

          {viewMode==="tabela"&&(
            <>
              {isMobile?(
                <div style={{position:"relative"}}>
                  {loading&&<div style={{position:"absolute",inset:0,background:"#0d072099",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,borderRadius:12}}><div style={{width:32,height:32,border:"3px solid #4a2a8a",borderTop:"3px solid #c084fc",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>}
                  {!loading&&filtered.length===0&&<div style={{padding:40,textAlign:"center",color:"#5a3a8a",fontFamily:"'Cinzel',serif",fontSize:13}}>{rows.length===0?"Nenhuma postagem ainda.":"Nenhuma postagem com esse filtro."}</div>}
                  {filtered.map((row,idx)=><PostagemCard key={row.id} row={row} idx={idx} onUpdate={updateRow} onDuplicate={duplicateRow} onRemove={removeRow}/>)}
                </div>
              ):(
                <div style={{overflowX:"auto",borderRadius:16,border:"1px solid #4a2a8a",animation:"glow 4s ease-in-out infinite",position:"relative"}}>
                  {loading&&<div style={{position:"absolute",inset:0,background:"#0d072099",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,borderRadius:16}}><div style={{width:32,height:32,border:"3px solid #4a2a8a",borderTop:"3px solid #c084fc",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>}
                  <table style={{borderCollapse:"collapse",width:"100%",minWidth:800}}>
                    <thead>
                      <tr style={{background:"linear-gradient(90deg,#2d1b69,#3d1b8a,#2d1b69)"}}>
                        <th style={{width:50,padding:"12px 8px",borderRight:"1px solid #4a2a8a"}}/>
                        {COLS.map(col=><th key={col.key} style={{width:col.width,padding:"12px 10px",textAlign:"left",fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,color:"#c084fc",letterSpacing:1,textTransform:"uppercase",borderRight:"1px solid #4a2a8a",whiteSpace:"nowrap"}}>{col.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {!loading&&filtered.length===0&&<tr><td colSpan={COLS.length+1} style={{padding:48,textAlign:"center",color:"#5a3a8a",fontFamily:"'Cinzel',serif",fontSize:13}}>{rows.length===0?"Nenhuma postagem ainda. Clique em + Adicionar.":"Nenhuma postagem com esse filtro."}</td></tr>}
                      {filtered.map((row,idx)=>{
                        const urgency=getUrgency(row.data,row.status);const us=urgency?URGENCY_STYLES[urgency]:null;const sc=STATUS_COLORS[row.status];
                        const baseBg=us?us.rowBg:sc.rowBg; const baseBorder=us?us.border:sc.border;
                        return <tr key={row.id} style={{background:baseBg,borderLeft:`3px solid ${baseBorder}`,transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.background="#1e0f45")} onMouseLeave={e=>(e.currentTarget.style.background=baseBg)}>
                          <td style={{padding:"6px 4px",textAlign:"center",borderRight:"1px solid #2d1b69",borderBottom:"1px solid #1e0f45",fontSize:10,color:"#5a3a8a"}}>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                              <span>{idx+1}</span>
                              <button onClick={()=>duplicateRow(row)} style={{background:"none",border:"none",color:"#5a3a8a",cursor:"pointer",fontSize:12,padding:0}} onMouseEnter={e=>(e.currentTarget.style.color="#c084fc")} onMouseLeave={e=>(e.currentTarget.style.color="#5a3a8a")}>📋</button>
                              <button onClick={()=>removeRow(row.id)} style={{background:"none",border:"none",color:"#5a3a8a",cursor:"pointer",fontSize:12,padding:0}} onMouseEnter={e=>(e.currentTarget.style.color="#ef4444")} onMouseLeave={e=>(e.currentTarget.style.color="#5a3a8a")}>✕</button>
                            </div>
                          </td>
                          {COLS.map(col=><td key={col.key} style={{padding:"4px 6px",borderRight:"1px solid #1e0f45",borderBottom:"1px solid #1e0f45",verticalAlign:"top"}}>
                            <EditableCell value={String(row[col.key]??"")} onChange={val=>updateRow(row.id,col.key,val)} type={col.type} options={col.options} placeholder={col.placeholder} wide={col.wide} urgency={col.key==="data"?urgency:undefined}/>
                          </td>)}
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{marginTop:14}}>
                <button onClick={addRow} style={{background:"linear-gradient(135deg,#4a2a8a,#7c3aed)",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1,width:isMobile?"100%":"auto",boxShadow:"0 4px 15px #7c3aed44"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 25px #7c3aed66";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 15px #7c3aed44";}}>
                  + Adicionar Postagem
                </button>
                {!isMobile&&<span style={{marginLeft:12,color:"#5a3a8a",fontSize:11}}>Clique em qualquer célula · 📋 duplicar · ✕ deletar · ordenado por data</span>}
              </div>
            </>
          )}
        </>
      )}

      {appTab==="trafego"&&<TrafegoView isMobile={isMobile}/>}
      {appTab==="leads"&&<LeadsView isMobile={isMobile}/>}

      <div style={{marginTop:36,textAlign:"center",color:"#3d1b69",fontSize:10,fontFamily:"'Cinzel',serif",letterSpacing:2}}>
        🎲 CRIANDO XP · {appTab==="calendario"?`CALENDÁRIO · ${MONTHS[mes].toUpperCase()}`:appTab==="trafego"?"TRÁFEGO PAGO · META ADS":"LEADS · INSCRIÇÕES"}
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
function DashboardGate() {
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("cxp_auth") === DASHBOARD_PWD
  );

  const tryLogin = () => {
    if (btoa(input) === DASHBOARD_PWD) {
      sessionStorage.setItem("cxp_auth", DASHBOARD_PWD);
      setAuthed(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (authed) return <Dashboard />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0720 0%, #1a0d3a 40%, #0d0720 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Lato', sans-serif",
    }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{
        background: "linear-gradient(135deg, #1a0d3a, #110828)",
        border: `1px solid ${error ? "#ef4444" : "#4a2a8a"}`,
        borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 380,
        textAlign: "center", animation: "glow 4s ease-in-out infinite",
        transition: "border-color 0.3s",
      }}>
        <img src="/icons/criandoxp.png" alt="Criando XP"
          style={{ width: 72, height: 72, objectFit: "contain",
            animation: "float 4s ease-in-out infinite", marginBottom: 20 }} />
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 900,
          background: "linear-gradient(90deg, #c084fc, #e879f9)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 6,
        }}>Criando XP</div>
        <div style={{ fontSize: 11, color: "#5a3a8a", fontFamily: "'Cinzel', serif",
          letterSpacing: 3, textTransform: "uppercase", marginBottom: 32 }}>
          Área Restrita
        </div>
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && tryLogin()}
          placeholder="••••••••••••"
          style={{
            width: "100%", background: "#0d0720", color: "#e2d0ff",
            border: `1px solid ${error ? "#ef4444" : "#3d1b69"}`,
            borderRadius: 10, padding: "14px 16px", fontSize: 16,
            fontFamily: "'Lato', sans-serif", outline: "none",
            textAlign: "center", letterSpacing: 4, marginBottom: 8,
            transition: "border-color 0.3s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = error ? "#ef4444" : "#7c3aed")}
          onBlur={e => (e.currentTarget.style.borderColor = error ? "#ef4444" : "#3d1b69")}
        />
        {error && (
          <div style={{ fontSize: 12, color: "#f87171", marginBottom: 8,
            fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
            ⚠ Senha incorreta
          </div>
        )}
        <button onClick={tryLogin} style={{
          width: "100%", background: "linear-gradient(135deg, #4a2a8a, #7c3aed)",
          color: "#fff", border: "none", borderRadius: 10, padding: "14px",
          fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
          cursor: "pointer", letterSpacing: 2, marginTop: 8,
          boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
        }}>ENTRAR</button>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  if (route === "#/dashboard") return <DashboardGate />;
  return <LandingPage />;
}
}