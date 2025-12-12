# Requirements Document

## Introduction

O Planta é um aplicativo mobile nativo para cuidados com plantas, permitindo que usuários gerenciem suas plantas, acompanhem atividades de cuidado diário, recebam dicas personalizadas e interajam com uma comunidade de jardineiros. O app possui tema "green garden" com animações suaves que transmitem paz e calma, e funciona em dispositivos iOS e Android.

## Glossary

- **Planta_App**: Sistema principal do aplicativo mobile nativo de cuidados com plantas
- **Landing_Page**: Tela inicial de carregamento com animações temáticas
- **Tab_Navigator**: Sistema de navegação por abas na parte inferior da tela
- **Minhas_Plantas**: Catálogo pessoal de plantas do usuário
- **Comunidade**: Feed social estilo Pinterest/Instagram para compartilhamento
- **Registro_Cuidado**: Log de atividades de manutenção das plantas
- **XP**: Pontos de experiência do usuário no sistema de gamificação
- **Local_Storage**: Sistema de armazenamento local persistente do dispositivo
- **Camera_API**: Interface para acesso à câmera e galeria do dispositivo
- **Native_Component**: Componente nativo da plataforma (iOS/Android)

## Requirements

### Requirement 1: Landing Page com Loading Animado

**User Story:** Como usuário, eu quero ver uma tela de carregamento com tema de jardim e animações suaves, para que eu tenha uma experiência agradável e relaxante ao abrir o app.

#### Acceptance Criteria

1. WHEN o usuário abre o aplicativo, THE Planta_App SHALL exibir a Landing_Page com animações de tema "green garden" por no mínimo 3 segundos.
2. WHILE a Landing_Page está visível, THE Planta_App SHALL exibir animações leves de elementos botânicos (folhas, plantas) com transições suaves.
3. WHEN o carregamento é concluído, THE Planta_App SHALL fazer transição suave (fade-out) para a tela Home em no máximo 1 segundo.
4. THE Planta_App SHALL exibir mensagens de loading rotativas durante o carregamento.

### Requirement 2: Navegação por Abas Nativa

**User Story:** Como usuário, eu quero uma barra de navegação nativa na parte inferior da tela que funcione em qualquer tamanho de dispositivo, para que eu possa acessar todas as funcionalidades facilmente.

#### Acceptance Criteria

1. THE Planta_App SHALL exibir o Tab_Navigator fixo na parte inferior da tela em todas as páginas principais.
2. THE Planta_App SHALL adaptar o Tab_Navigator para todos os tamanhos de dispositivos móveis e orientações (portrait e landscape).
3. THE Planta_App SHALL incluir no Tab_Navigator abas de navegação para: Home/Jardim, Minhas Plantas, Comunidade e Perfil.
4. WHEN o usuário toca em uma aba do Tab_Navigator, THE Planta_App SHALL navegar para a tela correspondente com transição nativa em no máximo 300ms.
5. THE Planta_App SHALL destacar visualmente a aba ativa no Tab_Navigator usando componentes nativos da plataforma.

### Requirement 3: Perfil do Usuário

**User Story:** Como usuário, eu quero acessar uma tela de perfil com minhas informações de conta, para que eu possa visualizar e gerenciar meus dados pessoais.

#### Acceptance Criteria

1. WHEN o usuário acessa a tela de Perfil, THE Planta_App SHALL exibir foto de perfil, nome e data de início como jardineiro.
2. THE Planta_App SHALL exibir estatísticas do usuário: número de plantas, dias ativos e badges conquistados.
3. THE Planta_App SHALL exibir seção de conquistas/badges com ícones visuais.
4. THE Planta_App SHALL fornecer opção de "Editar Perfil" para modificar informações pessoais.
5. THE Planta_App SHALL fornecer opção de "Sair" para logout da conta.
6. THE Planta_App SHALL exibir o nível atual do usuário e barra de progresso de XP.

