import { HomePage } from './pages/HomePage';
import { SudokuLitePage } from './pages/SudokuLitePage';
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
  },
  {
    path: '/demo/sudoku-lite',
    label: 'Sudoku Lite',
    Component: SudokuLitePage
  }
] as const;
