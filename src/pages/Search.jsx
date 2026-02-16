import { useMemo } from 'react';
import Viewer from '/src/components/loader/Viewer';
import useReg from '/src/utils/hooks/loader/useReg';
import { process } from '/src/utils/hooks/loader/utils';
import { useOptions } from '../utils/optionsContext';

export default function Search({ url, zoom, onRemoteFrameChange }) {
  const { options } = useOptions();
  const { proxyReady, wispStatus } = useReg();

  const frameUrl = useMemo(() => {
    if (!proxyReady || !url) return '';
    return process(url, false, options.prType || 'auto', options.engine || null);
  }, [proxyReady, url, options.prType, options.engine]);

  return <Viewer src={frameUrl} zoom={zoom} wispStatus={wispStatus} onFrameRefChange={onRemoteFrameChange} />;
}
