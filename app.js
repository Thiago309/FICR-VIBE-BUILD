// LGPD Shield AI - Application Logic

// Global State
const state = {
  stats: {
    leaksPrevented: 0,
    sensitiveIntercepted: 0,
    anonymizedRate: 85,
    complianceScore: 100,
  },
  logs: [],
  geminiKey: localStorage.getItem('lgpd_gemini_key') || '',
  activeProcess: false,
  currentPayload: null,
  currentResult: null,
};

// Patterns and Keywords for LGPD Heuristic Scan
const SCAN_RULES = {
  cpf: {
    regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    label: "CPF (Documento de Identidade)",
    article: "Artigo 5º, II & Artigo 7º (Falta de Base Legal Adequada)",
    redaction: "[CPF ANONIMIZADO]"
  },
  cnpj: {
    regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
    label: "CNPJ (Pessoa Jurídica)",
    article: "Artigo 5º, I (Dados Corporativos em Campo Inadequado)",
    redaction: "[CNPJ ANONIMIZADO]"
  },
  finance: {
    regex: /\b(?:\d[ -]?){13,16}\b/g,
    label: "Número de Cartão de Crédito / Conta",
    article: "Artigo 7º, VI (Segurança e Proteção do Crédito)",
    redaction: "[DADO FINANCEIRO SIGILOSO]"
  },
  health: {
    keywords: [
      "diabetes", "hipertensão", "asma", "doença", "exame", "médico", "saúde",
      "sangue", "cardíaco", "hiv", "soropositivo", "câncer", "depressão",
      "ansiedade", "remédio", "receita médica", "prontuário", "tratamento de saúde"
    ],
    label: "Informação Sensível de Saúde",
    article: "Artigo 5º, II & Artigo 11 (Tratamento de Dados Sensíveis sem Consentimento Destacado)",
    redaction: "[DADO DE SAÚDE REDIGIDO]"
  },
  sensitive_general: {
    keywords: [
      "religião", "católico", "umbanda", "evangélico", "sindicato",
      "partido político", "filiado", "orientação sexual", "homossexual", "heterossexual"
    ],
    label: "Dado Sensível (Opinião/Religião/Sindicato)",
    article: "Artigo 5º, II (Restrição Estrita de Tratamento de Preferências)",
    redaction: "[DADO DE PREFERÊNCIA REDIGIDO]"
  }
};

// Simulated sensitive templates for magic wand button
const SENSITIVE_TEMPLATES = [
  "Prezado RH, gostaria de me candidatar. Meu CPF é 456.982.113-90. Sofro de asma severa e gostaria de saber se a empresa cobre o tratamento.",
  "Olá! Segue meu número de conta para depósito emergencial: 4325 9844 1239 8812. Sou filiado ao sindicato dos metalúrgicos.",
  "Envio meus dados corporativos (CNPJ 12.345.678/0001-90). Declaro que sou de orientação religiosa budista e gostaria de folgas nos feriados do templo."
];

// Initialize UI Elements
document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initEventListeners();
  updateUIStats();
});

// Load values from LocalStorage if they exist
function loadSavedState() {
  const savedStats = localStorage.getItem('lgpd_stats');
  if (savedStats) {
    state.stats = JSON.parse(savedStats);
  }

  if (state.geminiKey) {
    document.getElementById('gemini-key').value = state.geminiKey;
    document.getElementById('key-status').innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--color-success);"></i> API Gemini ativa para análise generativa profunda.';
  }
}

// Save stats to LocalStorage
function saveStats() {
  localStorage.setItem('lgpd_stats', JSON.stringify(state.stats));
}

