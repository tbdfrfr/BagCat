import Routing from './Routing';
import ReactGA from 'react-ga4';
import lazyLoad from './lazyWrapper';
import { useEffect, memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { OptionsProvider, useOptions } from './utils/optionsContext';
import FluidBackground from './components/FluidBackground';
import AnnouncementPopup from './components/AnnouncementPopup';
import Player from './pages/Player';
import './index.css';
import 'nprogress/nprogress.css';

const importGms = () => import('./layouts/Apps2');

const Apps2 = lazyLoad(importGms);

const pages = [
  { path: '/', element: <Navigate to="/docs" replace /> },
  { path: '/docs', element: <Apps2 /> },
  { path: '/docs/r', element: <Player /> },
  { path: '*', element: <Navigate to="/docs" replace /> },
];

function useTracking() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);
}

const readSolidBackground = (value) =>
  typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : '#000000';

const MainApp = memo(() => {
  useTracking();
  const { options } = useOptions();
  const fluidEnabled = options.fluidBackgroundEnabled !== false;
  const appBackground = fluidEnabled ? '#000000' : readSolidBackground(options.solidBackgroundColor);

  return (
    <>
      <FluidBackground />
      <AnnouncementPopup />
      <div className="relative z-10">
        <Routing pages={pages} />
      </div>
      <style>{`html, body, #root { background-color: ${appBackground} !important; background-image: none !important; min-height: 100%; } body { color: #e5e7eb; }`}</style>
    </>
  );
});

MainApp.displayName = 'MainApp';

const App = () => (
  <OptionsProvider>
    <MainApp />
  </OptionsProvider>
);

export default App;
