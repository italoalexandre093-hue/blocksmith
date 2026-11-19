# Histórico local no Blocksmith Web

O Railway hospeda **a interface web de demonstração**, e o aplicativo Electron é um projeto separado. Este recurso corrige um problema verificável: o HTML anterior criava `chats`, `mainChats` e `projects` apenas em memória, sem mecanismo de armazenamento.

## O que mudou
- Conversas, projetos, nomes, mensagens e rascunhos são gravados automaticamente em `localStorage` do navegador, no domínio da interface web.
- Ao recarregar a página no **mesmo navegador**, os chats salvos são restaurados.
- Botões **Exportar** e **Importar** permitem criar e restaurar backups JSON.
- Somente dados dos chats entram no backup: **não salvamos API keys, tokens, sessões de plugins nem arquivos anexados**.
- A importação pede confirmação antes de substituir o histórico atual.

## Limitações
- **Não** recupera chats de sessões passadas que o código antigo não persistiu.
- **Não** sincroniza entre navegadores, dispositivos ou contas. Histórico local pode ser apagado ao limpar dados do site ou usar navegação privada.
- Dados de chat ficam no armazenamento local do navegador; use Exportar para preservar um backup.
- Arquivos anexados não são restaurados; apenas os nomes já mostrados nas mensagens podem permanecer.
- A interface web continua sendo um protótipo separado do Electron, com respostas simuladas do chat; a biblioteca Models 0.12.13 ainda **não** está portada para a web.
- O backend Railway continua hospedando o site e os endpoints `/api/health` e `/api/desktop/release`. Não hospeda chaves privadas nem a ponte MCP local.

## Testes
O script de persistência foi verificado com `node --check` e em teste isolado de gravação/restauração de chats, mensagens, projetos e rascunhos. Um teste visual end-to-end do site completo requer navegador integrado disponível e não foi executado.
