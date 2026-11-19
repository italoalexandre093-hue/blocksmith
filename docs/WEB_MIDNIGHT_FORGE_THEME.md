# Midnight Forge — Novo design do Blocksmith Web

## Identidade visual

Paleta definida para **preto, branco e azul-escuro**:

| Uso | Cor |
| --- | --- |
| Fundo absoluto | `#05070D` |
| Superfícies e sidebar | `#0B1120`, `#101A30` |
| Azul-marinho estrutural | `#1B3975` |
| Ações e botões | `#315DA9` |
| Texto primário | `#F5F8FF` |
| Texto secundário | `#BDC9DF` |
| Bordas | `#263C62` |

## Componentes atualizados

- Toda a interface web hospedada pelo Railway: **barra lateral, projeto, chat, mensagens, composer, menu de modelos, configurações, modais e gerenciador de ferramentas**.
- Página **Models**, listas e janela **Add model**, removendo a paleta verde anterior.
- Telas de CLIs, Roblox Studio, Skills, Blender, Aparência, Plugins e Personalização.
- Ajustes para dispositivos móveis, navegação por teclado, contraste e redução de movimento.
- Controles preexistentes de aparência preservados: opções de temas agora correspondem a variações de Midnight/Obsidian/Navy e os destaques são apenas tons de azul.
- O shell React externo também usa o mesmo fundo preto, evitando margens com cor divergente.

## Implementação

- `public/assets/blocksmith-midnight-forge.css` — camada visual global inserida **depois** dos estilos do Models.
- `public/assets/blocksmith-midnight-forge.js` — adapta o seletor de cores e nomes dos temas, sem alterar dados do chat ou credenciais.
- `public/assets/blocksmith-web-models.css` — componentes de Models recebem cores azul-marinho diretamente.
- `src/App.tsx` — injeta estilos/scripts no iframe que hospeda a UI web; mantém a interface e a separação do Electron.
- `src/index.css` — fundo externo.
- `tests/web-midnight-forge.test.mjs` — cobertura de tema, carregamento, integridade e comportamento da paleta.

## O que não muda

Chat, chave de API, lista de modelos, salvamento de histórico no navegador e back-end são preservados. Esta alteração é **visual**: não habilita Roblox Studio, Blender, CLI nem MCP local dentro do Railway. O aplicativo desktop Electron não recebeu essas cores nesta mudança.

## Verificação

```sh
npm run test:web
npm run build
```

O Railway compila o projeto com `npm run build`, que já chama os testes. Após a publicação, abra o site e use `Ctrl + F5` para ignorar o CSS antigo em cache.

A mudança não adiciona imagens remotas nem fontes pagas; permanece com fontes de sistema.
