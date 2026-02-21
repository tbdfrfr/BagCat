import { useRef, useState, useCallback } from 'react';
import Search from '../../pages/Search';
import { Maximize2, SquareArrowOutUpRight, ZoomIn, ZoomOut, Cloud, HardDrive } from 'lucide-react';
import { useLocalGmLoader } from '../../utils/hooks/player/useLocalGmLoader';
import Control from './Controls';
import InfoCard from './InfoCard';
import clsx from 'clsx';
import Tooltip from '@mui/material/Tooltip';

const Loader = ({ app }) => {
  const gmRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [remoteFrame, setRemoteFrame] = useState(null);
  const { gmUrl, loading, downloading } = useLocalGmLoader(app);
  const isLocal = app?.local;

  const fs = useCallback(() => {
    if (gmRef.current) {
      gmRef.current?.requestFullscreen?.();
    } else if (remoteFrame) {
      //browser restricts fullscreen w/o some sort of user interaction
      //using boolean to decide fs wont work so we directly use frame reference
      remoteFrame?.requestFullscreen?.();
    }
  }, [remoteFrame]);

  const normalizeExternalUrl = useCallback((value) => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return /^(https?:)?\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }, []);

  const external = useCallback(() => {
    const href = normalizeExternalUrl(app?.url);
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [app?.url, normalizeExternalUrl]);

  const handleZoom = useCallback((direction) => {
    setZoom((prev) => {
      const newZoom = direction === 'in' ? Math.min(prev + 0.1, 2) : Math.max(prev - 0.1, 0.5);
      if (gmRef.current) gmRef.current.style.zoom = newZoom;
      return newZoom;
    });
  }, []);

  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return (
    <div
      className={clsx(
        'flex flex-col w-full overflow-hidden rounded-2xl',
        'bg-[rgba(12,20,34,0.64)] backdrop-blur-xl border border-white/20',
        'shadow-[0_24px_70px_rgba(0,0,0,0.35)]',
        'h-[calc(100vh-128px)] min-h-[460px]',
      )}
    >
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-3">
        <InfoCard app={app} />
        <div className="ml-auto flex items-center gap-2">
          <Tooltip title={isLocal ? 'Downloaded to device (local)' : 'Fetched from web'} arrow placement="top">
            <div className="h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 flex items-center gap-2 text-xs text-white/75">
              {isLocal ? <HardDrive size={14} className="opacity-80" /> : <Cloud size={14} className="opacity-80" />}
              <span>{isLocal ? 'Local' : 'Web'}</span>
            </div>
          </Tooltip>

          {!isLocal && (
            <Control icon={SquareArrowOutUpRight} fn={external} title="Open in new tab" />
          )}
          {isLocal && (
            <Control icon={SquareArrowOutUpRight} fn={null} title="Local games can't open in browser" disabled />
          )}

          <Control icon={ZoomOut} fn={() => handleZoom('out')} title="Zoom out" />
          <div className="min-w-12 h-9 rounded-lg bg-white/5 border border-white/15 grid place-items-center text-xs text-white/70">
            {zoomLabel}
          </div>
          <Control icon={ZoomIn} fn={() => handleZoom('in')} title="Zoom in" />
          <Control icon={Maximize2} fn={fs} title="Fullscreen" />
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4">
        <div className="w-full h-full rounded-xl overflow-hidden border border-white/12 bg-[#070e15]/80">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-white/70">
              {downloading ? 'Downloading game files...' : 'Loading game...'}
            </div>
          ) : isLocal ? (
            <iframe
              key={gmUrl}
              src={gmUrl}
              ref={gmRef}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock"
            />
          ) : (
            <Search app={app} zoom={zoom} onRemoteFrameChange={setRemoteFrame} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Loader;
