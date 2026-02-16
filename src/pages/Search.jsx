import Tabs from '/src/components/loader/Tabs';
import Omnibox from '/src/components/loader/Omnibox';
import Viewer from '/src/components/loader/Viewer';
import Menu from '/src/components/loader/Menu';
import useReg from '/src/utils/hooks/loader/useReg';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { process } from '/src/utils/hooks/loader/utils';
import { useOptions } from '../utils/optionsContext';
import { useEffect } from 'react';
import { Loader as Spinner } from 'lucide-react';

export default function Loader({ url, ui = true, zoom }) {
  useReg();
  const { options } = useOptions();
  const tabs = loaderStore((state) => state.tabs);
  const updateUrl = loaderStore((state) => state.updateUrl);
  const proxyReady = loaderStore((state) => state.proxyReady);
  const barStyle = {
    backgroundColor: options.barColor || '#09121e',
  };

  useEffect(() => {
    if (url && tabs.length > 0 && proxyReady) {
      //only 1 tab on initial load so tabs[0]
      const tab = tabs[0];
      const processedUrl = process(url, false, options.prType || 'auto', options.engine || null);
      if (tab.url !== processedUrl) {
        updateUrl(tab.id, processedUrl);
      }
    }
  }, [url, tabs, updateUrl, options.prType, options.engine, proxyReady]);

  useEffect(() => {
    loaderStore.getState().clearStore({ showTb: options.showTb ?? true });
  }, []);

  return (
    <div className="flex flex-col w-full h-screen">
      {ui && (
        <>
          <div 
            className="flex flex-col w-full" 
            style={barStyle}
            onClick={() => loaderStore.getState().showMenu && loaderStore.getState().toggleMenu()}
          >
            <Tabs />
            <Omnibox />
          </div>
          <Menu />
        </>
      )}
      <div 
        className="flex-1 w-full"
        onClick={() => loaderStore.getState().showMenu && loaderStore.getState().toggleMenu()}
      >
        {!proxyReady && url ? (
          <div className="w-full h-full flex items-center justify-center gap-2 text-sm opacity-80">
            <Spinner size={18} className="animate-spin" />
            Initializing proxy...
          </div>
        ) : (
          <Viewer zoom={zoom} />
        )}
      </div>
    </div>
  );
}
