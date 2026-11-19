# Blocksmith — site web e aplicativo desktop
Este repositório contém o **frontend web React/Vite** e o **backend Express** publicados no Railway. O aplicativo Windows **Blocksmith Studio Desktop (Electron)** é distribuído separadamente em ZIP de código-fonte.

## Serviços web
- `GET /api/health` — healthcheck do servidor web.
- `GET /api/desktop/release` — versão e novidades **informativas** do Desktop.
- `npm ci && npm run build && npm start` — compilar e executar o site.

## Desktop 0.12.12
Esta atualização registra a integração do quarto provedor de IA, **Radox AI**, sem alterar o backend web. Os provedores do aplicativo Windows são OpenAI Compatible, OpenRouter, NightRouter.ai e Radox AI. São **24 skills** ativas e **20 comandos nativos**, com 151 testes automatizados aprovados.

**Documentação:** [Blocksmith Desktop 0.12.12](docs/BLOCKSMITH_DESKTOP_0.12.12.md).

**Importante:** o ZIP completo do desktop foi disponibilizado na conversa do ChatGPT, mas **ainda não foi enviado a este repositório**. Não confunda a versão indicada no manifesto com instalador publicado. O Railway não hospeda o Electron e não deve expor a ponte MCP local.

## Configuração local do site
```sh
npm install
npm run dev
```
Para produção: `npm run build` e `npm start`.
