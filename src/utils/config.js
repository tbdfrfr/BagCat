const base = import.meta.env.BASE_URL || '/';
const withBase = (p) => `${base}${String(p || '').replace(/^\\//, '')}`;

// In static (GitHub Pages) builds we don't have a backend to proxy `/assets/*`,
// so point these icons directly at the CDN used elsewhere in the static build.
const assetCdn = 'https://cdn.jsdelivr.net/gh/DogeNetwork/v5-assets/img/';
const isStatic = typeof isStaticBuild !== 'undefined' && isStaticBuild;
const assetIcon = (p) => {
  const path = String(p || '');
  if (isStatic) return assetCdn + path.replace(/^\\/assets\\/img\\//, '');
  return withBase(path);
};

export const meta = [
  {
    option: 'Default',
    value: {
      tabName: 'BagCat',
      tabIcon: withBase('header-image.png'),
    },
  },
  {
    option: 'Google',
    value: {
      tabName: 'Google',
      tabIcon: 'https://google.com/favicon.ico',
    },
  },
  {
    option: 'Bing',
    value: {
      tabName: 'Bing',
      tabIcon: 'https://bing.com/favicon.ico',
    },
  },
  {
    option: 'Gmail',
    value: {
      tabName: 'Gmail',
      tabIcon: assetIcon('/assets/img/gmail.ico'),
    },
  },
  {
    option: 'Wikipedia',
    value: {
      tabName: 'Wikipedia',
      tabIcon: assetIcon('/assets/img/wikipedia.ico'),
    },
  },
  {
    option: 'Schoology',
    value: {
      tabName: 'Home | Schoology',
      tabIcon: assetIcon('/assets/img/schoology.ico'),
    },
  },
  {
    option: 'Google Classroom',
    value: {
      tabName: 'Home',
      tabIcon: assetIcon('/assets/img/classroom.png'),
    },
  },
  {
    option: 'ClassLink',
    value: {
      tabName: 'ClassLink',
      tabIcon: assetIcon('/assets/img/classlink.ico'),
    },
  },
  {
    option: 'Quizlet',
    value: {
      tabName: 'Quizlet: Study Tools & Learning Resources for Students and Teachers | Quizlet',
      tabIcon: assetIcon('/assets/img/quizlet.png'),
    },
  },
  {
    option: 'Big Ideas Math',
    value: {
      tabName: 'Big Ideas Math',
      tabIcon: assetIcon('/assets/img/bigideasmath.ico'),
    },
  },
  {
    option: 'Khan Academy',
    value: {
      tabName: 'Dashboard | Khan Academy',
      tabIcon: assetIcon('/assets/img/khan.png'),
    },
  },
];