### Requirement 4: Minhas Plantas

**User Story:** Como usuário, eu quero visualizar todas as minhas plantas cadastradas com informações de cuidado e feedback da comunidade, para que eu possa acompanhar o desenvolvimento e manter minhas plantas saudáveis.

#### Acceptance Criteria

1. WHEN o usuário acessa Minhas_Plantas, THE Planta_App SHALL exibir grid de cards com foto, nome e status de cada planta.
2. WHEN o usuário seleciona uma planta, THE Planta_App SHALL exibir tela de detalhes com: foto ampliada, nome científico, descrição e histórico de cuidados.
3. THE Planta_App SHALL exibir Registro_Cuidado com atividades diárias (rega, adubação, poda) em formato de timeline.
4. THE Planta_App SHALL exibir dicas e instruções personalizadas para cuidar de cada tipo de planta.
5. THE Planta_App SHALL indicar visualmente plantas que precisam de atenção (ex: ícone de gota para rega).
6. WHERE a planta foi compartilhada na comunidade, THE Planta_App SHALL exibir comentários e avaliações de outros usuários.
7. THE Planta_App SHALL permitir adicionar novo registro de cuidado com data, tipo de atividade e notas.

### Requirement 5: Cadastrar Nova Planta

**User Story:** Como usuário, eu quero cadastrar novas plantas no meu catálogo de forma simples, para que eu possa começar a acompanhar seus cuidados e compartilhar com a comunidade.

#### Acceptance Criteria

1. WHEN o usuário aciona "Adicionar Planta", THE Planta_App SHALL exibir tela de formulário com campos: foto, nome, frequência de rega e luminosidade.
2. THE Planta_App SHALL permitir captura de foto da planta via Camera_API acessando câmera nativa ou galeria do dispositivo.
3. THE Planta_App SHALL fornecer opções predefinidas para frequência de rega (Diária, A cada 3 dias, Semanal) usando Native_Component de seleção.
4. THE Planta_App SHALL fornecer opções predefinidas para luminosidade (Sombra, Meia Luz, Sol Pleno) usando Native_Component de seleção.
5. THE Planta_App SHALL fornecer switch nativo para "Tornar Público" permitindo compartilhar na comunidade.
6. WHEN o usuário salva a planta, THE Planta_App SHALL adicionar a planta ao catálogo Minhas_Plantas imediatamente e salvar em Local_Storage.
7. IF o switch "Tornar Público" está ativo, THEN THE Planta_App SHALL publicar a planta no feed da Comunidade.

### Requirement 6: Comunidade

**User Story:** Como usuário, eu quero ver postagens de outros usuários e interagir com a comunidade, para que eu possa aprender, compartilhar experiências e me inspirar.

#### Acceptance Criteria

1. WHEN o usuário acessa a Comunidade, THE Planta_App SHALL exibir feed de postagens em formato de cards (estilo Pinterest/Instagram).
2. THE Planta_App SHALL exibir em cada postagem: foto, nome do autor, tempo desde publicação, descrição e número de curtidas.
3. THE Planta_App SHALL fornecer filtros de categoria: "Tudo", "Dicas", "Identificação".
4. WHEN o usuário toca no ícone de curtir, THE Planta_App SHALL incrementar o contador de curtidas e destacar o ícone.
5. THE Planta_App SHALL permitir scroll infinito para carregar mais postagens.
6. THE Planta_App SHALL exibir postagens em ordem cronológica reversa (mais recentes primeiro).

### Requirement 7: Home/Jardim Principal

**User Story:** Como usuário, eu quero uma tela inicial que mostre um resumo do meu jardim e minhas plantas, para que eu tenha uma visão geral rápida do estado das minhas plantas.

#### Acceptance Criteria

