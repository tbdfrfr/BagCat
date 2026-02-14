import { useNavigate } from 'react-router-dom';
import { useOptions } from '/src/utils/optionsContext';
import nav from '../styles/nav.module.css';
import clsx from 'clsx';
import { memo, useMemo, useCallback } from 'react';

const version = 'v1.1';

const Nav = memo(() => {
  const navigate = useNavigate();
  const { options } = useOptions();

  const scale = Number(options.navScale || 1);
  const dimensions = useMemo(
    () => ({
      navHeight: Math.round(69 * scale),
      headerFont: Math.round(24 * scale),
      versionFont: Math.round(11 * scale),
      imageSize: Math.round(48 * scale),
    }),
    [scale],
  );

  const goMainMenu = useCallback(() => navigate('/docs'), [navigate]);

  return (
    <div
      className={clsx(
        nav.nav,
        'bg-black/55 backdrop-blur-md border-b border-white/25',
        'w-full shadow-x1/20 flex items-center justify-center px-4 z-50',
      )}
      style={{ height: `${dimensions.navHeight}px` }}
    >
      <button type="button" onClick={goMainMenu} className="flex items-center gap-2 cursor-pointer">
        <img
          src="/header-image.png"
          alt="Header"
          className="rounded-md object-cover"
          style={{ width: `${dimensions.imageSize}px`, height: `${dimensions.imageSize}px` }}
        />
        <span className="font-semibold tracking-wide" style={{ fontSize: `${dimensions.headerFont}px` }}>
          Bagcat
        </span>
        <span
          className="border rounded-full text-center px-2 py-0.5 bg-black/35 border-white/30"
          style={{ fontSize: `${dimensions.versionFont}px` }}
        >
          {version}
        </span>
      </button>
    </div>
  );
});

Nav.displayName = 'Nav';
export default Nav;
