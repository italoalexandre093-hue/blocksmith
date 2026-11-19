# Blocksmith Web — Google Antigravity e Qoder

## Implementação

O **seletor ao lado do chat** e a aba **Configurações → CLIs** passam a mostrar **Claude Code, ChatGPT Codex, Google Antigravity e Qoder**, com as identidades visuais coloridas, usando SVGs de `lobehub/lobe-icons` (MIT, atribuição em `public/assets/brands/LOBE_ICONS_LICENSE.txt`).

O fluxo de configuração oferece:
- Botão **Abrir download oficial**, sem iniciar downloads silenciosos.
- Botão **Abrir conta oficial**, sem capturar senha, cookies ou códigos OAuth.
- Botão **Guia de login**, com documentação original do fabricante.
- Instruções e comando local copiável de cada ferramenta.
- Indicação de estado **não verificado**, sem declarar “instalado” ou “conectado” antes de qualquer verificação real.

## Fluxos oficiais de login

**Google Antigravity**:
1. Instale pelo <https://antigravity.google/download>.
2. Inicie a CLI no terminal Windows com `agy`.
3. Se não houver sessão local, o Antigravity abre automaticamente o navegador para o login Google OAuth.
4. Confirme o resultado no terminal. Documentação: <https://antigravity.google/docs/install/>.

**Qoder**:
1. Instale o Qoder CLI em <https://qoder.com/download>.
2. Inicie a CLI com `qoder`.
3. Dentro do prompt interativo digite `/login` ou `/signin`.
4. Selecione *Login with Qoder Platform (Browser)*. Documentação: <https://docs.qoder.com/cli/authentication>.

O guia também mantém Codex (`codex login`) e Claude Code (`claude auth login`).

## Limitação necessária

**O site hospedado na Railway não tem permissão para executar processos nem ler o cofre de credenciais do Windows do usuário.** Clicar em “Abrir conta oficial” não é um OAuth do Blocksmith e não associa a sessão ao chat hospedado. Os botões foram deliberadamente nomeados para não sugerir uma conexão que não existe.

Autenticar no programa oficial permite utilizar aquela CLI no computador. Para usar diretamente a sessão da CLI no chat do Blocksmith, será necessário implementar e validar no aplicativo Electron uma ponte local autorizada, com verificação de conta e ferramentas compatíveis. Nunca envie tokens dessas ferramentas ao Railway para simular a integração.

## Arquivos alterados

- `public/assets/brands/antigravity-color.svg`
- `public/assets/brands/qoder-color.svg`
- `public/assets/brands/LOBE_ICONS_LICENSE.txt`
- `public/assets/blocksmith-cli-accounts.js`
- `public/assets/blocksmith-cli-accounts.css`
- `src/App.tsx`
- `tests/web-cli-accounts.test.mjs`

## Validação

```sh
npm run test:web
npm run build
```

Teste visual pós-publicação: no site, abrir seletor de modelos, clicar nos ícones e no botão de adição, abrir a seção Configurações → CLIs, verificar ambas as marcas, abrir links oficiais e conferir as instruções de login. A verificação visual não implica login autenticado.
