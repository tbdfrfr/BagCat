import { startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import ReactGA from 'react-ga4';
import App from './App';
import './utils/utils.js';

typeof window != 'undefined' &&
  ('requestIdleCallback' in window
    ? requestIdleCallback(() => ReactGA.initialize('G-HWLK0PZVBM'))
    : setTimeout(() => ReactGA.initialize('G-HWLK0PZVBM'), 0));

const root = createRoot(document.getElementById('root'));

const Router = typeof isStaticBuild !== 'undefined' ? (isStaticBuild ? HashRouter : BrowserRouter) : BrowserRouter;

startTransition(() => {
  root.render(
    <Router>
      <App />
    </Router>,
  );
});
