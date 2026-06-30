import React from 'react';
import { createRoot } from 'react-dom/client';
import { routes } from './routes';
import './styles.css';

function App() {
  const route = routes.find((item) => item.path === window.location.pathname) ?? routes[0];
  const Page = route.Component;

  return <Page />;
}

createRoot(document.getElementById('root')!).render(<App />);
