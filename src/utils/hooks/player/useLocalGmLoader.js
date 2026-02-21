import { useState, useEffect } from 'react';
import LocalGmLoader from '../../localGmLoader';

export const useLocalGmLoader = (app) => {
  const [gmUrl, setGmUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loader] = useState(() => new LocalGmLoader());

  useEffect(() => {
    let mounted = true;
    const gameUrl = app?.url;

    if (!app?.local || !gameUrl) {
      setGmUrl(null);
      setLoading(false);
      setDownloading(false);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        setLoading(true);
        const result = await loader.load(gameUrl, (isDownloading) => {
          if (mounted) setDownloading(Boolean(isDownloading));
        });
        if (mounted) setGmUrl(result.url);
      } catch (err) {
        console.error('error loading gm:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          setDownloading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [app?.local, app?.url, loader]);

  return { gmUrl, loading, downloading };
};