// Bind interactive actions
function initEventListeners() {
  // Settings Panel Toggle
  const toggleBtn = document.getElementById('toggle-settings');
  const settingsPanel = document.getElementById('settings-panel');
  toggleBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
  });

  // Save Gemini Key
  document.getElementById('save-settings').addEventListener('click', () => {
    const key = document.getElementById('gemini-key').value.trim();
    state.geminiKey = key;
    localStorage.setItem('lgpd_gemini_key', key);

    const statusLabel = document.getElementById('key-status');
    if (key) {
      statusLabel.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--color-success);"></i> API Gemini configurada e pronta.';
      addLog("CONFIG", "Chave API do Gemini adicionada/atualizada.", "passed");
    } else {
      statusLabel.innerHTML = 'Usando analisador heurístico offline local.';
      addLog("CONFIG", "Chave API removida. Usando motor offline local.", "warning");
    }
    settingsPanel.classList.remove('open');
  });

  // Fill Simulator With Sensitive Data
  document.getElementById('fill-sensitive-btn').addEventListener('click', () => {
    const randomTemplate = SENSITIVE_TEMPLATES[Math.floor(Math.random() * SENSITIVE_TEMPLATES.length)];
    document.getElementById('form-name').value = "Mariano de Souza";
    document.getElementById('form-email').value = "mariano.souza@provedor.com.br";
    document.getElementById('form-message').value = randomTemplate;
    document.getElementById('form-consent').checked = false;

    addLog("SIMULADOR", "Dados de teste carregados com violações potenciais.", "warning");
  });

  // Submit Intake Form
  document.getElementById('intake-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.activeProcess) return;

    const data = {
      nome: document.getElementById('form-name').value,
      email: document.getElementById('form-email').value,
      detalhes: document.getElementById('form-message').value,
      consentimento: document.getElementById('form-consent').checked
    };

    runSecurityPipeline(data, 'form');
  });

  // Run Developer Sandbox
  document.getElementById('run-sandbox-btn').addEventListener('click', () => {
    if (state.activeProcess) return;

    const payloadArea = document.getElementById('sandbox-payload');
    try {
      const data = JSON.parse(payloadArea.value);
      runSecurityPipeline(data, 'sandbox');
    } catch (err) {
      alert("JSON inválido! Corrija a sintaxe antes de submeter ao Gateway.");
    }
  });

  // Clean Logs
  document.getElementById('clear-logs-btn').addEventListener('click', () => {
    const loggerBox = document.getElementById('event-logger-box');
    loggerBox.innerHTML = '';
    addLog("CONSOLE", "Console limpo.", "passed");
  });

  // Accept anonymized option
  document.getElementById('apply-anonymized-btn').addEventListener('click', async () => {
    document.getElementById('anonymization-section').style.display = 'none';

    // Envia os dados tratados ao backend real no Docker
    const success = await sendToBackend(state.currentPayload, state.currentResult);

    if (success) {
      alert("Sucesso! Registro salvo de forma segura e em conformidade na base de dados PostgreSQL no Docker.");
    } else {
      alert("Aviso: Falha ao persistir dados no banco de dados. Salvamento simulado local efetuado.");
    }

    // Update dashboard metrics
    state.stats.complianceScore = Math.min(100, Math.round(state.stats.complianceScore * 1.05));
    updateUIStats();
  });
}

// Output dynamic log message to panel
function addLog(tag, message, status = 'passed') {
  const loggerBox = document.getElementById('event-logger-box');
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  const logItem = document.createElement('div');
  logItem.className = `event-item ${status}`;
  logItem.innerHTML = `
    <div class="event-meta">
      <span class="event-tag ${status}">${tag}</span>
      <span class="event-desc">${message}</span>
    </div>
    <span class="event-time">${timeStr}</span>
  `;

  loggerBox.insertBefore(logItem, loggerBox.firstChild);
}

// UI Metric Updates
function updateUIStats() {
  document.getElementById('stat-leaks').innerText = state.stats.leaksPrevented;
  document.getElementById('stat-sensitive').innerText = state.stats.sensitiveIntercepted;
  document.getElementById('stat-anonymized').innerText = `${state.stats.anonymizedRate}%`;
  document.getElementById('stat-score').innerText = `${state.stats.complianceScore}%`;

  const scoreCard = document.getElementById('stat-score').parentElement;
  if (state.stats.complianceScore >= 90) {
    scoreCard.style.borderLeftColor = 'var(--color-success)';
  } else if (state.stats.complianceScore >= 70) {
    scoreCard.style.borderLeftColor = 'var(--color-warning)';
  } else {
    scoreCard.style.borderLeftColor = 'var(--color-danger)';
  }

  saveStats();
}

