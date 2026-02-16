import StaticError from './viewer/StaticError';
import { Loader } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Viewer({ src, zoom = 1, wispStatus, onFrameRefChange }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(Boolean(src));

  const staticMode = typeof isStaticBuild !== 'undefined' && isStaticBuild;
  const canRenderFrame = Boolean(src) && (!staticMode || wispStatus === true);
  const showStaticError = staticMode && wispStatus === false;
  const showLoading = !showStaticError && (loading || !canRenderFrame);

  const scale = clamp(Number(zoom) || 1, 0.5, 2);
  const iframeStyle = useMemo(
    () => ({
      display: 'block',
      width: `${100 / scale}%`,
      height: `${100 / scale}%`,
      transform: scale === 1 ? undefined : `scale(${scale})`,
      transformOrigin: 'top left',
    }),
    [scale],
  );

  useEffect(() => {
    setLoading(Boolean(src));
  }, [src]);

  useEffect(() => {
    if (!onFrameRefChange) return undefined;
    onFrameRefChange(iframeRef.current);
    return () => onFrameRefChange(null);
  }, [onFrameRefChange, src]);

  return (
    <div className="relative w-full h-full bg-[#070e15]">
      {canRenderFrame && (
        <iframe
          ref={iframeRef}
          src={src}
          style={iframeStyle}
          className="absolute inset-0 w-full h-full"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      )}

      {showLoading && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center z-20">
          <Loader size={32} className="animate-spin" />
        </div>
      )}

      {showStaticError && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center z-20">
          <StaticError />
        </div>
      )}
    </div>
  );
}
