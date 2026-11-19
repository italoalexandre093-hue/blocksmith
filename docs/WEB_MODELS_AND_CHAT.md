# Blocksmith Web — Chat real, Models e configurações

Esta atualização modifica o **site React/Vite hospedado no Railway**, e não o aplicativo Electron Windows.

## Implementado na interface web

- Menu lateral **Models** e aba **Models** em Configurações (substitui a antiga aba OpenAI Compatible).
- Janela **Add model** com provedor, tipo de API, Base URL quando aplicável, API key, múltiplos Model IDs, busca dos IDs disponíveis e remoção de modelos.
- Provedores predefinidos: **OpenAI**, **Anthropic**, **DeepSeek**, **OpenRouter**, **NightRouter.ai** e **Radox AI**. Para OpenAI Compatible e Anthropic Compatible, a Base URL é definida pelo usuário.
- APIs de chat: Chat Completions, Responses API e Anthropic Messages (segundo o provedor).
- Seletor de modelos no chat; mensagens seguem para o provedor selecionado em vez de utilizar respostas demonstrativas.
- Chaves ficam **somente no sessionStorage do navegador**. O Railway encaminha a solicitação para uma lista fixa de hosts oficiais, sem persistir a chave.
- Salvo o modelo padrão no armazenamento local, sem incluir credenciais.
- O histórico local de chats, projetos e rascunhos, com Exportar/Importar, continua funcionando.

## Limites de segurança / compatibilidade

- Provedores **personalizados** são chamados diretamente pelo navegador; a API escolhida deve permitir CORS. Não se usa a infraestrutura do Railway como proxy arbitrário de URLs.
- A chave digitada está acessível ao navegador durante a sessão; **não é armazenamento seguro como o cofre do Electron**. Não use máquinas compartilhadas. O chat hospedado depende das permissões da sua chave e de cobrança/quotas do provedor.
- Os provedores predefinidos usam HTTPS e permitem até 40 solicitações ao backend por minuto por origem do cliente. O endpoint não aceita host arbitrário nem registra credenciais.
- O modo Chat web é texto. **Não executa** Roblox Studio, Blender, CLIs, a ponte MCP local, scripts Luau, nem gera arquivos de imagem/3D. Essas funções são exclusivas do Desktop até existir uma integração web real e autorizada. Os botões de instalação não devem simular sucesso.
- A aba Skills web mantém controles básicos; o catálogo completo de **24 skills** permanece no código Electron. Não declare essas skills como executadas pelo site.
- O histórico é por navegador, não sincroniza entre dispositivos; chats antigos perdidos antes da persistência não podem ser recuperados.
- A implantação atualiza o **site web**, não distribui um instalador Windows.

## Validação

```sh
npm ci
npm run test:web
npm run build
npm start
```

Após o deploy, verificar `GET /api/health` no Railway, criar um modelo na aba Models, selecionar no chat, enviar uma pergunta com chave autorizada, atualizar a página e confirmar que os chats persistem. **Os testes automatizados não fazem chamadas autenticadas aos provedores reais.**

## Arquitetura

- `src/App.tsx` — hospeda a interface original e injeta os aprimoramentos web.
- `public/assets/blocksmith-web-history.js` — persiste chats e projetos no navegador.
- `public/assets/blocksmith-web-models.js` — UI Models e roteamento do chat real.
- `public/assets/blocksmith-web-models.css` — identidade visual.
- `server.js` — endpoints `POST /api/ai/models`, `POST /api/ai/chat`, com provedores de destino fixos.
- `tests/web-models.test.mjs` — testes de sintaxe e invariantes.

O registro de release do Electron permanece separado e não é alterado pela atualização web.
