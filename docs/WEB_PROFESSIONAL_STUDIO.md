# Blocksmith Studio Web — Professional Workspace UI

## Objetivo

Transformar a interface web existente em uma experiência de produto desktop mais profissional e consistente, sem reescrever o Blocksmith e sem alterar a lógica de chats, modelos, provedor, autenticação, histórico, skills ou projetos.

## O que mudou

- Design system com superfícies contidas, bordas sutis, sombras consistentes e tipografia limpa.
- Barra lateral revisada, identidade Blocksmith Studio, separação por seções, navegação compacta e estados ativos.
- Novo cabeçalho de workspace com contexto de navegação e atalhos funcionais para **Novo chat** e **Configurações**.
- Tela de conversa vazia com três atalhos de prompts: **Criar um sistema**, **Criar uma thumbnail** e **Planejar meu jogo**. Os atalhos **preparam o rascunho**, mas **não enviam solicitações automaticamente**.
- Composer refinado, indicação de atalhos de teclado e hierarquia de botões.
- Ajustes visuais para configurações, gerenciamento de modelos, modais e conectores.
- Estilos responsivos e respeito à preferência por movimento reduzido.
- Os seis temas de cor continuam funcionando: as cores selecionadas no **Visual Color Studio** controlam a ênfase do novo design.

## Arquivos

- `public/assets/blocksmith-pro-workspace.css`: camada CSS aplicada **depois** da identidade Midnight Forge e do Visual Color Studio.
- `public/assets/blocksmith-pro-workspace.js`: aprimoramentos progressivos de navegação e quick-start, sem credenciais nem chamadas de rede.
- `src/App.tsx`: injeta CSS e JS no iframe da interface original.
- `tests/web-professional-workspace.test.mjs`: cobertura estática de componentes, ordem de carregamento e segurança.

## Validação

```bash
npm run test:web
npm run build
```

A implantação web na Railway deve usar o serviço `ample-spirit / jarvis-backend` conectado ao repositório `italoalexandre093-hue/blocksmith`, branch `main`, mantendo o comando de build e healthcheck atuais.

## Limitações

Esta é uma mudança de **interface web**. Não gera um instalador Windows nem conecta automaticamente sessões desktop de Antigravity/Qoder ao chat. O menu de conectores mantém seus fluxos oficiais sem simular autenticação. Os atalhos do welcome preenchem o editor; os recursos efetivos de resposta dependem do modelo/provedor configurado.
