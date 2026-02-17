import { withBase } from './assetUrl';

const assetIcon = (p) => withBase(p);

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
