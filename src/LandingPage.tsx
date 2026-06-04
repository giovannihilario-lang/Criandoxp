import { useState, useRef, useEffect } from "react";

// ─── Supabase ──────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://zovgkatndrgzxocwpdjm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdmdrYXRuZHJnenhvY3dwZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzY4MjEsImV4cCI6MjA5NTMxMjgyMX0.jm_BaUCN3CHPP9Rut2HM8KRVWes5nZLhJ_oyKbdqDXs";
const CLIENTES_TABLE = `${SUPABASE_URL}/rest/v1/clientes`;

async function salvarCliente(data: Record<string, string>): Promise<void> {
  const res = await fetch(CLIENTES_TABLE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ─── UTM / origem ─────────────────────────────────────────────────────────
function getOrigem(): string {
  const params = new URLSearchParams(window.location.search);
  const utmSource   = params.get("utm_source");
  const utmMedium   = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const ref         = params.get("ref");
  if (utmSource) return [utmSource, utmMedium, utmCampaign].filter(Boolean).join(" / ");
  if (ref)       return ref;
  const ref2 = document.referrer;
  if (ref2.includes("instagram")) return "Instagram (referrer)";
  if (ref2.includes("tiktok"))    return "TikTok (referrer)";
  if (ref2.includes("youtube"))   return "YouTube (referrer)";
  if (ref2.includes("facebook"))  return "Facebook (referrer)";
  if (ref2.includes("twitter") || ref2.includes("t.co")) return "Twitter/X (referrer)";
  return ref2 ? `Outro: ${ref2}` : "Direto";
}

// ─── Dados do formulário ───────────────────────────────────────────────────
const SISTEMAS = ["D&D", "Pathfinder", "Tormenta20", "Vampire", "Ordem Paranormal", "Call of Cthulhu", "Outro"];
const DIAS     = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const PERIODOS = ["Manhã", "Tarde", "Noite"];
const TEMPO_OPTIONS = ["Nunca joguei", "Menos de 1 ano", "De 1 a 4 anos", "Mais de 5 anos"];

interface FormData {
  nome: string;
  idade: string;
  whatsapp_discord: string;
  tempo_rpg: string;
  sistemas_jogados: string[];
  sistemas_desejados: string[];
  melhor_dia: string[];
  melhor_periodo: string;
  ciente_valores: string;
  ciente_compromisso: string;
  ciente_contrato: string;
  ciente_taxa: string;
  ciente_tolerancia: string;
  ciente_consentimento: string;
  pronto_ingressar: string;
  codigo_desconto: string;
}

const formInicial: FormData = {
  nome: "", idade: "", whatsapp_discord: "",
  tempo_rpg: "", sistemas_jogados: [], sistemas_desejados: [],
  melhor_dia: [], melhor_periodo: "",
  ciente_valores: "", ciente_compromisso: "", ciente_contrato: "",
  ciente_taxa: "", ciente_tolerancia: "", ciente_consentimento: "",
  pronto_ingressar: "", codigo_desconto: "",
};

// ─── Estilos compartilhados ────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0d0720; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0d0720; }
  ::-webkit-scrollbar-thumb { background: #4a2a8a; border-radius: 4px; }

  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes glow      { 0%,100%{box-shadow:0 0 20px #7c3aed33} 50%{box-shadow:0 0 45px #7c3aed77} }
  @keyframes gridPulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes popIn     { 0%{transform:scale(0.85);opacity:0} 100%{transform:scale(1);opacity:1} }

  .fade-up { animation: fadeUp 0.6s ease both; }
  .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
  .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
  .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }

  .grid-bg {
    background-image:
      linear-gradient(rgba(124,58,237,0.12) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,0.12) 1px, transparent 1px);
    background-size: 48px 48px;
    animation: gridPulse 6s ease-in-out infinite;
  }

  .hero-title {
    font-family: 'Cinzel', serif;
    font-weight: 900;
    background: linear-gradient(135deg, #e879f9, #c084fc, #818cf8, #c084fc);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .btn-primary {
    background: linear-gradient(135deg, #7c3aed, #a855f7, #7c3aed);
    background-size: 200% auto;
    color: #fff;
    border: none;
    border-radius: 50px;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s;
    animation: glow 3s ease-in-out infinite;
  }
  .btn-primary:hover { background-position: right center; transform: translateY(-2px); box-shadow: 0 8px 30px #7c3aed66; }

  .btn-ghost {
    background: transparent;
    color: #c9a0f5;
    border: 1px solid #4a2a8a;
    border-radius: 50px;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.25s;
  }
  .btn-ghost:hover { border-color: #7c3aed; background: rgba(124,58,237,0.1); }

  .card {
    background: linear-gradient(135deg, #1a0d3a, #110828);
    border: 1px solid #2d1b69;
    border-radius: 16px;
    transition: all 0.3s;
  }
  .card:hover { border-color: #7c3aed; transform: translateY(-4px); box-shadow: 0 12px 40px #7c3aed22; }

  .tag-btn {
    border: 1px solid #4a2a8a;
    border-radius: 50px;
    background: transparent;
    color: #c9a0f5;
    font-family: 'Cinzel', serif;
    font-size: 12px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .tag-btn:hover { border-color: #a855f7; background: rgba(168,85,247,0.1); }
  .tag-btn.selected { background: linear-gradient(135deg, #4a2a8a, #7c3aed); border-color: #a855f7; color: #fff; }

  .form-input {
    width: 100%;
    background: #110828;
    border: 1px solid #4a2a8a;
    border-radius: 10px;
    color: #e2d0ff;
    font-family: 'Lato', sans-serif;
    font-size: 15px;
    padding: 14px 16px;
    outline: none;
    transition: border 0.2s;
  }
  .form-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
  .form-input::placeholder { color: #4a2a8a; }

  .section-label {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #7c3aed;
    margin-bottom: 8px;
  }

  .sistema-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(124,58,237,0.15);
    border: 1px solid #4a2a8a;
    border-radius: 8px;
    padding: 4px 12px;
    font-family: 'Cinzel', serif;
    font-size: 11px;
    color: #c9a0f5;
  }

  .progress-bar {
    height: 3px;
    background: #2d1b69;
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #e879f9);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  @media (max-width: 640px) {
    .hero-title { font-size: clamp(32px, 9vw, 56px) !important; }
    .hide-mobile { display: none !important; }
    .full-mobile { width: 100% !important; }
  }
`;

// ─── Componentes de seção ──────────────────────────────────────────────────

function Navbar({ onInscrever }: { onInscrever: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "12px 24px",
      background: scrolled ? "rgba(13,7,32,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid #2d1b6966" : "none",
      transition: "all 0.3s",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img src="/icons/criandoxp.png" alt="Criando XP" style={{ width: 36, height: 36, objectFit: "contain" }} onClick={handleLogoClick} />
        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: 16, background: "linear-gradient(90deg,#c084fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Criando XP</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <a href="https://instagram.com/criandoxp" target="_blank" rel="noreferrer"
          style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#7c3aed", textDecoration: "none", letterSpacing: 1 }}
          className="hide-mobile">@CriandoXP</a>
        <button className="btn-primary" onClick={onInscrever}
          style={{ padding: "10px 24px", fontSize: 13 }}>
          Inscrever-se
        </button>
      </div>
    </nav>
  );
}

function Hero({ onInscrever }: { onInscrever: () => void }) {
  return (
    <section className="grid-bg" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: "100px 24px 60px", position: "relative", overflow: "hidden",
    }}>
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 300, height: 300, background: "radial-gradient(circle, #7c3aed33, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 250, height: 250, background: "radial-gradient(circle, #e879f933, transparent 70%)", pointerEvents: "none" }} />

      <img src="/icons/criandoxp.png" alt="Criando XP" className="fade-up"
        style={{ width: 100, height: 100, objectFit: "contain", marginBottom: 28, animation: "float 4s ease-in-out infinite" }} />

      <h1 className="hero-title fade-up-1" style={{ fontSize: "clamp(48px, 8vw, 80px)", lineHeight: 1.05, marginBottom: 24, maxWidth: 700 }}>
        Mesas de RPG<br />Profissional
      </h1>

      <div className="fade-up-2" style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        border: "1px solid #4a2a8a", borderRadius: 50, padding: "10px 20px",
        marginBottom: 36, background: "rgba(74,42,138,0.15)",
      }}>
        <span>🎲</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#c9a0f5", letterSpacing: 1 }}>A partir de R$ 20,00 a sessão</span>
      </div>

      <div className="fade-up-3" style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn-primary" onClick={onInscrever}
          style={{ padding: "16px 36px", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          ⚔️ Inscrever-se Agora
        </button>
        <a href="#sobre" style={{ textDecoration: "none" }}>
          <button className="btn-ghost" style={{ padding: "16px 28px", fontSize: 13 }}>
            Saiba mais ↓
          </button>
        </a>
      </div>
    </section>
  );
}

function Beneficios() {
  const items = [
    { icon: "📜", title: "Mesas com Contrato",   desc: "Nunca mais veja sua campanha ser abandonada" },
    { icon: "🎯", title: "Sessão Zero Gratuita", desc: "Inicie sua aventura de graça" },
    { icon: "🛡️", title: "Espaço Seguro",        desc: "100% inclusivo — PcD, LGBTQIA+ e mulheres" },
    { icon: "📅", title: "Eventos Semanais",      desc: "Na comunidade, toda semana" },
    { icon: "🌱", title: "Apoiamos Iniciantes",   desc: "Nunca jogou? Comece aqui" },
    { icon: "🎨", title: "Arte Profissional",     desc: "Ilustrações de alta qualidade" },
    { icon: "🧠", title: "Apoio Psicológico",     desc: "Suporte com profissionais da saúde" },
    { icon: "💰", title: "Combos & Descontos",    desc: "Pague menos em mais mesas" },
  ];

  return (
    <section id="beneficios" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div className="section-label">✦ O que você ganha</div>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 900, color: "#e879f9", letterSpacing: 1 }}>
          Quais São os Benefícios?
        </h2>
        <p style={{ fontFamily: "'Lato', sans-serif", color: "#7c3aed", marginTop: 10, fontSize: 14 }}>
          Tudo que você ganha ao fazer parte da Criando XP
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{ padding: "28px 20px", textAlign: "center", animationDelay: `${i * 0.07}s` }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>{item.icon}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: "#c084fc", marginBottom: 8, letterSpacing: 0.5 }}>{item.title}</div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: "#9d8bbf", lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Sistemas() {
  const sistemas = [
    { icon: "⚔️", nome: "D&D" },
    { icon: "🧛", nome: "Vampire" },
    { icon: "👁️", nome: "Ordem Paranormal" },
    { icon: "🐙", nome: "Call of Cthulhu" },
    { icon: "⚡", nome: "Tormenta20" },
    { icon: "🗺️", nome: "Pathfinder" },
    { icon: "✨", nome: "+ Muito mais!" },
  ];

  return (
    <section id="sistemas" style={{ padding: "80px 24px", background: "linear-gradient(180deg, transparent, #110828 40%, transparent)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="section-label">✦ Nossos Sistemas</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "#e2d0ff" }}>
            Você Escolhe a Aventura
          </h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 52 }}>
          {sistemas.map((s, i) => (
            <div key={i} className="card" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 8, cursor: "default" }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#c9a0f5", letterSpacing: 0.5 }}>{s.nome}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {/* Sobre */}
          <div className="card" style={{ padding: "28px 24px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: "#c084fc", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              🔮 A Criando XP
            </div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: "#9d8bbf", lineHeight: 1.7 }}>
              A Criando XP é uma empresa de mesas de RPG comissionadas, que busca{" "}
              <strong style={{ color: "#a855f7" }}>profissionalizar mestres</strong> e criar um ambiente seguro, respeitoso, acolhedor e responsável para seus jogadores.
            </p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: "#9d8bbf", lineHeight: 1.7, marginTop: 12 }}>
              Além de sempre prezar pela diversão de todos, também preza pelo{" "}
              <strong style={{ color: "#a855f7" }}>compromisso, responsabilidade e pontualidade</strong>, tanto com mestres quanto com jogadores.
            </p>
          </div>

          {/* Valores */}
          <div className="card" style={{ padding: "28px 24px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: "#c084fc", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              💎 Valores & Cobranças
            </div>
            {[
              { label: "Por sessão",     valor: "R$ 20 a R$ 25" },
              { label: "Média mensal",   valor: "R$ 80 a R$ 125" },
              { label: "Vencimento",     valor: "Todo dia 10" },
              { label: "Taxa de entrada",valor: "4 sessões (abatida no final)" },
            ].map((v, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid #2d1b69" : "none" }}>
                <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: "#7c3aed" }}>{v.label}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: "#e2d0ff" }}>{v.valor}</span>
              </div>
            ))}
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#5a3a8a", marginTop: 12, textAlign: "center" }}>
              Não pode pagar a taxa? Entre sem ela e pague apenas se precisar sair da mesa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contrato() {
  const regras = [
    { icon: "⚖️", titulo: "Integridade",    desc: "Proibida qualquer forma de discriminação ou desrespeito. Comportamento antissocial pode resultar em expulsão." },
    { icon: "💛", titulo: "Compromisso",    desc: "Campanhas de 6 meses a 1 ano e meio. Sessões semanais de 3h em calendário fixo." },
    { icon: "📅", titulo: "Faltas",         desc: "Faltas injustificadas são cobradas normalmente. Imprevistos fora do controle do jogador não são cobrados." },
    { icon: "💬", titulo: "Consentimento",  desc: "Você recebe uma lista de consentimento para indicar gatilhos e temas que não quer na mesa." },
  ];

  return (
    <section id="sobre" style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="section-label">✦ Regras</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, color: "#e2d0ff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            📋 Contrato & Regras
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          {regras.map((r, i) => (
            <div key={i} className="card" style={{ padding: "24px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{r.icon}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: "#c084fc", marginBottom: 10, letterSpacing: 0.5 }}>{r.titulo}</div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: "#9d8bbf", lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#fca5a5" }}>🔞 Idade mínima: 18 anos</span>
        </div>
      </div>
    </section>
  );
}

// ─── Formulário ────────────────────────────────────────────────────────────
function Formulario({ onVoltar }: { onVoltar: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(formInicial);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const toggleArray = (field: "sistemas_jogados" | "sistemas_desejados" | "melhor_dia", val: string) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const toggleSingle = (field: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [field]: prev[field] === val ? "" : val }));
  };

  const enviar = async () => {
    setEnviando(true);
    setErro("");
    try {
      const origem = getOrigem();
      await salvarCliente({
        nome:                 form.nome,
        idade:                form.idade,
        whatsapp_discord:     form.whatsapp_discord,
        tempo_rpg:            form.tempo_rpg,
        sistemas_jogados:     form.sistemas_jogados.join(", "),
        sistemas_desejados:   form.sistemas_desejados.join(", "),
        melhor_dia:           form.melhor_dia.join(", "),
        melhor_periodo:       form.melhor_periodo,
        ciente_valores:       form.ciente_valores,
        ciente_compromisso:   form.ciente_compromisso,
        ciente_contrato:      form.ciente_contrato,
        ciente_taxa:          form.ciente_taxa,
        ciente_tolerancia:    form.ciente_tolerancia,
        ciente_consentimento: form.ciente_consentimento,
        pronto_ingressar:     form.pronto_ingressar,
        codigo_desconto:      form.codigo_desconto,
        status:               "Novo lead",
        notas:                `Origem: ${origem}`,
      });
      setEnviado(true);
    } catch (e: any) {
      setErro("Erro ao enviar. Tente novamente ou entre em contato pelo Instagram.");
    } finally {
      setEnviando(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', serif", fontSize: 13, color: "#c9a0f5",
    display: "block", marginBottom: 10, letterSpacing: 0.5,
  };
  const reqMark = <span style={{ color: "#e879f9" }}>*</span>;

  if (enviado) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", animation: "popIn 0.5s ease" }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🎲</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 32, fontWeight: 900, color: "#c084fc", marginBottom: 16 }}>
            Aventura Iniciada!
          </h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, color: "#9d8bbf", lineHeight: 1.7, marginBottom: 32, maxWidth: 400 }}>
            Recebemos sua inscrição! Em breve nossa equipe entrará em contato pelo WhatsApp ou Discord para te apresentar as mesas disponíveis. 🧙
          </p>
          <button className="btn-primary" onClick={onVoltar} style={{ padding: "14px 32px", fontSize: 14 }}>
            ← Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} style={{ minHeight: "100vh", padding: "80px 16px 40px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header do form */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div className="section-label">✦ Passo {step + 1} de {totalSteps}</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 900, color: "#e879f9", marginBottom: 16 }}>
            {step === 0 ? "📋 Seus Dados" : step === 1 ? "🎲 Suas Preferências" : "✅ Confirmações"}
          </h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* ── STEP 0: Dados pessoais ── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={labelStyle}>Seu nome completo {reqMark}</label>
              <input className="form-input" value={form.nome} placeholder="Como devemos te chamar?"
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Sua idade {reqMark}</label>
              <input className="form-input" value={form.idade} placeholder="Ex: 23" type="number"
                onChange={e => setForm(p => ({ ...p, idade: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp e @ do Discord {reqMark}</label>
              <input className="form-input" value={form.whatsapp_discord} placeholder="(11) 99999-9999 / usuario#0000"
                onChange={e => setForm(p => ({ ...p, whatsapp_discord: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Há quanto tempo você joga RPG de mesa? {reqMark}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TEMPO_OPTIONS.map(t => (
                  <button key={t} className={`tag-btn ${form.tempo_rpg === t ? "selected" : ""}`}
                    onClick={() => toggleSingle("tempo_rpg", t)}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-ghost" onClick={onVoltar} style={{ padding: "14px 20px", fontSize: 13, flex: 1 }}>
                ← Voltar
              </button>
              <button className="btn-primary"
                onClick={() => { if (!form.nome || !form.idade || !form.whatsapp_discord || !form.tempo_rpg) { setErro("Preencha todos os campos obrigatórios."); return; } setErro(""); setStep(1); }}
                style={{ padding: "14px 0", fontSize: 14, flex: 2 }}>
                Próximo →
              </button>
            </div>
            {erro && <p style={{ color: "#fca5a5", fontFamily: "'Lato', sans-serif", fontSize: 13, textAlign: "center" }}>{erro}</p>}
          </div>
        )}

        {/* ── STEP 1: Preferências ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <label style={labelStyle}>Quais sistemas você já jogou?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Nunca joguei", ...SISTEMAS].map(s => (
                  <button key={s} className={`tag-btn ${form.sistemas_jogados.includes(s) ? "selected" : ""}`}
                    onClick={() => toggleArray("sistemas_jogados", s)}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Quais sistemas gostaria de jogar conosco? {reqMark}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SISTEMAS.map(s => (
                  <button key={s} className={`tag-btn ${form.sistemas_desejados.includes(s) ? "selected" : ""}`}
                    onClick={() => toggleArray("sistemas_desejados", s)}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Qual é o seu melhor dia para jogar? {reqMark}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DIAS.map(d => (
                  <button key={d} className={`tag-btn ${form.melhor_dia.includes(d) ? "selected" : ""}`}
                    onClick={() => toggleArray("melhor_dia", d)}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Qual é o seu melhor período? {reqMark}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PERIODOS.map(p => (
                  <button key={p} className={`tag-btn ${form.melhor_periodo === p ? "selected" : ""}`}
                    onClick={() => toggleSingle("melhor_periodo", p)}>{p}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="btn-ghost" onClick={() => setStep(0)} style={{ padding: "14px 20px", fontSize: 13, flex: 1 }}>
                ← Voltar
              </button>
              <button className="btn-primary"
                onClick={() => { if (!form.sistemas_desejados.length || !form.melhor_dia.length || !form.melhor_periodo) { setErro("Preencha todos os campos obrigatórios."); return; } setErro(""); setStep(2); }}
                style={{ padding: "14px 0", fontSize: 14, flex: 2 }}>
                Próximo →
              </button>
            </div>
            {erro && <p style={{ color: "#fca5a5", fontFamily: "'Lato', sans-serif", fontSize: 13, textAlign: "center" }}>{erro}</p>}
          </div>
        )}

        {/* ── STEP 2: Confirmações ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: "#9d8bbf", lineHeight: 1.6, marginBottom: 8 }}>
              Por favor, confirme que você está ciente de cada item abaixo para concluir sua inscrição:
            </p>

            {[
              { key: "ciente_valores",       txt: "Estou ciente dos valores e cobranças (R$20–25/sessão, vencimento dia 10)." },
              { key: "ciente_compromisso",   txt: "Estou ciente do compromisso de longo prazo (6 meses a 1 ano e meio, sessões semanais fixas)." },
              { key: "ciente_contrato",      txt: "Estou ciente de que assinarei um contrato ao ingressar na mesa." },
              { key: "ciente_taxa",          txt: "Estou ciente da taxa de entrada de 4 sessões (abatida no final caso permaneça)." },
              { key: "ciente_tolerancia",    txt: "Estou ciente de que comportamento antissocial, discriminatório ou desrespeitoso pode resultar em expulsão." },
              { key: "ciente_consentimento", txt: "Estou ciente de que receberei uma lista de consentimento para indicar gatilhos e temas que não quero na mesa." },
            ].map(({ key, txt }) => {
              const val = form[key as keyof FormData] as string;
              return (
                <div key={key}
                  onClick={() => toggleSingle(key as keyof FormData, "Sim")}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
                    background: val === "Sim" ? "rgba(124,58,237,0.15)" : "#110828",
                    border: `1px solid ${val === "Sim" ? "#7c3aed" : "#2d1b69"}`,
                    borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, border: `2px solid ${val === "Sim" ? "#7c3aed" : "#4a2a8a"}`,
                    background: val === "Sim" ? "#7c3aed" : "transparent", flexShrink: 0, marginTop: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  }}>
                    {val === "Sim" && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: val === "Sim" ? "#e2d0ff" : "#9d8bbf", lineHeight: 1.5 }}>{txt}</span>
                </div>
              );
            })}

            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Você está pronto para ingressar? {reqMark}</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Sim, estou pronto!", "Ainda tenho dúvidas"].map(op => (
                  <button key={op} className={`tag-btn ${form.pronto_ingressar === op ? "selected" : ""}`}
                    style={{ flex: 1 }}
                    onClick={() => toggleSingle("pronto_ingressar", op)}>{op}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Código de desconto (opcional)</label>
              <input className="form-input" value={form.codigo_desconto} placeholder="Insira seu código, se tiver"
                onChange={e => setForm(p => ({ ...p, codigo_desconto: e.target.value }))} />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-ghost" onClick={() => setStep(1)} style={{ padding: "14px 20px", fontSize: 13, flex: 1 }}>
                ← Voltar
              </button>
              <button className="btn-primary"
                disabled={enviando}
                onClick={() => {
                  const allChecked = ["ciente_valores","ciente_compromisso","ciente_contrato","ciente_taxa","ciente_tolerancia","ciente_consentimento"]
                    .every(k => form[k as keyof FormData] === "Sim");
                  if (!allChecked || !form.pronto_ingressar) { setErro("Confirme todos os itens e responda se está pronto."); return; }
                  setErro(""); enviar();
                }}
                style={{ padding: "14px 0", fontSize: 14, flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {enviando
                  ? <><div style={{ width: 16, height: 16, border: "2px solid #fff5", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Enviando...</>
                  : "🎲 Confirmar Inscrição"}
              </button>
            </div>
            {erro && <p style={{ color: "#fca5a5", fontFamily: "'Lato', sans-serif", fontSize: 13, textAlign: "center" }}>{erro}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: "32px 24px", borderTop: "1px solid #2d1b69", textAlign: "center" }}>
      <img src="/icons/criandoxp.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", marginBottom: 8 }} />
      <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#3d1b69", letterSpacing: 2, textTransform: "uppercase" }}>
        © 2026 Criando XP · Mesas de RPG Profissional
      </p>
    </footer>
  );
}

// ─── LandingPage principal ─────────────────────────────────────────────────
export default function LandingPage({ onAbrirDashboard }: { onAbrirDashboard: () => void }) {
  const [paginaAtual, setPaginaAtual] = useState<"landing" | "form">("landing");

  // ── Segredo: 7 cliques no logo abre o dashboard ──
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 2000);
    if (clickCount.current >= 7) {
      clickCount.current = 0;
      onAbrirDashboard();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0720 0%, #1a0d3a 40%, #0d0720 100%)", color: "#e2d0ff" }}>
      <style>{CSS}</style>

      {paginaAtual === "landing" ? (
        <>
  <Navbar onInscrever={() => setPaginaAtual("form")} onLogoClick={handleLogoClick} />

          {/* Logo clicável secreto — fica invisível no canto */}
          <div
            onClick={handleLogoClick}
            style={{ position: "fixed", bottom: 16, right: 16, zIndex: 200, width: 40, height: 40, borderRadius: "50%", cursor: "default", opacity: 0 }}
            title=""
          />

          <Hero onInscrever={() => setPaginaAtual("form")} />
          <Beneficios />
          <Sistemas/>
          <Contrato />

          {/* CTA final */}
          <section style={{ padding: "80px 24px", textAlign: "center" }}>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, color: "#e879f9", marginBottom: 16 }}>
                Pronto para sua aventura?
              </h2>
              <p style={{ fontFamily: "'Lato', sans-serif", color: "#9d8bbf", fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
                Preencha nosso formulário e em breve entraremos em contato para te apresentar as mesas disponíveis.
              </p>
              <button className="btn-primary" onClick={() => setPaginaAtual("form")}
                style={{ padding: "18px 48px", fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10 }}>
                ⚔️ Inscrever-se Agora
              </button>
            </div>
          </section>

          <Footer />
        </>
      ) : (
        <>
          <Navbar onInscrever={() => {}} onLogoClick={handleLogoClick} />
          <Formulario onVoltar={() => setPaginaAtual("landing")} />
          <Footer />
        </>
      )}
    </div>
  );
      }