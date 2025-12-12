# Implementation Plan

- [x] 1. Configurar projeto React Native com Expo





  - Inicializar projeto com `npx create-expo-app planta-app`
  - Configurar estrutura de pastas (src/, screens/, components/, etc.)
  - Instalar dependências principais: React Navigation, AsyncStorage, Vector Icons
  - Configurar app.json com nome, ícone e splash screen
  - _Requirements: 8.1, 8.2_

- [x] 2. Implementar sistema de tema e design system





  - Criar arquivo src/theme/colors.js com paleta botanical
  - Criar arquivo src/theme/typography.js com fontes e tamanhos
  - Criar arquivo src/theme/spacing.js com espaçamentos e border radius
  - Criar arquivo src/theme/shadows.js com sombras específicas por plataforma
  - _Requirements: 8.3_

- [x] 3. Configurar gerenciamento de estado com Context API





  - Criar src/context/AppContext.js com Context e Provider
  - Criar src/context/AppReducer.js com reducer e actions
  - Definir tipos de actions (ADD_PLANT, UPDATE_PLANT, etc.)
  - Implementar estado inicial com dados mockados
  - _Requirements: 9.1, 9.2_

- [x] 4. Criar banco de dados Supabase





  - Criar schema SQL para tabelas: users, plants, care_logs, posts, comments
  - Definir relacionamentos entre tabelas (foreign keys)
  - Configurar Row Level Security (RLS) policies
  - Criar triggers para updated_at automático
  - Configurar storage bucket para imagens de plantas
  - Criar src/services/supabase.js com cliente configurado
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 5. Criar Splash Screen com animações





  - Criar src/screens/SplashScreen.js
  - Adicionar logo e elementos botânicos
  - Instalar e configurar Lottie para animações
  - Implementar animação de folhas flutuantes
  - Implementar transição fade-out após 3 segundos
  - Carregar dados do AsyncStorage durante splash
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Configurar sistema de navegação






  - Instalar @react-navigation/native e dependências
  - Criar src/navigation/AppNavigator.js com Stack Navigator
  - Criar src/navigation/TabNavigator.js com Bottom Tabs
  - Configurar 4 tabs: Home, Plants, Community, Profile
  - Adicionar ícones nas tabs usando Vector Icons
  - Configurar estilos das tabs (cores ativo/inativo)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Implementar Home Screen





  - Criar src/screens/HomeScreen.js com SafeAreaView
  - Adicionar header com data e avatar do usuário
  - Implementar card de saudação personalizada (Bom dia/tarde/noite)
  - Criar card de gamificação com XP e barra de progresso
  - Implementar seção "Suas Plantas" com FlatList horizontal
  - Adicionar FAB (Floating Action Button) para adicionar planta
  - Destacar plantas que precisam de atenção
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Criar componente PlantCard reutilizável





  - Criar src/components/PlantCard.js
  - Exibir imagem, nome e status da planta
  - Adicionar indicadores visuais (ícone de gota para rega)
  - Implementar TouchableOpacity para navegação
  - Aplicar estilos com sombras e border radius
  - _Requirements: 4.1, 4.5_

- [x] 9. Implementar My Plants Screen





  - Criar src/screens/MyPlantsScreen.js
  - Adicionar filtros "Todas" e "Precisam de Atenção"
  - Implementar FlatList com numColumns={2} para grid
  - Renderizar PlantCard para cada planta
  - Implementar lógica de filtro por status
  - Adicionar estado de lista vazia com mensagem
  - _Requirements: 4.1, 4.5_

- [x] 10. Implementar Plant Detail Screen
  - Criar src/screens/PlantDetailScreen.js ✓
  - Exibir imagem grande da planta no topo ✓
  - Mostrar nome, nome científico e descrição ✓
  - Adicionar seção de informações (rega e luminosidade) ✓
  - Implementar seção de dicas de cuidado ✓
  - Criar timeline de registro de cuidados ✓
  - Adicionar seção de comentários da comunidade ✓
  - Implementar botão "Registrar Cuidado" ✓
  - _Requirements: 4.2, 4.3, 4.4, 4.6_

