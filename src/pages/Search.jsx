import { useCallback, useEffect, useState } from 'react';
import Viewer from '../components/loader/Viewer';
import useReg from '../utils/hooks/loader/useReg';
import { launchGame } from '../utils/api';
import { withBase } from '../utils/assetUrl';

const DEFAULT_MODE = 'uv';

export default function Search({ app, zoom, onRemoteFrameChange }) {
  const { proxyReady, wispStatus } = useReg();
  const [attempt, setAttempt] = useState(0);
  const [launchPath, setLaunchPath] = useState('');
  const [launchMode, setLaunchMode] = useState(DEFAULT_MODE);
  const [launchError, setLaunchError] = useState('');

  const gameId = typeof app?.id === 'string' ? app.id : '';

  const handleFrameIssue = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    setAttempt(0);
    setLaunchPath('');
    setLaunchMode(DEFAULT_MODE);
    setLaunchError('');
  }, [gameId]);

  useEffect(() => {
    if (!gameId) {
      setLaunchError('Game is unavailable.');
      return undefined;
    }
    if (!proxyReady) return undefined;

    let mounted = true;
    const controller = new AbortController();

    setLaunchPath('');
    setLaunchError('');

    launchGame(gameId, controller.signal)
      .then((payload) => {
        if (!mounted) return;
        const nextPath = typeof payload?.playUrl === 'string' ? payload.playUrl : '';
        if (!nextPath) {
          setLaunchError('Launch failed. Please try again.');
          return;
        }
        setLaunchPath(nextPath);
        setLaunchMode(payload?.mode === 'scr' ? 'scr' : 'uv');
      })
      .catch((error) => {
        if (!mounted || error?.name === 'AbortError') return;
        setLaunchError('Launch failed. Please try again.');
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [proxyReady, gameId, attempt]);

  const frameUrl = launchPath ? withBase(launchPath) : '';

  return (
    <div className="relative w-full h-full">
      <Viewer
        src={frameUrl}
        mode={launchMode}
        zoom={zoom}
        wispStatus={wispStatus}
        onFrameRefChange={onRemoteFrameChange}
        onFrameIssue={handleFrameIssue}
      />
      {launchError && (
        <div className="absolute inset-0 z-30 grid place-items-center text-sm text-white/75 px-6 text-center bg-[#070e15]/80">
          {launchError}
        </div>
      )}
    </div>
  );
}
