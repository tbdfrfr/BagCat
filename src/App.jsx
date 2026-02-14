import Routing from './Routing';
import ReactGA from 'react-ga4';
import lazyLoad from './lazyWrapper';
import { useEffect, useMemo, memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { OptionsProvider } from './utils/optionsContext';
import { initPreload } from './utils/preload';
import FluidBackground from './components/FluidBackground';
import './index.css';
import 'nprogress/nprogress.css';

const importGms = () => import('./pages/Apps2');

const Apps2 = lazyLoad(importGms);
const Player = lazyLoad(() => import('./pages/Player'));

initPreload('/docs', importGms);

function useTracking() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);
}

const MainApp = memo(() => {
  useTracking();

  const pages = useMemo(
    () => [
      { path: '/', element: <Navigate to="/docs" replace /> },
      { path: '/docs', element: <Apps2 /> },
      { path: '/docs/r', element: <Player /> },
      { path: '*', element: <Navigate to="/docs" replace /> },
    ],
    [],
  );

  return (
    <>
      <FluidBackground />
      <div className="relative z-10">
        <Routing pages={pages} />
      </div>
      <style>{`html, body, #root { background-color: #000 !important; background-image: none !important; min-height: 100%; } body { color: #e5e7eb; }`}</style>
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