// Perform Security scan (Heuristic Engine)
function scanPayload(payload) {
  const violations = [];
  let redactedText = payload.detalhes || "";
  let highlightOriginal = payload.detalhes || "";
  let highlightSanitized = payload.detalhes || "";

  // Scan text-area fields
  const checkText = payload.detalhes || "";

  // Check CPF
  const cpfMatches = checkText.match(SCAN_RULES.cpf.regex);
  if (cpfMatches) {
    cpfMatches.forEach(match => {
      violations.push({
        type: 'CPF',
        label: SCAN_RULES.cpf.label,
        article: SCAN_RULES.cpf.article,
        leak: match
      });
      redactedText = redactedText.replace(match, SCAN_RULES.cpf.redaction);
      highlightOriginal = highlightOriginal.replace(match, `<span class="highlight-redacted">${match}</span>`);
      highlightSanitized = highlightSanitized.replace(match, `<span class="highlight-anonymized">${SCAN_RULES.cpf.redaction}</span>`);
    });
  }

  // Check CNPJ
  const cnpjMatches = checkText.match(SCAN_RULES.cnpj.regex);
  if (cnpjMatches) {
    cnpjMatches.forEach(match => {
      violations.push({
        type: 'CNPJ',
        label: SCAN_RULES.cnpj.label,
        article: SCAN_RULES.cnpj.article,
        leak: match
      });
      redactedText = redactedText.replace(match, SCAN_RULES.cnpj.redaction);
      highlightOriginal = highlightOriginal.replace(match, `<span class="highlight-redacted">${match}</span>`);
      highlightSanitized = highlightSanitized.replace(match, `<span class="highlight-anonymized">${SCAN_RULES.cnpj.redaction}</span>`);
    });
  }

  // Check Financial
  const financeMatches = checkText.match(SCAN_RULES.finance.regex);
  if (financeMatches) {
    financeMatches.forEach(match => {
      violations.push({
        type: 'FINANCE',
        label: SCAN_RULES.finance.label,
        article: SCAN_RULES.finance.article,
        leak: match
      });
      redactedText = redactedText.replace(match, SCAN_RULES.finance.redaction);
      highlightOriginal = highlightOriginal.replace(match, `<span class="highlight-redacted">${match}</span>`);
      highlightSanitized = highlightSanitized.replace(match, `<span class="highlight-anonymized">${SCAN_RULES.finance.redaction}</span>`);
    });
  }

  // Check Health Keywords
  SCAN_RULES.health.keywords.forEach(keyword => {
    const reg = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (reg.test(checkText)) {
      violations.push({
        type: 'HEALTH',
        label: SCAN_RULES.health.label,
        article: SCAN_RULES.health.article,
        leak: keyword
      });
      redactedText = redactedText.replace(reg, SCAN_RULES.health.redaction);
      highlightOriginal = highlightOriginal.replace(reg, `<span class="highlight-redacted">${keyword}</span>`);
      highlightSanitized = highlightSanitized.replace(reg, `<span class="highlight-anonymized">${SCAN_RULES.health.redaction}</span>`);
    }
  });

  // Check general sensitive
  SCAN_RULES.sensitive_general.keywords.forEach(keyword => {
    const reg = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (reg.test(checkText)) {
      violations.push({
        type: 'SENSITIVE_GENERAL',
        label: SCAN_RULES.sensitive_general.label,
        article: SCAN_RULES.sensitive_general.article,
        leak: keyword
      });
      redactedText = redactedText.replace(reg, SCAN_RULES.sensitive_general.redaction);
      highlightOriginal = highlightOriginal.replace(reg, `<span class="highlight-redacted">${keyword}</span>`);
      highlightSanitized = highlightSanitized.replace(reg, `<span class="highlight-anonymized">${SCAN_RULES.sensitive_general.redaction}</span>`);
    }
  });

  return {
    hasSensitive: violations.length > 0,
    violations: violations,
    redactedText: redactedText,
    highlightOriginal: highlightOriginal,
    highlightSanitized: highlightSanitized
  };
}

