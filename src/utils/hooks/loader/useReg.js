import { useEffect } from 'react';
import { BareMuxConnection } from '@mercuryworkshop/bare-mux';
import { useOptions } from '/src/utils/optionsContext';
import { fetchW as returnWServer } from './findWisp';
import store from './useLoaderStore';

const base = import.meta.env.BASE_URL || '/';
const withBase = (p) => `${base}${String(p || '').replace(/^\\//, '')}`;

export default function useReg() {
  const { options } = useOptions();
  const ws = `${location.protocol == 'http:' ? 'ws:' : 'wss:'}//${location.host}/wisp/`;
  const sws = [
    { path: withBase('uv/sw.js') },
    { path: withBase('s_sw.js'), scope: withBase('scramjet/') },
  ];
  const setWispStatus = store((s) => s.setWispStatus);

  useEffect(() => {
    const init = async () => {
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

      for (const sw of sws) {
        try {
          await navigator.serviceWorker.register(
            sw.path,
            sw.scope ? { scope: sw.scope } : undefined,
          );
        } catch (err) {
          console.warn(`SW reg err (${sw.path}):`, err);
        }
      }

      const connection = new BareMuxConnection(withBase('baremux/worker.js'));
      typeof isStaticBuild !== 'undefined' && isStaticBuild && setWispStatus('init');
      let socket = typeof isStaticBuild !== 'undefined' && isStaticBuild ? await returnWServer() : null;
      typeof isStaticBuild !== 'undefined' && isStaticBuild && (!socket ? setWispStatus(false) : setWispStatus(true));

      await connection.setTransport(withBase('libcurl/index.mjs'), [
        {
          wisp:
            options.wServer != null && options.wServer !== ''
              ? options.wServer
              : typeof isStaticBuild !== 'undefined' && isStaticBuild
                ? socket
                : ws,
        },
      ]);
    };

    init();
  }, [options.wServer]);
}