1. WHEN o usuário acessa a Home, THE Planta_App SHALL exibir saudação personalizada com nome do usuário e data atual.
2. THE Planta_App SHALL exibir card de gamificação com XP atual, nível e barra de progresso.
3. THE Planta_App SHALL exibir seção "Suas Plantas" com preview das plantas cadastradas usando scroll horizontal nativo.
4. THE Planta_App SHALL destacar plantas que precisam de atenção imediata (rega, cuidados).
5. THE Planta_App SHALL fornecer botão flutuante (FAB) para adicionar nova planta rapidamente.

### Requirement 8: Plataforma e Compatibilidade

**User Story:** Como usuário, eu quero que o aplicativo funcione perfeitamente no meu dispositivo iOS ou Android, para que eu tenha uma experiência nativa e fluida.

#### Acceptance Criteria

1. THE Planta_App SHALL executar nativamente em dispositivos iOS versão 13.0 ou superior.
2. THE Planta_App SHALL executar nativamente em dispositivos Android versão 6.0 (API 23) ou superior.
3. THE Planta_App SHALL adaptar componentes de interface para seguir guidelines nativos de cada plataforma (iOS Human Interface Guidelines e Material Design).
4. THE Planta_App SHALL utilizar gestos nativos de cada plataforma (swipe back no iOS, hardware back button no Android).
5. THE Planta_App SHALL respeitar safe areas e notches de dispositivos modernos.

### Requirement 9: Armazenamento Local e Offline

**User Story:** Como usuário, eu quero que meus dados sejam salvos localmente no dispositivo, para que eu possa acessar minhas plantas mesmo sem conexão com internet.

#### Acceptance Criteria

1. THE Planta_App SHALL armazenar todos os dados do usuário em Local_Storage persistente do dispositivo.
2. THE Planta_App SHALL permitir acesso completo às funcionalidades de "Minhas Plantas" sem conexão com internet.
3. THE Planta_App SHALL permitir adicionar novas plantas e registrar cuidados em modo offline.
4. THE Planta_App SHALL sincronizar dados com servidor quando conexão for restabelecida.
5. WHEN o dispositivo está offline, THE Planta_App SHALL exibir indicador visual de modo offline.
6. THE Planta_App SHALL armazenar imagens de plantas localmente para acesso offline.

### Requirement 10: Permissões e Acesso Nativo

**User Story:** Como usuário, eu quero que o app solicite permissões necessárias de forma clara, para que eu possa usar recursos da câmera e armazenamento com segurança.

#### Acceptance Criteria

1. WHEN o usuário tenta adicionar foto de planta pela primeira vez, THE Planta_App SHALL solicitar permissão de acesso à Camera_API.
2. WHEN o usuário tenta adicionar foto da galeria pela primeira vez, THE Planta_App SHALL solicitar permissão de acesso ao armazenamento do dispositivo.
3. THE Planta_App SHALL exibir mensagem explicativa antes de solicitar cada permissão.
4. IF permissão é negada, THEN THE Planta_App SHALL exibir mensagem informativa e permitir adicionar planta sem foto.
5. THE Planta_App SHALL fornecer opção de abrir configurações do sistema para alterar permissões negadas.

### Requirement 11: Performance e Otimização Mobile

**User Story:** Como usuário, eu quero que o aplicativo seja rápido e responsivo, para que eu tenha uma experiência fluida mesmo em dispositivos mais antigos.

#### Acceptance Criteria

1. THE Planta_App SHALL inicializar e exibir Landing_Page em no máximo 2 segundos em dispositivos de médio desempenho.
2. THE Planta_App SHALL manter taxa de 60 FPS durante animações e transições de tela.
3. THE Planta_App SHALL carregar lista de plantas com até 100 itens em no máximo 1 segundo.
4. THE Planta_App SHALL implementar lazy loading para imagens de plantas no feed da comunidade.
5. THE Planta_App SHALL otimizar imagens capturadas pela câmera antes de armazenar (compressão e redimensionamento).
6. THE Planta_App SHALL utilizar no máximo 150MB de memória RAM durante operação normal.
