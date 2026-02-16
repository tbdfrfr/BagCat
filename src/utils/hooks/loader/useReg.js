import { useEffect, useState } from 'react';
import { BareMuxConnection } from '@mercuryworkshop/bare-mux';
import { useOptions } from '/src/utils/optionsContext';
import { fetchW as returnWServer } from './findWisp';

const base = import.meta.env.BASE_URL || '/';
const withBase = (p) => `${base}${String(p || '').replace(/^\/+/, '')}`;
const swTargets = [
  { path: withBase('uv/sw.js') },
  { path: withBase('s_sw.js'), scope: withBase('scramjet/') },
];

let runtimeInitPromise = null;
let swInitPromise = null;

const waitForActivation = (registration, timeoutMs = 8000) =>
  new Promise((resolve) => {
    if (!registration) {
      resolve(false);
      return;
    }

    if (registration.active) {
      resolve(true);
      return;
    }

    let settled = false;
    const worker = registration.installing || registration.waiting;
    const onStateChange = () => {
      if (worker?.state === 'activated') settle(true);
    };

    let timeout;
    const settle = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker?.removeEventListener('statechange', onStateChange);
      resolve(ok);
    };

    worker?.addEventListener('statechange', onStateChange);
    timeout = setTimeout(() => settle(Boolean(registration.active)), timeoutMs);
  });

async function ensureRuntime() {
  try {
    if (!runtimeInitPromise) {
      runtimeInitPromise = (async () => {
        if (!window.scr) {
          const script = document.createElement('script');
          script.src = withBase('scram/scramjet.all.js');
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const { ScramjetController } = $scramjetLoadController();
        window.scr = new ScramjetController({
          files: {
            wasm: withBase('scram/scramjet.wasm.wasm'),
            all: withBase('scram/scramjet.all.js'),
            sync: withBase('scram/scramjet.sync.js'),
          },
          flags: { rewriterLogs: false, scramitize: false, cleanErrors: true, sourcemaps: true },
        });
        window.scr.init();
      })();
    }

    await runtimeInitPromise;
  } catch (err) {
    runtimeInitPromise = null;
    throw err;
  }
}

async function ensureServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  try {
    if (!swInitPromise) {
      swInitPromise = (async () => {
        for (const sw of swTargets) {
          try {
            const reg = await navigator.serviceWorker.register(
              sw.path,
              sw.scope ? { scope: sw.scope } : undefined,
            );
            await waitForActivation(reg);
          } catch (err) {
            console.warn(`SW reg err (${sw.path}):`, err);
          }
        }
      })();
    }

    await swInitPromise;
  } catch (err) {
    swInitPromise = null;
    throw err;
  }
}

export default function useReg() {
  const { options } = useOptions();
  const [proxyReady, setProxyReady] = useState(false);
  const [wispStatus, setWispStatus] = useState(null);

  useEffect(() => {
    let mounted = true;
    const ws = `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}/wisp/`;
    const staticMode = typeof isStaticBuild !== 'undefined' && isStaticBuild;

    const init = async () => {
      mounted && setProxyReady(false);
      mounted && setWispStatus(staticMode ? 'init' : null);

      await ensureRuntime();
      await ensureServiceWorkers();

      const connection = new BareMuxConnection(withBase('baremux/worker.js'));
      const socket = staticMode ? await returnWServer() : null;

      if (mounted && staticMode) {
        setWispStatus(socket ? true : false);
      }

      await connection.setTransport(withBase('libcurl/index.mjs'), [
        {
          wisp: options.wServer?.trim() ? options.wServer : staticMode ? socket : ws,
        },
      ]);

      mounted && setProxyReady(true);
    };

    init().catch((err) => {
      console.warn('Loader registration init failed:', err);
      if (mounted) {
        staticMode && setWispStatus(false);
        setProxyReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [options.wServer]);

  return { proxyReady, wispStatus };
}
