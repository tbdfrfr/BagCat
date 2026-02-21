import { lazy } from 'react';
import NProgress from 'nprogress';

const lazyWrapper = (importFn) => {
  return lazy(() => {
    NProgress.start();
    return importFn()
      .then((module) => module)
      .catch((err) => {
        console.error('Lazy loading failed:', err);
        throw err;
      })
      .finally(() => NProgress.done());
  });
};

export default lazyWrapper;
