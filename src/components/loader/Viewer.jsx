import StaticError from './viewer/StaticError';
import { Loader } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const isProxyMode = (mode) => mode === 'uv' || mode === 'scr';

const looksLikeBagcatHome = (doc, pathName) => {
  const normalizedPath = String(pathName || '').toLowerCase();
  if (normalizedPath === '/' || normalizedPath === '/docs' || normalizedPath === '/docs/') return true;

  const title = String(doc?.title || '').toLowerCase();
  if (title.includes('bagcat')) return true;

  const searchInput = doc?.querySelector?.('input[placeholder="Search games"]');
  if (!searchInput) return false;

  const headings = Array.from(doc?.querySelectorAll?.('h1,h2,h3') || []);
  return headings.some((heading) => String(heading?.textContent || '').trim().toLowerCase() === 'popular');
};

export default function Viewer({ src, mode, zoom = 1, wispStatus, onFrameRefChange, onFrameIssue }) {
  const iframeRef = useRef(null);
  const issueReportedRef = useRef(false);
  const loadingRef = useRef(Boolean(src));
  const [loading, setLoading] = useState(Boolean(src));

  const staticMode = typeof isStaticBuild !== 'undefined' && isStaticBuild;
  const canRenderFrame = Boolean(src) && (!staticMode || mode === 'direct' || wispStatus === true);
  const showStaticError = staticMode && isProxyMode(mode) && wispStatus === false;
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
    loadingRef.current = Boolean(src);
    issueReportedRef.current = false;
  }, [src]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (!onFrameRefChange) return undefined;
    onFrameRefChange(iframeRef.current);
    return () => onFrameRefChange(null);
  }, [onFrameRefChange, src]);

  const markFrameIssue = useCallback(
    (reason) => {
      if (!onFrameIssue || issueReportedRef.current) return;
      issueReportedRef.current = true;
      onFrameIssue(reason);
    },
    [onFrameIssue],
  );

  useEffect(() => {
    if (!src || !onFrameIssue) return undefined;
    const timeoutMs = isProxyMode(mode) ? 12000 : 18000;
    const timer = setTimeout(() => {
      if (!loadingRef.current) return;
      markFrameIssue('timeout');
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [src, mode, onFrameIssue, markFrameIssue]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    if (!isProxyMode(mode) || !onFrameIssue || issueReportedRef.current) return;

    try {
      const doc = iframeRef.current?.contentDocument;
      const pathName = iframeRef.current?.contentWindow?.location?.pathname;

      if (
        doc?.getElementById('errorTrace-wrapper') ||
        doc?.getElementById('fetchedURL') ||
        looksLikeBagcatHome(doc, pathName)
      ) {
        markFrameIssue('proxy');
      }
    } catch {
      // Cross-origin frame reads can fail in direct mode; ignore.
    }
  }, [mode, onFrameIssue, markFrameIssue]);

  const handleError = useCallback(() => {
    setLoading(false);
    markFrameIssue('error');
  }, [markFrameIssue]);

  return (
    <div className="relative w-full h-full bg-[#070e15]">
      {canRenderFrame && (
        <iframe
          ref={iframeRef}
          src={src}
          style={iframeStyle}
          className="absolute inset-0 w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
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
