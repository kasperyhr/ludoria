import { HomePage } from './pages/HomePage';
import { TokenBluffingDemoPage } from './pages/TokenBluffingDemoPage';

export const routes = [
  {
    path: '/',
    label: 'Game Hall',
    Component: HomePage
  },
  {
    path: '/demo/token-bluffing',
    label: 'Token Bluffing Demo',
    Component: TokenBluffingDemoPage
  }
] as const;
