# Blocksmith Studio Desktop 0.12.12 — Radox AI
## Arquitetura e distribuição
Este repositório contém a interface web React/Vite e o backend Express implantados no Railway. O Blocksmith Desktop é um projeto Electron **separado**, que conversa localmente com Roblox Studio. Não implante Electron, o servidor MCP local, chaves de IA ou ferramentas Windows no Railway.

O código-fonte completo do desktop **0.12.12** foi gerado como `Blocksmith_Studio_0.12.12_Radox_AI_Quatro_Provedores.zip` no ChatGPT, mas **não está anexado a este repositório**. O manifesto público indica a versão do ZIP; não anuncia hospedagem do arquivo. Para sincronizar o código integral posteriormente, crie uma pasta independente `desktop/` e faça a revisão de segredos, licenças e testes antes de publicar.

## Novidade — quatro provedores
No aplicativo Electron, Configurações → Provedores de IA (ou onboarding), há quatro opções:

| Provedor | Base URL | Dados necessários |
| --- | --- | --- |
| OpenAI Compatible | editável | Base URL + modelo + API key quando necessária |
| OpenRouter | `https://openrouter.ai/api/v1` | API key + modelo |
| NightRouter.ai | `https://api.nightrouter.ai/v1` | API key + modelo |
| Radox AI | `https://radoxai.com/v1` | API key + modelo |

Os três provedores predefinidos oferecem `GET /models` para carregamento de modelos. A Radox documenta credenciais `cc_...` e requer escopos `inference` (chat) e `models:read` (lista). Todos os perfis mantêm chave/modelo independentes e as URLs predefinidas não podem ser alteradas pelo usuário.

**Referência oficial:** https://radoxai.com/docs/coding-agents e https://radoxai.com/docs/models .

## Validação do desktop
A árvore de código-fonte Electron 0.12.12 passou em **151 testes automatizados** localmente e após extração do ZIP. Os testes de provedores são simulados; faltam execução real no Windows e autenticação com Radox/OpenRouter/NightRouter.

```powershell
# Dentro da pasta Blocksmith-source, extraída do ZIP
npm ci
npm run check
npm start
```

O arquivo ZIP inclui 24 skills, 20 comandos nativos, o plugin Roblox Studio e demais módulos. Nenhum instalador novo foi gerado.

## Railway
O Railway hospeda apenas o projeto web da raiz. O servidor mantém `GET /api/health` e `GET /api/desktop/release`. O último retorna apenas este manifesto público, sem credenciais ou código Electron.

A atualização do manifesto **não é** um deploy do aplicativo Windows: continua necessário gerar e distribuir um instalador separadamente, se desejado.
