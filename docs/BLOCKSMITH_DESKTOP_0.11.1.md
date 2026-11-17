# Blocksmith Studio Desktop 0.11.1 — integração com GitHub e Railway

## Arquitetura (importante)

Este repositório atualmente contém a **interface web React/Vite** e o **servidor Express** implantados no Railway como `jarvis-backend`. O Blocksmith Studio **desktop** é outro projeto, feito com Electron e ponte local para Roblox Studio.

A versão 0.11.1 do desktop foi entregue anteriormente como `Blocksmith_Studio_0.11.1_Codigo_Fonte.zip` no ChatGPT. **O código-fonte desse ZIP não está incluído neste repositório por esta alteração**. Não use o conteúdo de `src/` para compilar Electron e não substitua a interface web pelo ZIP.

## O que esta atualização adiciona ao serviço web

- `GET /api/health`: healthcheck público, independente da renderização do frontend.
- `GET /api/desktop/release`: metadados da versão de desenvolvimento, originados do manifesto `public/blocksmith-desktop-release.json`.
- Continua servindo a interface existente em `dist/`.

O endpoint não oferece arquivos executáveis nem envia credenciais de provedores de IA, tokens MCP ou dados do Roblox Studio. A ponte local do desktop **nunca** deve ficar exposta diretamente pela internet.

## Compilação do desktop com Codex (Windows)

1. Abra a pasta `Blocksmith-source` extraída do ZIP 0.11.1.
2. Instale Node.js LTS.
3. Execute `npm ci`.
4. Execute `npm run check`.
5. Teste o programa com `npm start`, conectando ao plugin Roblox Studio.
6. Quando estiver pronto, execute `npm run build:win`.

Para sincronizar **o código desktop** no GitHub, use uma pasta independente como `desktop/` em uma branch ou pull request. Antes de enviar, examine dependências e licenças e confirme que não existem chaves, tokens, logs ou credenciais nos arquivos. O Railway deve continuar implantando apenas a aplicação web na raiz.

## Critérios mínimos antes de considerar 0.11.1 validado

- Janela Electron abre no Windows e o preload carrega.
- Gerenciador de MCP inicia com execução automática **desligada**.
- Cada execução MCP iniciada pela IA pede confirmação.
- O plugin Roblox Studio conecta à ponte local.
- Edição, diff e restauração de scripts funcionam.
- Skills por projeto, Rojo, Blender, relatórios de playtest e histórico funcionam.

## Publicação

O manifesto reporta uma versão de desenvolvimento, **não um instalador publicado**. Atualize `sourceUploadedToGitHub` e distribuição somente depois de confirmar que os arquivos realmente foram enviados e os testes Windows passaram.
