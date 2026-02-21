import { useEffect, useState } from 'react';
import { BareMuxConnection } from '@mercuryworkshop/bare-mux';
import { useOptions } from '../../optionsContext';
import { fetchW as returnWServer } from './findWisp';

const base = import.meta.env.BASE_URL || '/';
const withBase = (p) => `${base}${String(p || '').replace(/^\/+/, '')}`;
const scramjetEnabled = import.meta.env.VITE_ENABLE_SCRAMJET === 'true';
const normalizeWispEndpoint = (value) => {
  if (typeof value !== 'string') return '';
  let out = value.trim();
  if (!out) return '';

  if (/^https?:\/\//i.test(out)) {
    out = out.replace(/^http/i, 'ws');
  } else if (!/^wss?:\/\//i.test(out)) {
    out = `wss://${out}`;
  }

  if (!/\/wisp\/?$/i.test(out)) {
    out = `${out.replace(/\/+$/, '')}/wisp/`;
  } else if (!out.endsWith('/')) {
    out += '/';
  }

  return out;
};
const swTargets = [{ path: withBase('uv/sw.js') }];
if (scramjetEnabled) {
  swTargets.push({ path: withBase('s_sw.js'), scope: withBase('scramjet/') });
}

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
        if (!scramjetEnabled) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(
              regs
                .filter((reg) => String(reg?.scope || '').includes('/scramjet/'))
                .map((reg) => reg.unregister().catch(() => {})),
            );
          } catch {
            // Ignore cleanup failures and continue with UV registration.
          }
        }

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

      if (scramjetEnabled) {
        try {
          await ensureRuntime();
        } catch (err) {
          console.warn('Scramjet runtime init failed; continuing with UV only.', err);
        }
      }
      await ensureServiceWorkers();

      const connection = new BareMuxConnection(withBase('baremux/worker.js'));
      const envWisp = normalizeWispEndpoint(import.meta.env.VITE_WISP_URL);
      const customWisp = normalizeWispEndpoint(options.wServer) || envWisp;
      const discoveredWisp = staticMode && !customWisp ? await returnWServer() : '';
      const wispEndpoint = customWisp || (staticMode ? discoveredWisp : ws);

      if (mounted && staticMode) {
        setWispStatus(Boolean(wispEndpoint));
      }

      if (!wispEndpoint) {
        throw new Error('No working Wisp endpoint available');
      }

      await connection.setTransport(withBase('libcurl/index.mjs'), [
        {
          wisp: wispEndpoint,
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