- [x] 11. Criar componente CareLogItem para timeline
  - Criar componente CareLogItem integrado na PlantDetailScreen ✓
  - Exibir ícone do tipo de cuidado (água, adubo, poda) ✓
  - Mostrar data formatada e notas ✓
  - Aplicar estilo de timeline vertical ✓
  - _Requirements: 4.3_

- [x] 12. Implementar serviço de imagens





  - Criar src/services/imageService.js
  - Instalar expo-image-picker
  - Implementar função pickImageFromCamera
  - Implementar função pickImageFromGallery
  - Adicionar compressão e redimensionamento de imagens
  - Implementar salvamento de imagem em file system local
  - _Requirements: 5.2, 10.2, 11.5_

- [x] 13. Implementar sistema de permissões








  - Criar src/utils/permissions.js
  - Implementar requestCameraPermission
  - Implementar requestGalleryPermission
  - Adicionar Alerts explicativos antes de solicitar permissões
  - Implementar opção de abrir Settings se permissão negada
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14. Implementar Add Plant Screen
  - Criar src/screens/AddPlantScreen.js ✓
  - Adicionar KeyboardAvoidingView para iOS/Android ✓
  - Implementar seletor de imagem (câmera ou galeria) ✓
  - Adicionar TextInput para nome da planta ✓
  - Implementar Picker para frequência de rega ✓
  - Implementar Picker para necessidade de luz ✓
  - Adicionar Switch para "Tornar Público" ✓
  - Implementar validação de formulário ✓
  - Adicionar botão "Salvar Planta" com ação ✓
  - Salvar planta no Context e AsyncStorage ✓
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 15. Implementar Care Log Modal
  - Criar modal para registrar cuidado ✓
  - Adicionar opções de tipo de atividade (rega, adubo, poda, etc.) ✓
  - Implementar seletor de data (automático com data atual) ✓
  - Adicionar campo de notas opcional ✓
  - Implementar botão "Salvar Registro" ✓
  - Atualizar planta no Context e AsyncStorage ✓
  - Atualizar status da planta (remover "thirsty" após rega) ✓
  - _Requirements: 4.7_

- [x] 16. Implementar Community Screen (estrutura básica)
  - Criar src/screens/CommunityScreen.js ✓
  - Adicionar filtros de categoria (Tudo, Dicas, Identificação)
  - Implementar FlatList para feed de posts
  - Renderizar PostCard para cada post
  - Implementar scroll infinito (pagination)
  - Adicionar estado de loading ao carregar mais posts
  - _Requirements: 6.1, 6.3, 6.5, 6.6_

- [x] 17. Criar componente PostCard








  - Criar src/components/PostCard.js
  - Exibir avatar, nome do autor e tempo desde publicação
  - Mostrar imagem do post
  - Adicionar descrição
  - Implementar botão de curtir com contador
  - Adicionar contador de comentários
  - _Requirements: 6.2, 6.4_

- [x] 18. Implementar funcionalidade de curtir posts





  - Adicionar action TOGGLE_LIKE no reducer
  - Implementar lógica de adicionar/remover userId do array likedBy
  - Atualizar contador de likes
  - Persistir estado no AsyncStorage
  - Adicionar feedback visual (animação do ícone)
  - _Requirements: 6.4_

- [x] 19. Implementar Profile Screen (estrutura básica)
  - Criar src/screens/ProfileScreen.js ✓
  - Exibir avatar, nome e data de início
  - Mostrar estatísticas (plantas, dias ativos, badges)
  - Implementar seção de conquistas/badges
  - Adicionar barra de progresso de XP
  - Criar botões de ação (Editar Perfil, Configurações, Sair)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 20. Criar componente Badge





  - Criar src/components/Badge.js
  - Exibir ícone do badge
  - Mostrar nome do badge
  - Implementar estado bloqueado (cinza) vs conquistado (colorido)
  - _Requirements: 3.3_