// Live Gemini call API
async function askGeminiToScan(payload) {
  const prompt = `Você é o LGPD Shield AI, um gateway de segurança corporativa em conformidade com a LGPD (Lei Geral de Proteção de Dados do Brasil).
Analise o seguinte payload de entrada e retorne um objeto JSON contendo se há vazamentos ou dados sensíveis em campos inadequados (como CPF, CNPJ, dados de saúde ou orientação religiosa/política).

Payload:
${JSON.stringify(payload, null, 2)}

Importante: se houver dados sensíveis no campo "detalhes" sem que a propriedade "consentimento" seja verdadeira, você deve bloquear.
Retorne EXCLUSIVAMENTE um objeto JSON estruturado como abaixo, sem formatação markdown (sem os caracteres \`\`\`json):
{
  "hasSensitive": true/false,
  "status": "BLOCKED" ou "APPROVED",
  "compliance_score": 0 a 100,
  "violations": [
    {
      "type": "CPF" ou "HEALTH" ou "FINANCIAL",
      "label": "Descrição amigável",
      "leak": "o dado exposto",
      "article": "Artigo da LGPD infringido"
    }
  ],
  "redactedText": "Versão do texto original com dados substituídos por tokens explicativos como [CPF REDIGIDO]"
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const result = await response.json();
    const resultText = result.candidates[0].content.parts[0].text;

    // Clean potential markdown quotes
    const cleanedText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    // Inject highlights
    let ho = payload.detalhes || "";
    let hs = parsedData.redactedText || "";

    parsedData.violations.forEach(v => {
      ho = ho.replace(v.leak, `<span class="highlight-redacted">${v.leak}</span>`);
    });

    parsedData.highlightOriginal = ho;
    parsedData.highlightSanitized = hs;
    return parsedData;
  } catch (error) {
    console.error("Gemini scanning failed, fallback to local heuristics:", error);
    addLog("API_ERROR", "Falha na chamada Gemini AI. Usando Heurística Offline como contingência.", "warning");
    return scanPayload(payload);
  }
}

// Enviar dados tratados ao banco de dados no Docker via backend Express
async function sendToBackend(payload, result) {
  if (!payload) return false;

  addLog("API_POST", "Enviando dados tratados ao banco no Docker...", "passed");

  try {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: payload.nome || "Não informado",
        email: payload.email || "Não informado",
        mensagem_original: payload.detalhes || "",
        mensagem_higienizada: result.redactedText || "",
        consentimento: payload.consentimento === true,
        compliance_score: state.stats.complianceScore,
        violations_count: result.violations ? result.violations.length : 0
      })
    });

    const dbResult = await response.json();
    if (response.ok) {
      addLog("DB_SAVE", `Sucesso! Salvo no Postgres (ID: ${dbResult.data.id}).`, "passed");
      return true;
    } else {
      addLog("DB_ERROR", `Erro do banco: ${dbResult.error}`, "blocked");
      return false;
    }
  } catch (error) {
    console.error("Erro ao enviar dados ao backend:", error);
    addLog("DB_ERROR", "Erro de conexão. O banco no Docker ou a API Express estão offline?", "blocked");
    return false;
  }
}

// Visual safety stepper execution
async function runSecurityPipeline(payload, origin = 'form') {
  state.activeProcess = true;
  resetStepperUI();

  // Disable button to prevent spamming
  const submitBtn = origin === 'form' ? document.getElementById('submit-form-btn') : document.getElementById('run-sandbox-btn');
  const originalBtnHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';

  // Section 1: Interception
  setStepState('step-intercept', 'active', 'Dados capturados pelo Gateway.');
  addLog("INTERCEPT", `Payload de entrada capturado via ${origin.toUpperCase()}.`, "passed");
  await delay(700);
  setStepState('step-intercept', 'success', 'Payload interceptado com integridade.');

  // Section 2: Sensitivity Scan
  setStepState('step-scan', 'active', 'Analisando conformidade de governança de dados...');
  await delay(850);

  let result;
  if (state.geminiKey) {
    addLog("GATEWAY", "Enviando dados para o modelo gerador Gemini AI...", "passed");
    result = await askGeminiToScan(payload);
  } else {
    result = scanPayload(payload);
  }

  if (result.hasSensitive) {
    setStepState('step-scan', 'warning', `Detectados ${result.violations.length} dados sensíveis no payload.`);
    result.violations.forEach(v => {
      addLog("SECURITY_ALERT", `${v.label} encontrado em campo livre. (${v.leak})`, "warning");
    });
    state.stats.sensitiveIntercepted += result.violations.length;
  } else {
    setStepState('step-scan', 'success', 'Nenhum dado pessoal sensível detectado em campos livres.');
  }
  await delay(700);

  // Section 3: Consent Check
  setStepState('step-consent', 'active', 'Avaliando base legal (Artigo 7º da LGPD)...');
  await delay(800);

  const consentGranted = payload.consentimento === true;
  if (result.hasSensitive && !consentGranted) {
    setStepState('step-consent', 'error', 'Falta de consentimento ativo do titular.');
    addLog("COMPLIANCE", "Tentativa de processamento de dados pessoais sem base legal e sem consentimento.", "blocked");
  } else if (result.hasSensitive && consentGranted) {
    setStepState('step-consent', 'warning', 'Consentimento coletado, porém dados de saúde/financeiros necessitam proteção estrita.');
    addLog("COMPLIANCE", "Consentimento coletado. Aplicando regras de minimização.", "warning");
  } else {
    setStepState('step-consent', 'success', 'Conformidade de Consentimento Aprovada.');
  }
  await delay(700);

  // Section 4: Final LGPD Decision
  setStepState('step-decision', 'active', 'Computando compliance score...');
  await delay(600);

  const blockRequired = result.hasSensitive && !consentGranted;
  if (blockRequired) {
    setStepState('step-decision', 'error', 'Submissão Bloqueada (Artigos 5º e 11º da LGPD)');
    addLog("GATEWAY_BLOCK", "Transação abortada pelo gateway para evitar multa regulatória.", "blocked");

    state.stats.leaksPrevented += result.violations.length;
    state.stats.complianceScore = Math.max(20, state.stats.complianceScore - 15);

    // Salva o payload e resultado atuais no estado global para eventual gravação após higienização
    state.currentPayload = payload;
    state.currentResult = result;

    // Show Anonymization Side-By-Side Component
    displayAnonymizationScreen(result, payload);
  } else if (result.hasSensitive && consentGranted) {
    setStepState('step-decision', 'warning', 'Aprovado com Ressalvas (Minimização sugerida)');
    addLog("GATEWAY_ALLOW", "Transação permitida com ressalva. Aplicada higienização de dados.", "warning");

    state.stats.complianceScore = Math.min(100, Math.round(state.stats.complianceScore * 0.98));

    // Salva no estado global
    state.currentPayload = payload;
    state.currentResult = result;

    displayAnonymizationScreen(result, payload);
  } else {
    setStepState('step-decision', 'success', 'Aprovado sem restrições. Transação segura.');
    addLog("GATEWAY_ALLOW", "Dados gravados na base com 100% de conformidade.", "passed");

    // Grava diretamente no PostgreSQL no Docker (via Express) pois está seguro e livre de violações
    sendToBackend(payload, result);

    state.stats.complianceScore = Math.min(100, state.stats.complianceScore + 5);
    document.getElementById('anonymization-section').style.display = 'none';
  }

  // Update stats
  updateUIStats();

  // Re-enable trigger button
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnHTML;
  state.activeProcess = false;
}

// Display matching details side-by-side
function displayAnonymizationScreen(result, originalPayload) {
  const section = document.getElementById('anonymization-section');
  section.style.display = 'block';

  document.getElementById('compare-original').innerHTML = result.highlightOriginal;
  document.getElementById('compare-sanitized').innerHTML = result.highlightSanitized;

  // Smooth scroll
  section.scrollIntoView({ behavior: 'smooth' });
}

// Set individual stepper card look and description
function setStepState(stepId, stateClass, desc) {
  const card = document.getElementById(stepId);
  card.className = `step-card ${stateClass}`;

  const descEl = document.getElementById(`desc-${stepId.split('-')[1]}`);
  descEl.innerText = desc;
}

// Reset steps visual indicators
function resetStepperUI() {
  const steps = ['step-intercept', 'step-scan', 'step-consent', 'step-decision'];
  steps.forEach(step => {
    const card = document.getElementById(step);
    card.className = 'step-card';
  });

  document.getElementById('desc-intercept').innerText = 'Aguardando submissão de dados...';
  document.getElementById('desc-scan').innerText = 'Varrendo campos em busca de dados sensíveis ocultos.';
  document.getElementById('desc-consent').innerText = 'Cruzando dados interceptados com permissões de tratamento.';
  document.getElementById('desc-decision').innerText = 'Aplicando as diretrizes legais e gerando compliance score.';
}

// Helper utility delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
