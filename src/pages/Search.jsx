import { useCallback, useEffect, useMemo, useState } from 'react';
import Viewer from '/src/components/loader/Viewer';
import useReg from '/src/utils/hooks/loader/useReg';
import { process, resolveProxyMode } from '/src/utils/hooks/loader/utils';
import { useOptions } from '../utils/optionsContext';

export default function Search({ url, zoom, onRemoteFrameChange }) {
  const { options } = useOptions();
  const { proxyReady, wispStatus } = useReg();
  const [attemptIndex, setAttemptIndex] = useState(0);

  const preferredMode = useMemo(
    () => resolveProxyMode(url, options.prType || 'auto', options.engine || null),
    [url, options.prType, options.engine],
  );

  const attemptModes = useMemo(() => {
    const type = options.prType || 'auto';
    if (type !== 'auto') return [preferredMode];

    const modes = [preferredMode];
    if (preferredMode !== 'uv') modes.push('uv');
    if (preferredMode !== 'scr') modes.push('scr');
    return modes;
  }, [preferredMode, options.prType]);

  useEffect(() => {
    setAttemptIndex(0);
  }, [url, options.prType, options.engine]);

  const activeMode = attemptModes[Math.min(attemptIndex, attemptModes.length - 1)] || preferredMode;

  const frameUrl = useMemo(() => {
    if (!url) return '';
    if (!proxyReady) return '';
    return process(url, false, activeMode, options.engine || null);
  }, [url, activeMode, proxyReady, options.engine]);

  const handleFrameIssue = useCallback(() => {
    if (!frameUrl) return;
    setAttemptIndex((current) => Math.min(current + 1, Math.max(0, attemptModes.length - 1)));
  }, [frameUrl, attemptModes.length]);

  return (
    <Viewer
      src={frameUrl}
      mode={activeMode}
      zoom={zoom}
      wispStatus={wispStatus}
      onFrameRefChange={onRemoteFrameChange}
      onFrameIssue={handleFrameIssue}
    />
  );
}