- [x] 21. Implementar Edit Profile Modal
  - Criar modal para editar perfil ✓
  - Adicionar campo para alterar nome ✓
  - Implementar seletor de avatar (câmera ou galeria) ✓
  - Adicionar botão "Salvar Alterações" ✓
  - Atualizar usuário no Context e AsyncStorage ✓
  - _Requirements: 3.4_

- [x] 22. Implementar sistema de Toast notifications





  - Criar src/components/Toast.js
  - Implementar showToast para Android (ToastAndroid)
  - Instalar react-native-toast-message para iOS
  - Adicionar variantes: success, error, info, warning
  - Integrar toasts em ações do app (salvar planta, erro de validação)
  - _Requirements: 5.6_

- [x] 23. Implementar detecção de modo offline








  - Instalar @react-native-community/netinfo
  - Criar src/utils/networkListener.js
  - Adicionar listener de mudança de conexão
  - Atualizar estado isOffline no Context
  - Exibir indicador visual quando offline
  - _Requirements: 9.5_

- [x] 24. Implementar sincronização de dados







  - Criar src/services/syncService.js
  - Implementar fila de ações pendentes quando offline
  - Adicionar lógica de sincronização ao reconectar
  - Sincronizar plantas, posts e cuidados pendentes
  - Exibir toast de sucesso após sincronização
  - _Requirements: 9.4_

- [x] 25. Otimizar performance e imagens








  - Implementar lazy loading de imagens no feed
  - Adicionar cache de imagens
  - Otimizar FlatList com windowSize e maxToRenderPerBatch
  - Implementar compressão de imagens antes de salvar
  - Adicionar placeholder enquanto imagens carregam
  - _Requirements: 11.3, 11.4, 11.5_


- [ ] 26. Implementar animações com Reanimated
  - Instalar react-native-reanimated
  - Criar src/utils/animations.js com animações reutilizáveis
  - Implementar fadeIn para transições de tela
  - Adicionar slideUp para modais
  - Implementar animação de pulse para elementos de atenção
  - Adicionar animação de float para splash screen
  - _Requirements: 1.2, 2.4, 11.2_

- [x] 27. Configurar gestos nativos





  - Instalar react-native-gesture-handler
  - Implementar swipe back no iOS
  - Configurar hardware back button no Android
  - Adicionar swipe to refresh no feed da comunidade
  - _Requirements: 8.4_

- [x] 28. Implementar safe areas e responsividade





  - Usar SafeAreaView em todas as screens
  - Testar em dispositivos com notch
  - Ajustar layouts para orientação landscape
  - Validar em tablets (iPad, Android tablets)
  - _Requirements: 8.5_

- [x] 29. Configurar build e deployment







  - Configurar app.json com metadata completo
  - Adicionar ícone e splash screen assets
  - Configurar permissões no iOS (Info.plist)
  - Configurar permissões no Android (AndroidManifest.xml)
  - Instalar e configurar EAS CLI
  - Criar builds de desenvolvimento para teste
  - _Requirements: 8.1, 8.2, 10.1, 10.2_

- [ ]* 30. Testes e validação final
  - [ ]* 30.1 Testar em dispositivos iOS reais
    - Testar em iPhone com notch
    - Validar permissões de câmera e galeria
    - Verificar safe areas
    - _Requirements: 8.1, 8.5_
  - [ ]* 30.2 Testar em dispositivos Android reais
    - Testar em diferentes versões do Android (6.0+)
    - Validar permissões
    - Testar hardware back button
    - _Requirements: 8.2, 8.4_
  - [ ]* 30.3 Testes de performance
    - Medir tempo de inicialização
    - Verificar FPS durante animações
    - Monitorar uso de memória
    - _Requirements: 11.1, 11.2, 11.6_
  - [ ]* 30.4 Testes de modo offline
    - Adicionar planta offline
    - Registrar cuidado offline
    - Verificar sincronização ao reconectar
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

