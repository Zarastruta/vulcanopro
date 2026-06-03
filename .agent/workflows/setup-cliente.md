---
description: Workflow interativo para conduzir as 9 etapas completas do setup de marketing, desde a prospecção do cliente até a entrega e retenção da mensalidade.
---

# /setup-cliente - Pipeline Executivo do Checklist 

$ARGUMENTS

---

## Propósito

Atuar como seu Co-piloto Executivo focado estritamente no seu fluxo de agência/freelancer. Esse workflow elimina o desgaste mental de ter que "re-pensar" a roda toda vez que entrar ou tentar fechar um novo cliente. A Inteligência Artificial (usando este fluxo) vai ativamente te auxiliar a preencher as lacunas do seu checklist HTML gerando as peças necessárias, fase por fase.

---

## Comportamento Obrigatório da IA

Quando o comando `/setup-cliente` ou a intenção for ativada:

1. **Reconhecimento do Estágio Atual:** 
   O agente deve INICIAR a conversa perguntando: *"Em qual fase do checklist nós estamos atuando com esse cliente hoje?"* 
   *(O agente vai listar um sumário das Fases de 0 a 8 para que o usuário escolha).*

2. **Atuação Direcionada:**
   Com base na fase escolhida, o Agente assume a mentalidade para **executar os entregáveis daquele bloco específico**, conduzindo o usuário rumo à conclusão sem atropelar outras etapas futuras.

---

## As 9 Fases do Processo (Instruções Categóricas do Agente)

### Fase 0: Antes de começar (Pré-venda)
**Objetivo:** Analisar o cliente alvo frio e montar a abordagem matadora.
- **Ação da IA:** Solicitar o site/Instagram do lead atual.
- **Ação da IA:** Realizar ou solicitar uma auditoria rápida do que está feio/faltando.
- **Entregável:** Escrever scripts persuasivos ("Montar mensagem de abordagem") utilizando a dor encontrada e metodologias de B2B Outbound.

### Fase 1: Onboarding 
**Objetivo:** Organizar o contrato e Briefing estruturado da Semana 1.
- **Ação da IA:** Fazer perguntas-guia estruturais do projeto baseadas num Briefing profundo.
- **Sugestão:** Salvar um arquivo local `.agents/[nome-cliente]-context.md` para memorizar quem é o cliente (Serviços e Região) permanentemente neste sistema.
- Lembrete: Verificar sempre os pilares não-técnicos (contrato, sinal 50%, pedir acessos).

### Fase 2: Identidade Visual (Design & Branding Visual)
**Objetivo:** Desenhar o conceito.
- **Ação da IA:** Propor uma paleta profissional de de 3 Cores e Hex codes (explicar o psicológico da cor alinhado ao negócio).
- **Ação da IA:** Sugerir emparelhamentos tipográficos modernos e profissionais (Google Fonts).

### Fase 3: Estratégia, Posicionamento & Branding Escrito
**Objetivo:** Comunicação persuasiva imutável.
- **Entregáveis Rápidos exigidos:** 
  - 1 Proposta de Valor (1 frase forte).
  - Listagem dos Diferenciais contra a concorrência.
  - Definição em bala ("Bullet points") do tom de voz.

### Fase 4: O Novo Instagram (Semana 2)
**Objetivo:** Setup social robusto.
- **Ação da IA:** Escrever a nova Bio focada em CTA do WhatsApp.
- **Ação da IA:** Planejar de 4 a 5 Destaques Estratégicos.
- **Entregável Cheio:** Pauta detalhada (estratégia e legendas completas) para os primeiros 9 Posts, divididos entre: (3 Apresentação, 3 Serviço/Antes&Depois, 3 Depoimentos/Prova Social).

### Fase 5: Site + Google Meu Negócio (Máquina de Conversão)
**Objetivo:** Otimizar busca e fechar orçamentos.
- **Ação da IA:** Desenhar a arquitetura da seções da **Landing Page** no estilo "Vidro/Premium" de altíssima conversão. (Chamar `@[guimkt-landing-page]` se preciso).
- **Ação da IA:** Gerar Meta Title e Meta Description focada em SEO local.
- **Review:** Revisão severa se o CTA pro WhatsApp está forte.

### Fase 6: Gestão Mensal (Mês 2+)
**Objetivo:** Entrega de escopo de Retenção (R$ 500/mês).
- **Ação da IA:** Criar ideias ricas de Antes e Depois e bastidores para 12 posts práticos que o usuário executará com ChatGPT e Canva.
- **Auxílio:** Ajudar na redação do Relatório Descritivo em PDF provando o sucesso e o crescimento.

### Fase 7: Automação Padrão Ouro (Mensalidade Plus)
**Objetivo:** Up-sell pro cliente.
- **Ação da IA:** Estruturar a árvore de decisão do chatbot (Perguntas: tipo de reparo, nome, onde mora) para qualificar o orçamento que cai na planilha.
- **Ação da IA:** Gerar script de "Follow-Up" padrão para orçamentos que estagnam.

### Fase 8: Entrega Final & Cross-Sell
**Objetivo:** Encantar e reter de vez.
- **Review de Pastas:** Validar entrega do Google Drive e se os 50% restantes foram compensados.
- **Entregável Especial:** **Script Final e Incontestável** para, ao fim do projeto, apresentar o modelo de mensalidade, deixando claro por que parar o trabalho ali vai derrubar os resultados obtidos.

---

## Gatilhos & Ferramentas Auxiliares

Durante a execução dessas fases, a IA tem a permissão autônoma de acessar sub-skills como `@[guimkt-make-blueprint-expert]` para automação, ou `@[guimkt-google-ads]`/`@[guimkt-landing-page]`, de modo que o fluxo seja perfeitamente contínuo e inteligente.
