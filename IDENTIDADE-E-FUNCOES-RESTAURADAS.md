# Restauração de identidade e microfunções — Criando XP

Esta revisão compara a versão anterior enviada pelo usuário com a base de produção mais recente e reincorpora os elementos que faziam sentido sem desfazer as melhorias de estabilidade, mobile, acessibilidade e Supabase.

## Restaurado / melhorado

- Identidade visual violeta profunda da Criando XP em toda a central: sidebar, topbar, cards, calendário, agenda, Kanban, tabela, modais, login, busca, onboarding, skeletons, estados e navegação mobile.
- Tipografia Lato para texto e Cinzel para marca, títulos e controles de destaque.
- Logo mais presente e tratamento visual coerente com a landing page.
- Resumo por status acima do conteúdo, agora também clicável como filtro e adaptado ao mobile.
- CRM: copiar nome, copiar contato, copiar nome + contato e abrir WhatsApp.
- Central de Hoje: atalhos rápidos de copiar nome/contato e WhatsApp nos leads novos.
- Duplicação rápida por postagem em desktop, mobile e drawer.
- Preview visual de arquivos/Google Drive, navegação entre anexos, cópia de link e abertura do original.
- Indicadores de urgência: ATRASADO, HOJE, AMANHÃ, 2 DIAS e 3 DIAS.
- Paleta e hierarquia antiga reaplicadas às superfícies que tinham ficado genéricas no redesign.

## Deliberadamente não restaurado

- Digitação manual de datas. O date picker novo é mais seguro e melhor no mobile.
- Reordenação manual da tabela que existia apenas no estado local e não tinha persistência confiável.
- Vocabulário excessivamente gamificado em cada ação. A identidade de RPG volta pela marca e linguagem visual, sem chamar toda postagem de “missão”.
- Integrações REST antigas com bearer anônimo. O cliente Supabase autenticado e centralizado foi mantido.

## Mantido da versão nova

- Central de Hoje, calendário Agenda/Semana/Mês, Kanban, backlog, templates, recorrência, ações em massa e produtividade.
- UX mobile específica, bottom navigation, drawers/bottom sheets e touch targets maiores.
- Onboarding versionado por navegador.
- Error Boundary, estados de loading/erro/vazio e feedback de persistência.
- Fila de salvamento por postagem e rollback em falhas.
- Supabase centralizado com validação da chave pública e fallback válido do projeto.