## 🎯 PRÓXIMAS PRIORIDADES (Funcionalidades Essenciais)

### ✅ **FUNCIONALIDADES PRINCIPAIS COMPLETAS:**
1. ✅ **Plant Detail Screen** - Visualização completa das plantas com timeline
2. ✅ **Add Plant Screen** - Adicionar novas plantas com formulário completo
3. ✅ **Care Log Modal** - Registrar cuidados das plantas
4. ✅ **Edit Profile Modal** - Editar perfil do usuário
5. ✅ **CareLogItem Component** - Timeline de cuidados integrada

### 🔄 **Próximas Funcionalidades Importantes:**
1. **Task 12** - Implementar serviço de imagens real (expo-image-picker)
2. **Task 13** - Sistema de permissões (câmera/galeria)
3. **Task 16** - Completar Community Screen (feed social)
4. **Task 17** - Criar componente PostCard (posts da comunidade)
5. **Task 22** - Sistema de Toast notifications (feedback visual)

### 📱 **Status Atual do MVP:**
- ✅ **Core completo**: Navegação, tema, contexto, splash screen
- ✅ **Telas principais**: Home, MyPlants, PlantDetail, AddPlant, Profile - TODAS FUNCIONAIS
- ✅ **Funcionalidades de plantas**: Visualizar, adicionar, registrar cuidados
- ✅ **Gerenciamento de perfil**: Visualizar e editar perfil
- ✅ **Sistema de dados**: Context API, reducer, dados mockados
- ✅ **Database**: Schema Supabase configurado

### 🎉 **MVP FUNCIONAL ALCANÇADO!**
O app agora possui todas as funcionalidades essenciais:
- ✅ Ver e gerenciar plantas
- ✅ Adicionar novas plantas com formulário completo
- ✅ Registrar e acompanhar cuidados
- ✅ Visualizar detalhes completos das plantas
- ✅ Editar perfil do usuário
- ✅ Sistema de gamificação (XP, níveis, badges)

- [x] 31. Implementar funcionalidade de QR Code
  - Criar src/screens/QRScannerScreen.js para escaneamento ✓
  - Criar src/components/QRCodeGenerator.js para geração ✓
  - Criar src/utils/qrCodeUtils.js com funções utilitárias ✓
  - Criar src/services/deepLinkService.js para deep linking ✓
  - Adicionar dependências: expo-barcode-scanner, react-native-qrcode-svg ✓
  - Configurar permissões de câmera no app.json ✓
  - Integrar botões de scanner nas telas Home e MyPlants ✓
  - Adicionar botão de QR code na PlantDetailScreen ✓
  - Implementar geração automática de QR code para cada planta ✓
  - Configurar deep linking (planta-app://plant/{id}) ✓
  - Implementar compartilhamento de QR codes e links ✓
  - _Requirements: Nova funcionalidade - QR Code para plantas_

### 🚀 **Próximo Foco:**
**Melhorar a experiência do usuário** com funcionalidades avançadas:
- ✅ **QR Code para plantas** - IMPLEMENTADO!
- Integração real com câmera/galeria
- Feed social da comunidade
- Sistema de notificações
- Funcionalidades offline

### 🎯 **NOVA FUNCIONALIDADE IMPLEMENTADA: QR CODE**
- ✅ **Scanner de QR Code**: Tela dedicada com controles de câmera
- ✅ **Geração de QR Code**: Modal para visualizar e compartilhar
- ✅ **Deep Linking**: URLs personalizadas para abertura externa
- ✅ **Compartilhamento**: Salvar, compartilhar e copiar links
- ✅ **Integração**: Botões de acesso em múltiplas telas
