# LGPD Shield AI 🛡️🤖

> **Monitor Inteligente de Privacidade e Governança de Dados em Formulários**

O **LGPD Shield AI** é um gateway inteligente que intercepta e analisa formulários corporativos e payloads em tempo real, garantindo a conformidade regulatória antes que informações excessivas, não autorizadas ou sensíveis cheguem à base de dados.

---

## ✨ Recursos Exclusivos

1. **Esteira de Segurança Visual (Gateway AI)**: Uma simulação em tempo real com micro-animações do fluxo de segurança (Interceptação ➔ Varredura Heurística ➔ Validação de Consentimento ➔ Decisão de Governança).
2. **Dashboard de Governança**: Métricas dinâmicas com contagem de vazamentos evitados, volume de dados sensíveis bloqueados e índice geral de conformidade (Compliance Score).
3. **Sandbox do Desenvolvedor**: Console JSON interativo para simular chamadas de API direto do navegador.
4. **Anonimizador Side-by-Side**: Painel comparativo interativo destacando dados originais (em vermelho) e dados higienizados e salvos com segurança (em verde).
5. **Modo Híbrido Flexível**:
   * **Simulador Heurístico Local**: Zero latência, funciona 100% offline (ideal para hackathons).
   * **Gemini Generativo (Opcional)**: Integração via chave de API para validação conceitual profunda com LLM em tempo real.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Executando o servidor
1. Abra o terminal na pasta do projeto.
2. Execute o comando:
   ```bash
   npm run dev
   ```
3. O servidor iniciará automaticamente no endereço [http://localhost:3000](http://localhost:3000) e abrirá no seu navegador padrão.

---

## ⚖️ Diretrizes da LGPD Inspecionadas

* **Artigo 5º, II**: Detecção de dados pessoais sensíveis (convicção religiosa, saúde, biométricos, etc.).
* **Artigo 7º, I**: Exigência de consentimento destacado para bases de dados gerais.
* **Artigo 11º**: Regras estritas de minimização e anonimização de informações sensíveis não autorizadas.
