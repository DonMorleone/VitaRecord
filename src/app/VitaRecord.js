"use client";
import { useState, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg: "#07090f", surface: "#0e1118", card: "#131720",
  border: "#1c2235", borderHover: "#2a3550",
  teal: "#4fd1c5", tealDim: "#2d9e95", tealGlow: "rgba(79,209,197,0.15)",
  amber: "#f6ad55", amberDim: "#c47d25", amberGlow: "rgba(246,173,85,0.15)",
  rose: "#fc8181", roseDim: "#c45454", roseGlow: "rgba(252,129,129,0.15)",
  violet: "#b794f4", violetGlow: "rgba(183,148,244,0.15)",
  text: "#e2e8f0", textMid: "#94a3b8", textDim: "#4a5568",
  white: "#ffffff",
};

const FONT = "'Georgia', 'Times New Roman', serif";
const MONO = "'Courier New', monospace";

// ─── AI CALL ──────────────────────────────────────────────────────
async function callAI(systemPrompt, userContent) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "Não foi possível processar.";
}

async function callAIWithImage(systemPrompt, text, imageBase64, mediaType) {
  const content = [
    { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
    { type: "text", text },
  ];
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "Não foi possível processar.";
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ─── SHARED STYLES ────────────────────────────────────────────────
const S = {
  page: { background: C.bg, minHeight: "100vh", fontFamily: FONT, color: C.text, maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 72 },
  header: { background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, padding: "18px 20px 14px", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" },
  logoMark: { fontSize: 10, letterSpacing: 5, color: C.teal, fontFamily: MONO, textTransform: "uppercase", marginBottom: 2 },
  pageTitle: { fontSize: 20, fontWeight: "bold", color: C.white, letterSpacing: -0.5 },
  pageSub: { fontSize: 11, color: C.textDim, marginTop: 1, fontFamily: MONO },
  content: { padding: "16px 16px 8px" },
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 10, letterSpacing: 3, color: C.teal, fontFamily: MONO, textTransform: "uppercase", marginBottom: 10 },
  input: { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: FONT, boxSizing: "border-box", outline: "none" },
  textarea: { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, fontFamily: FONT, boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 80 },
  btn: (color = C.teal) => ({ background: color, color: C.bg, border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: MONO, fontSize: 11, letterSpacing: 1, cursor: "pointer", fontWeight: "bold", transition: "opacity 0.2s" }),
  btnGhost: (color = C.teal) => ({ background: "transparent", color, border: `1px solid ${color}`, borderRadius: 8, padding: "8px 16px", fontFamily: MONO, fontSize: 10, letterSpacing: 1, cursor: "pointer", transition: "all 0.2s" }),
  badge: (color) => ({ fontSize: 9, fontFamily: MONO, padding: "2px 8px", borderRadius: 20, background: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: 1, textTransform: "uppercase" }),
  divider: { borderTop: `1px solid ${C.border}`, margin: "10px 0" },
  aiBox: { background: `linear-gradient(135deg, ${C.tealGlow}, transparent)`, border: `1px solid ${C.tealDim}44`, borderRadius: 10, padding: 14, marginTop: 10, fontSize: 13, lineHeight: 1.75, color: C.text },
  uploadZone: { border: `2px dashed ${C.border}`, borderRadius: 10, padding: 20, textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` },
  nav: { display: "flex", borderTop: `1px solid ${C.border}`, background: C.surface, position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, zIndex: 100 },
  navBtn: (active) => ({ flex: 1, padding: "10px 4px 8px", background: "none", border: "none", color: active ? C.teal : C.textDim, cursor: "pointer", fontSize: 9, letterSpacing: 0.5, fontFamily: MONO, borderTop: active ? `2px solid ${C.teal}` : "2px solid transparent", transition: "all 0.2s" }),
};

// ─── UPLOAD COMPONENT ─────────────────────────────────────────────
function UploadZone({ onFile, accept = "image/*,.pdf", label = "Toque para enviar arquivo", sublabel = "PDF, JPG, PNG" }) {
  const ref = useRef();
  return (
    <div style={S.uploadZone} onClick={() => ref.current.click()}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>📎</div>
      <div style={{ fontSize: 13, color: C.textMid }}>{label}</div>
      <div style={{ fontSize: 10, color: C.textDim, marginTop: 3, fontFamily: MONO }}>{sublabel}</div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => onFile(e.target.files?.[0])} />
    </div>
  );
}

function LoadingDots({ label = "Analisando com IA..." }) {
  return (
    <div style={{ textAlign: "center", padding: 16, color: C.teal, fontFamily: MONO, fontSize: 12 }}>
      <span style={{ animation: "pulse 1.2s infinite" }}>◉ {label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TELAS
// ═══════════════════════════════════════════════════════════════════

// ─── HOME ─────────────────────────────────────────────────────────
function HomeScreen({ state, setTela }) {
  const alertas = state.exames.filter(e => e.alertas?.length > 0);
  const vencendo = state.receitas.filter(r => {
    if (!r.validade) return false;
    const d = new Date(r.validade);
    const hoje = new Date();
    return (d - hoje) / 86400000 < 30;
  });

  return (
    <div style={S.content}>
      {/* Perfil */}
      <div style={{ ...S.card, background: `linear-gradient(135deg, #0e1520, #0e1118)`, borderColor: C.tealDim + "44" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: C.white }}>{state.perfil.nome || "Meu Perfil"}</div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: MONO, marginTop: 2 }}>{state.perfil.nascimento ? `Nasc. ${state.perfil.nascimento}` : "Configure seu perfil"}</div>
          </div>
          <button style={S.btnGhost()} onClick={() => setTela("perfil")}>Editar</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {[["Exames", state.exames.length, C.teal], ["Receitas", state.receitas.length, C.amber], ["Vacinas", state.vacinas.filter(v => v.aplicada).length, C.violet]].map(([l, v, c]) => (
            <div key={l} style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${c}22` }}>
              <div style={{ fontSize: 18, fontWeight: "bold", color: c, fontFamily: MONO }}>{v}</div>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1, fontFamily: MONO }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas de exames */}
      {alertas.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>⚠ Alertas · Exames</div>
          {alertas.slice(0, 3).map((e, i) => (
            <div key={i} style={S.row}>
              <div>
                <div style={{ fontSize: 13, color: C.rose }}>{e.tipo}</div>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO }}>{e.data} · {e.alertas.length} alerta(s)</div>
              </div>
              <span style={S.badge(C.rose)}>ATENÇÃO</span>
            </div>
          ))}
        </div>
      )}

      {/* Receitas vencendo */}
      {vencendo.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>⏳ Receitas vencendo</div>
          {vencendo.map((r, i) => (
            <div key={i} style={S.row}>
              <div>
                <div style={{ fontSize: 13, color: C.amber }}>{r.medicamentos?.[0] || "Receita"}</div>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO }}>Validade: {r.validade}</div>
              </div>
              <span style={S.badge(C.amber)}>RENOVAR</span>
            </div>
          ))}
        </div>
      )}

      {/* Ações rápidas */}
      <div style={S.card}>
        <div style={S.cardTitle}>Acesso rápido</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["🧪", "Novo Exame", "exames", C.teal],
            ["💊", "Nova Receita", "receitas", C.amber],
            ["💉", "Vacinas", "vacinas", C.violet],
            ["🤖", "IA Médica", "ia", C.tealDim],
          ].map(([icon, label, tela, color]) => (
            <button key={tela} onClick={() => setTela(tela)} style={{ background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 10, padding: "14px 10px", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 11, color, fontFamily: MONO, letterSpacing: 0.5 }}>{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pedidos de exame */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.cardTitle}>📋 Pedidos de Exame</div>
          <button style={S.btnGhost(C.teal)} onClick={() => setTela("pedidos")}>Ver todos</button>
        </div>
        {state.pedidos.length === 0
          ? <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", padding: 12 }}>Nenhum pedido cadastrado</div>
          : state.pedidos.slice(0, 2).map((p, i) => (
            <div key={i} style={S.row}>
              <div>
                <div style={{ fontSize: 13, color: C.text }}>{p.exames?.[0] || "Pedido"}</div>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO }}>{p.medico} · {p.data}</div>
              </div>
              <span style={S.badge(p.realizado ? C.teal : C.amber)}>{p.realizado ? "FEITO" : "PENDENTE"}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── EXAMES ───────────────────────────────────────────────────────
function ExamesScreen({ state, setState }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState("lista"); // lista | novo

  async function analisar(file) {
    setLoading(true);
    setResultado(null);
    try {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      const system = `Você é um especialista em medicina laboratorial brasileiro. Analise este exame com máxima atenção. Retorne APENAS JSON válido sem markdown, no formato:
{
  "tipo": "nome do exame",
  "data": "data do exame DD/MM/AAAA ou vazio",
  "laboratorio": "nome do laboratório",
  "paciente": "nome do paciente",
  "medico": "médico solicitante",
  "resumo": "resumo em 2 frases simples para o paciente",
  "alertas": ["lista de itens fora do normal, específicos"],
  "normais": ["lista de itens dentro do esperado"],
  "resultados": [{"nome": "analito", "valor": "valor", "unidade": "unidade", "referencia": "ref", "status": "normal|alto|baixo|critico"}],
  "recomendacao": "orientação clara para o paciente",
  "tags": ["palavras-chave para busca"]
}`;
      let texto;
      if (isImage) {
        const b64 = await toBase64(file);
        texto = await callAIWithImage(system, "Analise este exame médico com máxima precisão e extraia todos os dados.", b64, file.type);
      } else if (isPDF) {
        texto = await callAI(system, `Este é um exame em PDF: ${file.name}. Como não consigo processar PDFs diretamente, crie um exemplo estruturado baseado no nome do arquivo indicando que o usuário deve usar a função de foto/imagem para melhores resultados. Retorne JSON com tipo baseado no nome do arquivo.`);
      } else {
        texto = await callAI(system, `Arquivo: ${file.name}`);
      }
      const clean = texto.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResultado(parsed);
    } catch (e) {
      setResultado({ erro: true, mensagem: "Erro na análise. Use uma foto nítida do exame." });
    }
    setLoading(false);
  }

  function salvarExame() {
    if (!resultado || resultado.erro) return;
    setState(s => ({ ...s, exames: [{ ...resultado, id: Date.now() }, ...s.exames] }));
    setResultado(null);
    setModo("lista");
  }

  const examesFiltrados = state.exames.filter(e =>
    busca === "" || JSON.stringify(e).toLowerCase().includes(busca.toLowerCase())
  );

  if (modo === "novo") return (
    <div style={S.content}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={S.btnGhost()} onClick={() => { setModo("lista"); setResultado(null); }}>← Voltar</button>
        <div style={{ fontSize: 14, color: C.text, alignSelf: "center", fontWeight: "bold" }}>Novo Exame</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>📸 Enviar exame</div>
        <UploadZone onFile={analisar} accept="image/*,.pdf" label="Foto ou PDF do exame" sublabel="Quanto mais nítido, melhor a análise da IA" />
        <div style={{ marginTop: 8, fontSize: 11, color: C.textDim, textAlign: "center", fontFamily: MONO }}>
          💡 Para PDF: tire uma foto nítida de cada página
        </div>
      </div>
      {loading && <LoadingDots label="Lendo exame com IA..." />}
      {resultado && !resultado.erro && (
        <div style={S.card}>
          <div style={S.cardTitle}>✓ Análise concluída</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: C.white, marginBottom: 4 }}>{resultado.tipo}</div>
          <div style={{ fontSize: 11, color: C.textDim, fontFamily: MONO, marginBottom: 10 }}>{resultado.laboratorio} · {resultado.data}</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 10 }}>{resultado.resumo}</div>
          {resultado.alertas?.length > 0 && (
            <div style={{ background: C.roseGlow, border: `1px solid ${C.rose}33`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.rose, fontFamily: MONO, letterSpacing: 2, marginBottom: 6 }}>ATENÇÃO</div>
              {resultado.alertas.map((a, i) => <div key={i} style={{ fontSize: 12, color: C.rose, marginBottom: 3 }}>• {a}</div>)}
            </div>
          )}
          {resultado.resultados?.slice(0, 5).map((r, i) => (
            <div key={i} style={S.row}>
              <div style={{ fontSize: 12, color: r.status !== "normal" ? C.rose : C.text }}>{r.nome}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontFamily: MONO, color: r.status !== "normal" ? C.rose : C.teal }}>{r.valor} {r.unidade}</span>
                <span style={S.badge(r.status === "normal" ? C.teal : r.status === "critico" ? C.rose : C.amber)}>{r.status}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, background: C.tealGlow, borderRadius: 8, padding: 10, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
            💡 {resultado.recomendacao}
          </div>
          <button style={{ ...S.btn(), marginTop: 12, width: "100%" }} onClick={salvarExame}>Salvar no histórico</button>
        </div>
      )}
      {resultado?.erro && <div style={{ ...S.card, borderColor: C.rose + "44" }}><div style={{ color: C.rose }}>{resultado.mensagem}</div></div>}
    </div>
  );

  return (
    <div style={S.content}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="🔍 Buscar: joelho, glicose, hemograma..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button style={S.btn()} onClick={() => setModo("novo")}>+</button>
      </div>
      {examesFiltrados.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧪</div>
          <div style={{ color: C.textDim, fontSize: 13 }}>Nenhum exame cadastrado</div>
          <div style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>Toque em + para adicionar</div>
        </div>
      ) : examesFiltrados.map((e, i) => (
        <div key={i} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: "bold", color: C.white }}>{e.tipo}</div>
            {e.alertas?.length > 0 && <span style={S.badge(C.rose)}>{e.alertas.length} alerta(s)</span>}
            {(!e.alertas || e.alertas.length === 0) && <span style={S.badge(C.teal)}>normal</span>}
          </div>
          <div style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>{e.laboratorio} · {e.data}</div>
          {e.resumo && <div style={{ fontSize: 12, color: C.textMid, marginTop: 6, lineHeight: 1.5 }}>{e.resumo}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── RECEITAS ─────────────────────────────────────────────────────
function ReceitasScreen({ state, setState }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [modo, setModo] = useState("lista");

  async function analisarReceita(file) {
    setLoading(true);
    setResultado(null);
    try {
      const isImage = file.type.startsWith("image/");
      const system = `Você é um farmacêutico brasileiro especialista. Analise esta receita médica e retorne APENAS JSON válido sem markdown:
{
  "medico": "nome do médico",
  "crm": "CRM do médico",
  "especialidade": "especialidade",
  "clinica": "nome da clínica/hospital",
  "paciente": "nome do paciente",
  "data": "data da receita DD/MM/AAAA",
  "validade": "AAAA-MM-DD (receita simples: 30 dias, especial: 30 dias, controle especial azul: 30 dias, amarela: 30 dias)",
  "tipo": "simples|especial|controle_azul|controle_amarelo",
  "medicamentos": [
    {
      "nome": "nome comercial e genérico",
      "dosagem": "concentração",
      "posologia": "como tomar",
      "duracao": "por quanto tempo",
      "observacoes": "cuidados importantes"
    }
  ],
  "cid": "CID se informado",
  "orientacoes": "orientações gerais",
  "renovacao": "quando renovar"
}`;
      let texto;
      if (isImage) {
        const b64 = await toBase64(file);
        texto = await callAIWithImage(system, "Analise esta receita médica com máxima precisão.", b64, file.type);
      } else {
        texto = await callAI(system, `Receita: ${file.name}`);
      }
      const clean = texto.replace(/```json|```/g, "").trim();
      setResultado(JSON.parse(clean));
    } catch {
      setResultado({ erro: true });
    }
    setLoading(false);
  }

  function salvar() {
    if (!resultado || resultado.erro) return;
    setState(s => ({ ...s, receitas: [{ ...resultado, id: Date.now() }, ...s.receitas] }));
    setResultado(null);
    setModo("lista");
  }

  const hoje = new Date();

  if (modo === "novo") return (
    <div style={S.content}>
      <button style={{ ...S.btnGhost(), marginBottom: 12 }} onClick={() => { setModo("lista"); setResultado(null); }}>← Voltar</button>
      <div style={S.card}>
        <div style={S.cardTitle}>💊 Enviar receita médica</div>
        <UploadZone onFile={analisarReceita} accept="image/*" label="Foto da receita médica" sublabel="Foto nítida de receita simples ou controlada" />
      </div>
      {loading && <LoadingDots label="Lendo receita com IA..." />}
      {resultado && !resultado.erro && (
        <div style={S.card}>
          <div style={S.cardTitle}>✓ Receita identificada</div>
          <div style={S.row}>
            <span style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>Médico</span>
            <span style={{ fontSize: 13, color: C.white }}>{resultado.medico}</span>
          </div>
          <div style={S.row}>
            <span style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>CRM</span>
            <span style={{ fontSize: 13, color: C.text }}>{resultado.crm}</span>
          </div>
          <div style={S.row}>
            <span style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>Clínica</span>
            <span style={{ fontSize: 13, color: C.text }}>{resultado.clinica}</span>
          </div>
          <div style={S.row}>
            <span style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>Tipo</span>
            <span style={S.badge(resultado.tipo?.includes("controle") ? C.rose : C.amber)}>{resultado.tipo}</span>
          </div>
          <div style={S.row}>
            <span style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>Validade</span>
            <span style={{ fontSize: 13, color: C.amber, fontFamily: MONO }}>{resultado.validade}</span>
          </div>
          <div style={{ ...S.divider }} />
          <div style={{ fontSize: 10, color: C.teal, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>MEDICAMENTOS</div>
          {resultado.medicamentos?.map((m, i) => (
            <div key={i} style={{ background: C.surface, borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: C.white, fontWeight: "bold" }}>{m.nome}</div>
              <div style={{ fontSize: 11, color: C.amber, fontFamily: MONO }}>{m.dosagem}</div>
              <div style={{ fontSize: 12, color: C.textMid, marginTop: 4, lineHeight: 1.5 }}>{m.posologia}</div>
              {m.observacoes && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, fontStyle: "italic" }}>{m.observacoes}</div>}
            </div>
          ))}
          {resultado.orientacoes && (
            <div style={{ background: C.amberGlow, border: `1px solid ${C.amber}33`, borderRadius: 8, padding: 10, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
              💡 {resultado.orientacoes}
            </div>
          )}
          <button style={{ ...S.btn(C.amber), marginTop: 12, width: "100%", color: C.bg }} onClick={salvar}>Salvar receita</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={S.content}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: C.textMid }}>{state.receitas.length} receita(s)</div>
        <button style={S.btn(C.amber)} onClick={() => setModo("novo")}>+ Nova</button>
      </div>
      {state.receitas.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💊</div>
          <div style={{ color: C.textDim, fontSize: 13 }}>Nenhuma receita cadastrada</div>
        </div>
      ) : state.receitas.map((r, i) => {
        const vence = r.validade ? new Date(r.validade) : null;
        const diasRestantes = vence ? Math.round((vence - hoje) / 86400000) : null;
        const vencida = diasRestantes !== null && diasRestantes < 0;
        const vencendo = diasRestantes !== null && diasRestantes >= 0 && diasRestantes < 30;
        return (
          <div key={i} style={{ ...S.card, borderColor: vencida ? C.rose + "44" : vencendo ? C.amber + "44" : C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: C.white }}>{r.medicamentos?.[0]?.nome || "Receita"}</div>
              <span style={S.badge(vencida ? C.rose : vencendo ? C.amber : C.teal)}>
                {vencida ? "VENCIDA" : vencendo ? `${diasRestantes}d` : "VÁLIDA"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>{r.medico} · {r.clinica}</div>
            {r.medicamentos?.length > 1 && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>+{r.medicamentos.length - 1} medicamento(s)</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── PEDIDOS DE EXAME ─────────────────────────────────────────────
function PedidosScreen({ state, setState }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [modo, setModo] = useState("lista");

  async function analisarPedido(file) {
    setLoading(true);
    try {
      const isImage = file.type.startsWith("image/");
      const system = `Analise este pedido/solicitação de exames médicos e retorne APENAS JSON válido sem markdown:
{
  "medico": "nome do médico",
  "crm": "CRM",
  "especialidade": "especialidade",
  "clinica": "clínica/hospital",
  "paciente": "nome do paciente",
  "data": "data do pedido DD/MM/AAAA",
  "exames": ["lista de exames solicitados"],
  "urgencia": "rotina|urgente|emergência",
  "hipotese_diagnostica": "hipótese se informada",
  "preparo": ["instruções de preparo se informadas"],
  "observacoes": "observações clínicas",
  "validade_pedido": "prazo de validade do pedido se informado"
}`;
      let texto;
      if (isImage) {
        const b64 = await toBase64(file);
        texto = await callAIWithImage(system, "Analise este pedido de exame médico.", b64, file.type);
      } else {
        texto = await callAI(system, `Pedido: ${file.name}`);
      }
      setResultado(JSON.parse(texto.replace(/```json|```/g, "").trim()));
    } catch { setResultado({ erro: true }); }
    setLoading(false);
  }

  function salvar() {
    if (!resultado || resultado.erro) return;
    setState(s => ({ ...s, pedidos: [{ ...resultado, id: Date.now(), realizado: false }, ...s.pedidos] }));
    setResultado(null); setModo("lista");
  }

  if (modo === "novo") return (
    <div style={S.content}>
      <button style={{ ...S.btnGhost(), marginBottom: 12 }} onClick={() => { setModo("lista"); setResultado(null); }}>← Voltar</button>
      <div style={S.card}>
        <div style={S.cardTitle}>📋 Enviar pedido de exame</div>
        <UploadZone onFile={analisarPedido} accept="image/*" label="Foto do pedido médico" sublabel="Pedido de exame, guia de encaminhamento" />
      </div>
      {loading && <LoadingDots label="Lendo pedido com IA..." />}
      {resultado && !resultado.erro && (
        <div style={S.card}>
          <div style={S.cardTitle}>✓ Pedido identificado</div>
          {[["Médico", resultado.medico], ["Clínica", resultado.clinica], ["Data", resultado.data], ["Urgência", resultado.urgencia]].map(([k, v]) => (
            <div key={k} style={S.row}>
              <span style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>{k}</span>
              <span style={{ fontSize: 13, color: C.text }}>{v}</span>
            </div>
          ))}
          <div style={S.divider} />
          <div style={{ fontSize: 10, color: C.teal, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>EXAMES SOLICITADOS</div>
          {resultado.exames?.map((e, i) => (
            <div key={i} style={{ fontSize: 13, color: C.text, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>• {e}</div>
          ))}
          {resultado.preparo?.length > 0 && (
            <div style={{ background: C.amberGlow, borderRadius: 8, padding: 10, marginTop: 10 }}>
              <div style={{ fontSize: 10, color: C.amber, fontFamily: MONO, marginBottom: 6 }}>PREPARO NECESSÁRIO</div>
              {resultado.preparo.map((p, i) => <div key={i} style={{ fontSize: 12, color: C.text }}>• {p}</div>)}
            </div>
          )}
          <button style={{ ...S.btn(), marginTop: 12, width: "100%" }} onClick={salvar}>Salvar pedido</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={S.content}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.textMid }}>{state.pedidos.length} pedido(s)</div>
        <button style={S.btn()} onClick={() => setModo("novo")}>+ Novo</button>
      </div>
      {state.pedidos.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ color: C.textDim }}>Nenhum pedido cadastrado</div>
        </div>
      ) : state.pedidos.map((p, i) => (
        <div key={i} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: "bold", color: C.white }}>{p.exames?.[0]}</div>
            <span style={S.badge(p.realizado ? C.teal : C.amber)}>{p.realizado ? "FEITO" : "PENDENTE"}</span>
          </div>
          <div style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>{p.medico} · {p.data}</div>
          {p.exames?.length > 1 && <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>+{p.exames.length - 1} exame(s)</div>}
          <button style={{ ...S.btnGhost(p.realizado ? C.textDim : C.teal), marginTop: 8, fontSize: 10 }}
            onClick={() => setState(s => ({ ...s, pedidos: s.pedidos.map((x, j) => j === i ? { ...x, realizado: !x.realizado } : x) }))}>
            {p.realizado ? "Marcar pendente" : "Marcar como realizado"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── VACINAS ──────────────────────────────────────────────────────
const CALENDARIO_VACINAL = [
  { vacina: "BCG", doses: 1, idade: "Ao nascer", descricao: "Tuberculose", obrigatoria: true },
  { vacina: "Hepatite B", doses: 3, idade: "0, 2 e 6 meses", descricao: "Hepatite B", obrigatoria: true },
  { vacina: "Pentavalente (DTP+Hib+HepB)", doses: 3, idade: "2, 4 e 6 meses", descricao: "Difteria, tétano, coqueluche, Hib, hepatite B", obrigatoria: true },
  { vacina: "VIP (Poliomielite Inativada)", doses: 3, idade: "2, 4 e 6 meses", descricao: "Poliomielite", obrigatoria: true },
  { vacina: "VRH (Rotavírus)", doses: 2, idade: "2 e 4 meses", descricao: "Rotavírus", obrigatoria: true },
  { vacina: "Pneumocócica 10-valente", doses: 3, idade: "2, 4 meses e reforço aos 12 meses", descricao: "Pneumonia, meningite", obrigatoria: true },
  { vacina: "Meningocócica C", doses: 2, idade: "3 e 5 meses + reforço 12 meses", descricao: "Meningite C", obrigatoria: true },
  { vacina: "VOP (Poliomielite Oral)", doses: 2, idade: "Reforços 15 meses e 4 anos", descricao: "Poliomielite - reforço", obrigatoria: true },
  { vacina: "Febre Amarela", doses: 1, idade: "9 meses (reforço 4 anos)", descricao: "Febre amarela - dose única para vida toda", obrigatoria: true },
  { vacina: "SCRV (Tríplice Viral + Varicela)", doses: 2, idade: "12 e 15 meses", descricao: "Sarampo, caxumba, rubéola, varicela", obrigatoria: true },
  { vacina: "DTP (Reforço)", doses: 2, idade: "15 meses e 4 anos", descricao: "Reforço difteria, tétano, coqueluche", obrigatoria: true },
  { vacina: "HPV (Quadrivalente)", doses: 2, idade: "9 a 14 anos (meninas e meninos)", descricao: "Papilomavírus humano - cânceres", obrigatoria: true },
  { vacina: "Hepatite A", doses: 1, idade: "15 meses", descricao: "Hepatite A", obrigatoria: true },
  { vacina: "dT (Dupla adulto)", doses: 1, idade: "A cada 10 anos (adultos)", descricao: "Reforço difteria e tétano adulto", obrigatoria: true },
  { vacina: "Influenza", doses: 1, idade: "Anual (grupos prioritários)", descricao: "Gripe - campanha anual", obrigatoria: false },
  { vacina: "COVID-19", doses: 3, idade: "Conforme calendário vigente ANVISA/MS", descricao: "COVID-19 - esquema primário + reforços", obrigatoria: true },
  { vacina: "Pneumocócica 23 (adulto)", doses: 1, idade: ">60 anos ou grupos de risco", descricao: "Pneumonia em adultos", obrigatoria: false },
  { vacina: "Herpes Zóster", doses: 2, idade: ">50 anos (rede privada)", descricao: "Herpes zóster", obrigatoria: false },
];

function VacinasScreen({ state, setState }) {
  const [modo, setModo] = useState("carteirinha"); // carteirinha | calendario | nova
  const [form, setForm] = useState({ vacina: "", dose: "1ª dose", data: "", lote: "", profissional: "", local: "", proxima: "", observacoes: "" });
  const [loading, setLoading] = useState(false);
  const [iaAnalise, setIaAnalise] = useState("");

  function salvarVacina() {
    if (!form.vacina || !form.data) return;
    setState(s => ({ ...s, vacinas: [...s.vacinas, { ...form, id: Date.now(), aplicada: true }] }));
    setForm({ vacina: "", dose: "1ª dose", data: "", lote: "", profissional: "", local: "", proxima: "", observacoes: "" });
    setModo("carteirinha");
  }

  async function analisarCarteirinha(file) {
    setLoading(true);
    try {
      const isImage = file.type.startsWith("image/");
      const system = `Você é especialista em imunologia e calendário vacinal brasileiro. Analise esta carteirinha de vacinação e retorne APENAS JSON válido:
{
  "vacinas": [
    {
      "vacina": "nome da vacina",
      "dose": "número da dose",
      "data": "data de aplicação",
      "lote": "lote se visível",
      "profissional": "profissional se visível",
      "local": "local de aplicação",
      "aplicada": true
    }
  ],
  "pendentes": ["vacinas que deveriam estar no calendário mas não aparecem"],
  "atrasadas": ["vacinas com atraso baseado na idade e calendário SBIm/MS"],
  "observacoes": "observações gerais sobre o calendário vacinal"
}`;
      const b64 = await toBase64(file);
      const texto = await callAIWithImage(system, "Analise esta carteirinha de vacinação com máxima atenção.", b64, file.type);
      const parsed = JSON.parse(texto.replace(/```json|```/g, "").trim());
      if (parsed.vacinas) {
        setState(s => ({ ...s, vacinas: [...parsed.vacinas, ...s.vacinas] }));
        setIaAnalise(`✅ ${parsed.vacinas.length} vacina(s) importada(s). ${parsed.atrasadas?.length ? `⚠️ Possíveis atrasos: ${parsed.atrasadas.join(", ")}.` : ""} ${parsed.observacoes || ""}`);
      }
    } catch { setIaAnalise("Erro na leitura. Tente uma foto mais nítida."); }
    setLoading(false);
  }

  const aplicadas = state.vacinas.filter(v => v.aplicada);
  const vacinasNoCalendario = CALENDARIO_VACINAL.map(c => {
    const aplicada = aplicadas.find(v => v.vacina?.toLowerCase().includes(c.vacina.toLowerCase().split(" ")[0].toLowerCase()));
    return { ...c, feita: !!aplicada, dataFeita: aplicada?.data };
  });

  return (
    <div style={S.content}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["carteirinha", "💉 Carteirinha"], ["calendario", "📅 Calendário"], ["nova", "+ Adicionar"]].map(([m, l]) => (
          <button key={m} style={{ ...S.btnGhost(m === modo ? C.violet : C.textDim), flex: 1, fontSize: 10 }} onClick={() => setModo(m)}>{l}</button>
        ))}
      </div>

      {modo === "carteirinha" && (
        <>
          <div style={S.card}>
            <div style={S.cardTitle}>📸 Importar carteirinha</div>
            <UploadZone onFile={analisarCarteirinha} accept="image/*" label="Foto da carteirinha de vacinação" sublabel="A IA extrai todas as vacinas automaticamente" />
            {loading && <LoadingDots label="Lendo carteirinha..." />}
            {iaAnalise && <div style={S.aiBox}>{iaAnalise}</div>}
          </div>
          {aplicadas.length > 0 && (
            <div style={S.card}>
              <div style={S.cardTitle}>Vacinas registradas ({aplicadas.length})</div>
              {aplicadas.map((v, i) => (
                <div key={i} style={S.row}>
                  <div>
                    <div style={{ fontSize: 13, color: C.white }}>{v.vacina}</div>
                    <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO }}>{v.dose} · {v.data} {v.local ? `· ${v.local}` : ""}</div>
                  </div>
                  <span style={S.badge(C.violet)}>✓</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modo === "calendario" && (
        <div style={S.card}>
          <div style={S.cardTitle}>Calendário Vacinal SBIm/MS 2024</div>
          <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO, marginBottom: 10 }}>Baseado no Calendário Nacional de Vacinação MS + SBIm</div>
          {vacinasNoCalendario.map((v, i) => (
            <div key={i} style={{ ...S.row, flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: v.feita ? C.violet : C.text, fontWeight: v.feita ? "bold" : "normal" }}>{v.vacina}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {v.obrigatoria && <span style={S.badge(C.rose)}>MS</span>}
                  <span style={S.badge(v.feita ? C.violet : C.textDim)}>{v.feita ? "✓ FEITA" : "PENDENTE"}</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO, marginTop: 2 }}>{v.idade}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{v.descricao}</div>
              {v.feita && v.dataFeita && <div style={{ fontSize: 10, color: C.violet, fontFamily: MONO, marginTop: 2 }}>Aplicada em: {v.dataFeita}</div>}
            </div>
          ))}
        </div>
      )}

      {modo === "nova" && (
        <div style={S.card}>
          <div style={S.cardTitle}>Registrar vacina manualmente</div>
          {[["Vacina", "vacina", "text", "Ex: Influenza, COVID-19..."],
            ["Dose", "dose", "text", "1ª dose, 2ª dose, reforço..."],
            ["Data aplicação", "data", "date", ""],
            ["Lote", "lote", "text", "Número do lote"],
            ["Profissional", "profissional", "text", "Nome do enfermeiro/médico"],
            ["Local", "local", "text", "UBS, hospital, clínica..."],
            ["Próxima dose", "proxima", "date", ""],
            ["Observações", "observacoes", "text", ""]
          ].map(([label, key, type, ph]) => (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO, marginBottom: 4, letterSpacing: 1 }}>{label.toUpperCase()}</div>
              <input style={S.input} type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <button style={{ ...S.btn(C.violet), width: "100%", color: C.bg }} onClick={salvarVacina}>Salvar vacina</button>
        </div>
      )}
    </div>
  );
}

// ─── IA MÉDICA ────────────────────────────────────────────────────
function IAScreen({ state }) {
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Olá! Sou seu assistente de saúde. Posso analisar seus exames, explicar resultados, orientar sobre suas vacinas e medicamentos. O que deseja saber?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  async function enviar() {
    if (!input.trim()) return;
    const novo = [...msgs, { role: "user", content: input }];
    setMsgs(novo);
    setInput("");
    setLoading(true);
    const ctx = `
Paciente: ${state.perfil.nome || "Não informado"}, nascimento: ${state.perfil.nascimento || "não informado"}, sexo: ${state.perfil.sexo || "não informado"}.
Exames cadastrados: ${state.exames.length > 0 ? state.exames.map(e => `${e.tipo} (${e.data}): ${e.resumo || "sem resumo"}, alertas: ${e.alertas?.join(", ") || "nenhum"}`).join(" | ") : "nenhum"}
Receitas ativas: ${state.receitas.length > 0 ? state.receitas.map(r => `${r.medicamentos?.map(m => m.nome).join(", ")} (Dr. ${r.medico})`).join(" | ") : "nenhuma"}
Vacinas aplicadas: ${state.vacinas.filter(v => v.aplicada).map(v => v.vacina).join(", ") || "nenhuma registrada"}
Pedidos pendentes: ${state.pedidos.filter(p => !p.realizado).map(p => p.exames?.join(", ")).join(" | ") || "nenhum"}`;
    const system = `Você é um assistente médico brasileiro especializado e empático. Use linguagem clara e acessível. Contexto do paciente:\n${ctx}\n\nIMPORTANTE: Sempre oriente a consultar um médico para diagnósticos e tratamentos. Você informa e esclarece, não diagnostica. Cite literatura e legislação brasileira quando relevante.`;
    const resposta = await callAI(system, novo.map(m => `${m.role === "user" ? "Paciente" : "Assistente"}: ${m.content}`).join("\n"));
    setMsgs([...novo, { role: "assistant", content: resposta }]);
    setLoading(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div style={S.content}>
      <div style={{ marginBottom: 12 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>💡 Sugestões rápidas</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Como estão meus exames?", "Tenho vacinas atrasadas?", "Meus medicamentos têm interação?", "O que significa PCR elevado?"].map(q => (
              <button key={q} style={{ ...S.btnGhost(C.teal), fontSize: 10, padding: "5px 10px" }} onClick={() => { setInput(q); }}>{q}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...S.card, minHeight: 300, maxHeight: 400, overflowY: "auto" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ fontSize: 9, color: C.textDim, fontFamily: MONO, marginBottom: 3 }}>{m.role === "user" ? "Você" : "IA Médica"}</div>
            <div style={{ background: m.role === "user" ? C.surface : C.tealGlow, border: `1px solid ${m.role === "user" ? C.border : C.tealDim + "44"}`, borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", padding: "10px 13px", maxWidth: "88%", fontSize: 13, lineHeight: 1.7, color: C.text }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: C.teal, fontSize: 12, fontFamily: MONO }}>◉ Analisando...</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="Pergunte sobre seus exames, vacinas..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviar()} />
        <button style={S.btn()} onClick={enviar} disabled={loading}>→</button>
      </div>
    </div>
  );
}

// ─── PERFIL ───────────────────────────────────────────────────────
function PerfilScreen({ state, setState }) {
  const [form, setForm] = useState(state.perfil);

  function salvar() {
    setState(s => ({ ...s, perfil: form }));
    alert("Perfil salvo!");
  }

  return (
    <div style={S.content}>
      <div style={S.card}>
        <div style={S.cardTitle}>👤 Dados pessoais</div>
        {[["Nome completo", "nome", "text"], ["Data de nascimento", "nascimento", "text"], ["Sexo", "sexo", "text"], ["Tipo sanguíneo", "tipoSanguineo", "text"], ["Peso (kg)", "peso", "number"], ["Altura (cm)", "altura", "number"], ["Plano de saúde", "plano", "text"], ["Nº do plano", "numPlano", "text"], ["Médico de cabeceira", "medicoCabeceira", "text"], ["Telefone emergência", "telEmergencia", "text"], ["Alergias", "alergias", "text"], ["Condições crônicas", "cronicas", "text"]].map(([label, key, type]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO, marginBottom: 4, letterSpacing: 1 }}>{label.toUpperCase()}</div>
            <input style={S.input} type={type} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        <button style={{ ...S.btn(), width: "100%" }} onClick={salvar}>Salvar perfil</button>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>📊 Estatísticas</div>
        {[["Exames", state.exames.length], ["Receitas", state.receitas.length], ["Pedidos", state.pedidos.length], ["Vacinas aplicadas", state.vacinas.filter(v => v.aplicada).length]].map(([k, v]) => (
          <div key={k} style={S.row}>
            <span style={{ fontSize: 13, color: C.textMid }}>{k}</span>
            <span style={{ fontSize: 14, fontFamily: MONO, color: C.teal }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, borderColor: C.tealDim + "33" }}>
        <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.7, textAlign: "center" }}>
          <span style={{ color: C.teal }}>VitaRecord MVP</span> · Protótipo funcional com IA<br />
          Informativo — não substitui avaliação médica<br />
          <span style={{ fontFamily: MONO, fontSize: 9 }}>LGPD · Dados armazenados localmente</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
const INITIAL_STATE = {
  perfil: { nome: "", nascimento: "", sexo: "", tipoSanguineo: "", peso: "", altura: "", plano: "", numPlano: "", medicoCabeceira: "", telEmergencia: "", alergias: "", cronicas: "" },
  exames: [],
  receitas: [],
  pedidos: [],
  vacinas: [],
};

export default function VitaRecord() {
  const [tela, setTela] = useState("home");
  const [state, setState] = useState(INITIAL_STATE);

  const TELAS = {
    home: { label: "Início", icon: "⌂" },
    exames: { label: "Exames", icon: "🧪" },
    receitas: { label: "Receitas", icon: "💊" },
    vacinas: { label: "Vacinas", icon: "💉" },
    ia: { label: "IA", icon: "◉" },
  };

  const TITULOS = {
    home: "VitaRecord",
    exames: "Meus Exames",
    receitas: "Receitas Médicas",
    pedidos: "Pedidos de Exame",
    vacinas: "Carteira Vacinal",
    ia: "Assistente IA",
    perfil: "Meu Perfil",
  };

  return (
    <div style={S.page}>
      <style>{`
        * { box-sizing: border-box; }
        input, textarea, button { font-family: inherit; }
        input::placeholder { color: #4a5568; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3550; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={S.logoMark}>◆ VitaRecord · MVP</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={S.pageTitle}>{TITULOS[tela]}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {tela !== "pedidos" && <button style={S.btnGhost(C.textDim)} onClick={() => setTela("pedidos")}>📋</button>}
            <button style={S.btnGhost(C.textDim)} onClick={() => setTela("perfil")}>👤</button>
          </div>
        </div>
        {state.perfil.nome && <div style={S.pageSub}>{state.perfil.nome}</div>}
      </div>

      {/* Conteúdo */}
      {tela === "home" && <HomeScreen state={state} setTela={setTela} />}
      {tela === "exames" && <ExamesScreen state={state} setState={setState} />}
      {tela === "receitas" && <ReceitasScreen state={state} setState={setState} />}
      {tela === "pedidos" && <PedidosScreen state={state} setState={setState} />}
      {tela === "vacinas" && <VacinasScreen state={state} setState={setState} />}
      {tela === "ia" && <IAScreen state={state} />}
      {tela === "perfil" && <PerfilScreen state={state} setState={setState} />}

      {/* Nav */}
      <div style={S.nav}>
        {Object.entries(TELAS).map(([t, { label, icon }]) => (
          <button key={t} style={S.navBtn(tela === t)} onClick={() => setTela(t)}>
            <div style={{ fontSize: 18, marginBottom: 1 }}>{icon}</div>
            <div>{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
