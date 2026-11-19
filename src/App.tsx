import { useCallback, useRef } from 'react';

const BLOCKSMITH_HTML_PATH = '/assets/aistudio/blocksmith-app-ajustado_aadf2d67.html';

const FULLSCREEN_OVERRIDE_CSS = `
  html, body {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #05070d !important;
  }
  #vis-container {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
  }
  #app.app {
    width: 100% !important;
    height: 100% !important;
    min-height: 100vh !important;
    border: 0 !important;
    border-radius: 0 !important;
  }
  #app.app .sd {
    border-radius: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }
  #app.app .rp {
    height: 100% !important;
    min-height: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
  }
  #app.app .msgs {
    min-height: 0 !important;
    overflow-y: auto !important;
  }
  #app.app .panel-view.on,
  #app.app .cli-manager {
    border-radius: 0 !important;
  }
`;

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !doc.head) return;

      let styleEl = doc.getElementById('blocksmith-fullscreen-override') as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = 'blocksmith-fullscreen-override';
        styleEl.textContent = FULLSCREEN_OVERRIDE_CSS;
        doc.head.appendChild(styleEl);
      }

      // Enhance the hosted web preview without touching the Electron source.
      if (doc.head && !doc.getElementById('blocksmith-web-models-style')) {
        const modelsStyle = doc.createElement('link');
        modelsStyle.id = 'blocksmith-web-models-style';
        modelsStyle.rel = 'stylesheet';
        modelsStyle.href = '/assets/blocksmith-web-models.css';
        doc.head.appendChild(modelsStyle);
      }
      // Global Midnight Forge skin. Loaded after the original iframe and Models
      // styles so that every web view shares one black/white/deep-blue palette.
      if (doc.head && !doc.getElementById('blocksmith-midnight-forge-style')) {
        const themeStyle = doc.createElement('link');
        themeStyle.id = 'blocksmith-midnight-forge-style';
        themeStyle.rel = 'stylesheet';
        themeStyle.href = '/assets/blocksmith-midnight-forge.css?v=1';
        doc.head.appendChild(themeStyle);
      }
      if (doc.body && !doc.getElementById('blocksmith-midnight-forge-script')) {
        const themeScript = doc.createElement('script');
        themeScript.id = 'blocksmith-midnight-forge-script';
        themeScript.src = '/assets/blocksmith-midnight-forge.js?v=1';
        themeScript.async = false;
        doc.body.appendChild(themeScript);
      }

      if (doc.body && !doc.getElementById('blocksmith-web-models-script')) {
        const modelsScript = doc.createElement('script');
        modelsScript.id = 'blocksmith-web-models-script';
        modelsScript.src = '/assets/blocksmith-web-models.js';
        modelsScript.async = false;
        doc.body.appendChild(modelsScript);
      }
      if (doc.head && !doc.getElementById('blocksmith-cli-accounts-style')) {
        const toolsStyle = doc.createElement('link');
        toolsStyle.id = 'blocksmith-cli-accounts-style';
        toolsStyle.rel = 'stylesheet';
        toolsStyle.href = '/assets/blocksmith-cli-accounts.css?v=1';
        doc.head.appendChild(toolsStyle);
      }
      // Color Studio overrides fixed Midnight colors using a live visual palette.
      if (doc.head && !doc.getElementById('blocksmith-ui-colors-style')) {
        const colorStyle = doc.createElement('link');
        colorStyle.id = 'blocksmith-ui-colors-style';
        colorStyle.rel = 'stylesheet';
        colorStyle.href = '/assets/blocksmith-ui-colors.css?v=1';
        doc.head.appendChild(colorStyle);
      }
      if (doc.body && !doc.getElementById('blocksmith-web-history-script')) {
        const historyScript = doc.createElement('script');
        historyScript.id = 'blocksmith-web-history-script';
        historyScript.src = '/assets/blocksmith-web-history.js';
        doc.body.appendChild(historyScript);
      }
      if (doc.body && !doc.getElementById('blocksmith-cli-accounts-script')) {
        const toolsScript = doc.createElement('script');
        toolsScript.id = 'blocksmith-cli-accounts-script';
        toolsScript.src = '/assets/blocksmith-cli-accounts.js?v=1';
        toolsScript.async = false;
        doc.body.appendChild(toolsScript);
      }
      if (doc.body && !doc.getElementById('blocksmith-ui-colors-script')) {
        const colorScript = doc.createElement('script');
        colorScript.id = 'blocksmith-ui-colors-script';
        colorScript.src = '/assets/blocksmith-ui-colors.js?v=1';
        colorScript.async = false;
        doc.body.appendChild(colorScript);
      }
    } catch {
      // Ignore cross-origin access errors if ever served from a different origin
    }
  }, []);

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#05070d]">
      <iframe
        ref={iframeRef}
        src={BLOCKSMITH_HTML_PATH}
        title="Blocksmith"
        onLoad={handleLoad}
        className="w-full h-full border-0 block"
      />
    </main>
  );
}
