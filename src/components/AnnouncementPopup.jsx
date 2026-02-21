import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import fluidThemes from '../../fluid-themes.json';
import popupConfig from '../data/popup.json';
import versionData from '../data/version.json';
import { useOptions } from '../utils/optionsContext';

const STORAGE_KEY = 'bagcat.popup.version';
const COOKIE_KEY = 'bagcat_popup_version';
const DEFAULT_ACCENT = '#75b3e8';

const isHex = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());
const cleanString = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);
const isHomeRoute = (pathname) => pathname === '/' || pathname === '/docs' || pathname === '/docs/';

const themeList = Array.isArray(fluidThemes) ? fluidThemes : [];
const rawVersion = typeof versionData?.value === 'string' ? versionData.value.trim() : '1.0';
const popupVersion = rawVersion.replace(/^v/i, '') || '1.0';

const readCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const key = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const entry of cookies) {
    if (entry.startsWith(key)) {
      try {
        return decodeURIComponent(entry.slice(key.length));
      } catch {
        return entry.slice(key.length);
      }
    }
  }
  return '';
};

const writeCookie = (name, value, days = 365) => {
  if (typeof document === 'undefined') return;
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60));
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
};

const normalizeConfig = (config) => {
  const normalized = config && typeof config === 'object' ? config : {};
  const title = cleanString(normalized.title, 'Notice');
  const message = cleanString(normalized.message, '');
  const details = Array.isArray(normalized.details)
    ? normalized.details.map((item) => cleanString(item)).filter(Boolean)
    : [];

  return {
    enabled: normalized.enabled !== false,
    title,
    message,
    details,
    primaryButtonText: cleanString(normalized.primaryButtonText, 'Close'),
    secondaryButtonText: cleanString(normalized.secondaryButtonText),
    secondaryButtonUrl: cleanString(normalized.secondaryButtonUrl),
  };
};

export default function AnnouncementPopup() {
  const { options } = useOptions();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const config = useMemo(() => normalizeConfig(popupConfig), []);

  const accent = useMemo(() => {
    const selectedTheme = themeList.find((theme) => theme?.name === options.fluidThemeName);
    const themeAccent = selectedTheme?.color2;
    return isHex(themeAccent) ? themeAccent : DEFAULT_ACCENT;
  }, [options.fluidThemeName]);

  const close = useCallback(() => {
    writeCookie(COOKIE_KEY, popupVersion);
    try {
      localStorage.setItem(STORAGE_KEY, popupVersion);
    } catch {}
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!config.enabled || !isHomeRoute(location.pathname)) {
      setIsOpen(false);
      return;
    }

    try {
      const seenVersion = readCookie(COOKIE_KEY) || localStorage.getItem(STORAGE_KEY);
      setIsOpen(seenVersion !== popupVersion);
    } catch {
      setIsOpen(true);
    }
  }, [config.enabled, location.pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  if (!isOpen || typeof document === 'undefined') return null;

  const hasSecondary = Boolean(config.secondaryButtonText && config.secondaryButtonUrl);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="relative w-full max-w-xl rounded-xl border border-white/20 bg-[#141d2b]/95 backdrop-blur-lg shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/15 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{config.title}</h2>
          <button
            type="button"
            onClick={close}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-white/10"
            aria-label="Close popup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 text-sm">
          {config.message && <p className="text-white/90 leading-6">{config.message}</p>}
          {config.details.length > 0 && (
            <ul className="space-y-1 text-white/75">
              {config.details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-5 pb-5 flex items-center gap-2">
          {hasSecondary && (
            <a
              href={config.secondaryButtonUrl}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              {config.secondaryButtonText}
              <ExternalLink size={15} />
            </a>
          )}
          <button
            type="button"
            onClick={close}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-white ml-auto transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {config.primaryButtonText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
