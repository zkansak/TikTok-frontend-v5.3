import { lazy } from 'react';
import config from '~/config';
// Layout
import { HeaderOnly } from '~/layouts';

// Pages - 使用懒加载优化性能
const Home = lazy(() => import('~/pages/Home'));
const Following = lazy(() => import('~/pages/Following'));
const Activity = lazy(() => import('~/pages/Activity'));
const Explore = lazy(() => import('~/pages/Explore'));
const Profile = lazy(() => import('~/pages/Profile'));
const Upload = lazy(() => import('~/pages/Upload'));
const Search = lazy(() => import('~/pages/Search'));
const NotFound = lazy(() => import('~/pages/NotFound'));
const Live = lazy(() => import('~/pages/Live'));
const About = lazy(() => import('~/pages/About'));
const Music = lazy(() => import('~/pages/Music'));

const publicRoutes = [
  { path: config.routes.home, component: Home },
  { path: config.routes.following, component: Following },
  { path: config.routes.activity, component: Activity },
  { path: config.routes.explore, component: Explore },
  { path: config.routes.profile, component: Profile },
  { path: config.routes.upload, component: Upload, layout: HeaderOnly },
  { path: config.routes.search, component: Search, layout: null },
  { path: config.routes.live, component: Live },
  { path: config.routes.about, component: About },
  { path: config.routes.music, component: Music },
  { path: config.routes.notFound, component: NotFound, layout: null },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
